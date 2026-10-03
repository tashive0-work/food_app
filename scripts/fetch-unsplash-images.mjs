import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// ── 1. 환경 변수 로드 ──
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.local 파일을 찾을 수 없습니다.');
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const getEnv = (key) => {
    const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
    if (!match) return null;
    return match[1].trim().replace(/^['"]|['"]$/g, '');
  };

  const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
  const unsplashKey = getEnv('UNSPLASH_ACCESS_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL 또는 Service Role Key가 누락되었습니다.');
  }
  if (!unsplashKey) {
    throw new Error('UNSPLASH_ACCESS_KEY 가 .env.local에 설정되지 않았습니다.');
  }

  return { supabaseUrl, supabaseKey, unsplashKey };
}

// ── 2. CLI 인자 파싱 ──
function parseArgs() {
  const args = process.argv.slice(2);
  let limit = 45;
  let isDryRun = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--dry-run') {
      isDryRun = true;
    } else if (arg === '--limit' && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    } else if (arg.startsWith('--limit=')) {
      limit = parseInt(arg.split('=')[1], 10);
    }
  }

  return { limit: isNaN(limit) ? 45 : limit, isDryRun };
}

// ── 3. 메인 함수 ──
async function main() {
  const { limit, isDryRun } = parseArgs();
  const { supabaseUrl, supabaseKey, unsplashKey } = loadEnv();

  console.log(`=================================================================`);
  console.log(`[Unsplash 2단계] 메뉴 사진 정보 가져오기`);
  console.log(`- 모드: ${isDryRun ? 'DRY-RUN (DB 미반영)' : 'PRODUCTION (DB 즉시 저장)'}`);
  console.log(`- 처리 대상 수: 최대 ${limit}개`);
  console.log(`- 키 확인: UNSPLASH_ACCESS_KEY 로드 완료 (${unsplashKey.length}자)`);
  console.log(`=================================================================\n`);

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // (1) 이미 DB에 등록된 unsplash_id 수집 (중복 사진 방지용)
  const usedUnsplashIds = new Set();
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('foods')
      .select('unsplash_id')
      .not('unsplash_id', 'is', null)
      .range(from, from + PAGE - 1);

    if (error) {
      console.error(`[DB 조회 오류 (unsplash_id)]: ${error.message}`);
      break;
    }
    if (data) {
      data.forEach((row) => {
        if (row.unsplash_id) usedUnsplashIds.add(row.unsplash_id);
      });
    }
    if (!data || data.length < PAGE) break;
  }
  console.log(`[중복 방지] 기존 DB에 등록된 사진 ID: ${usedUnsplashIds.size}개`);

  // (2) 대상 메뉴 조회: image_query 가 있고 image_status = 'none' 인 메뉴, id 오름차순
  const { data: targetFoods, error: targetError } = await supabase
    .from('foods')
    .select('id, name, kind, image_query, image_status')
    .not('image_query', 'is', null)
    .eq('image_status', 'none')
    .order('id', { ascending: true })
    .limit(limit);

  if (targetError) {
    throw new Error(`[DB 대상 메뉴 조회 실패]: ${targetError.message}`);
  }

  if (!targetFoods || targetFoods.length === 0) {
    console.log(`[알림] 처리할 대상(image_status = 'none')이 없습니다. 모든 메뉴가 처리 완료되었습니다.`);
    return;
  }

  console.log(`[대상] 처리할 메뉴 수: ${targetFoods.length}개 (id ${targetFoods[0].id} ~ ${targetFoods[targetFoods.length - 1].id})\n`);

  const results = [];
  let successCount = 0;
  let fallbackCount = 0;
  let failCount = 0;
  let rateLimitHalted = false;

  for (let i = 0; i < targetFoods.length; i++) {
    const item = targetFoods[i];
    const query = item.image_query.trim();
    const progress = `(${i + 1}/${targetFoods.length})`;

    const apiUrl = new URL('https://api.unsplash.com/search/photos');
    apiUrl.searchParams.set('query', query);
    apiUrl.searchParams.set('per_page', '5');
    apiUrl.searchParams.set('orientation', 'squarish');
    apiUrl.searchParams.set('content_filter', 'high');

    try {
      const res = await fetch(apiUrl.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Client-ID ${unsplashKey}`,
          'Accept-Version': 'v1',
        },
      });

      // 레이트 리밋 헤더 확인
      const limitHeader = res.headers.get('x-ratelimit-limit');
      const remainingHeader = res.headers.get('x-ratelimit-remaining');
      const resetHeader = res.headers.get('x-ratelimit-reset');

      const remaining = remainingHeader !== null ? parseInt(remainingHeader, 10) : 999;
      const resetEpoch = resetHeader !== null ? parseInt(resetHeader, 10) : 0;

      if (!res.ok) {
        const errText = await res.text();
        console.error(`  [오류] ${progress} [${item.id}] ${item.name}: Unsplash HTTP ${res.status} - ${errText}`);
        failCount++;
        results.push({
          id: item.id,
          name: item.name,
          image_query: query,
          status: 'error',
          error: `HTTP ${res.status}`,
        });

        // 403 / 429 레이트 리밋 도달 시 중단
        if (res.status === 403 || res.status === 429 || remaining <= 3) {
          const resetTimeStr = resetEpoch
            ? new Date(resetEpoch * 1000).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
            : '다음 시간(매시 정각)';
          console.warn(`\n🚨 [속도 제한 감지] Unsplash API 한도에 도달했습니다. (남은 요청: ${remaining})`);
          console.warn(`   -> 다음 실행 가능 시각: ${resetTimeStr}`);
          rateLimitHalted = true;
          break;
        }
        continue;
      }

      const data = await res.json();
      const photos = data.results || [];

      // 5장 중 이미 사용된 unsplash_id 제외하고 첫 번째 사진 선택
      const selected = photos.find((p) => !usedUnsplashIds.has(p.id));

      if (selected) {
        usedUnsplashIds.add(selected.id);
        const updatePayload = {
          image_url: selected.urls?.regular || null,
          image_thumb: selected.urls?.small || null,
          image_alt: `${item.name} 사진`,
          photographer_name: selected.user?.name || 'Unsplash',
          photographer_url: selected.user?.links?.html || 'https://unsplash.com',
          unsplash_id: selected.id,
          unsplash_download_location: selected.links?.download_location || null,
          image_status: 'auto',
          image_updated_at: new Date().toISOString(),
        };

        if (!isDryRun) {
          const { error: updateError } = await supabase
            .from('foods')
            .update(updatePayload)
            .eq('id', item.id);

          if (updateError) {
            console.error(`  [DB 오류] [${item.id}] ${item.name}: ${updateError.message}`);
            failCount++;
            results.push({
              id: item.id,
              name: item.name,
              image_query: query,
              status: 'error',
              error: updateError.message,
            });
            continue;
          }
        }

        successCount++;
        console.log(`  [성공] ${progress} [${item.id}] ${item.name} -> "${selected.id}" (${selected.user?.name || '작자미상'}) [남은 API: ${remaining}]`);
        results.push({
          id: item.id,
          name: item.name,
          image_query: query,
          image_thumb: updatePayload.image_thumb,
          photographer_name: updatePayload.photographer_name,
          unsplash_id: selected.id,
          status: 'auto',
        });
      } else {
        // 검색 결과가 0장이거나 5장 모두 중복인 경우 fallback
        const updatePayload = {
          image_url: null,
          image_thumb: null,
          image_alt: null,
          photographer_name: null,
          photographer_url: null,
          unsplash_id: null,
          unsplash_download_location: null,
          image_status: 'fallback',
          image_updated_at: new Date().toISOString(),
        };

        if (!isDryRun) {
          const { error: updateError } = await supabase
            .from('foods')
            .update(updatePayload)
            .eq('id', item.id);

          if (updateError) {
            console.error(`  [DB 오류 (fallback)] [${item.id}] ${item.name}: ${updateError.message}`);
          }
        }

        fallbackCount++;
        const reason = photos.length === 0 ? '검색 결과 0장' : '후보 사진 모두 중복';
        console.log(`  [대체] ${progress} [${item.id}] ${item.name} -> fallback (${reason}) [남은 API: ${remaining}]`);
        results.push({
          id: item.id,
          name: item.name,
          image_query: query,
          image_thumb: '-',
          photographer_name: '-',
          unsplash_id: '-',
          status: 'fallback',
        });
      }

      // X-Ratelimit-Remaining 이 3 이하인 경우 즉시 중단
      if (remaining <= 3) {
        const resetTimeStr = resetEpoch
          ? new Date(resetEpoch * 1000).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
          : '다음 시간(매시 정각)';
        console.warn(`\n🚨 [속도 제한 감지] Unsplash API 한도에 도달했습니다. (남은 요청: ${remaining})`);
        console.warn(`   -> 다음 실행 가능 시각: ${resetTimeStr}`);
        rateLimitHalted = true;
        break;
      }

      // API 호출 간 가벼운 딜레이 (200ms)
      await new Promise((r) => setTimeout(r, 200));
    } catch (err) {
      console.error(`  [예외] ${progress} [${item.id}] ${item.name}:`, err.message);
      failCount++;
      results.push({
        id: item.id,
        name: item.name,
        image_query: query,
        status: 'error',
        error: err.message,
      });
    }
  }

  // ── 4. 참고용: image_query 중복 분석 ──
  const allFoodsForStats = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('foods')
      .select('id, name, image_query')
      .not('image_query', 'is', null)
      .range(from, from + PAGE - 1);
    if (error || !data) break;
    allFoodsForStats.push(...data);
    if (data.length < PAGE) break;
  }

  const queryGroupMap = new Map();
  allFoodsForStats.forEach((f) => {
    const q = f.image_query.trim().toLowerCase();
    if (!queryGroupMap.has(q)) queryGroupMap.set(q, []);
    queryGroupMap.get(q).push(f.name);
  });
  const duplicateGroups = Array.from(queryGroupMap.entries()).filter(([_, names]) => names.length > 1);

  // ── 5. 결과 종합 보고서 출력 ──
  console.log(`\n==================== [Unsplash 2단계 실행 결과] ====================`);
  console.log(`1. 요약:`);
  console.log(`   - 처리 시도: ${results.length}건`);
  console.log(`   - 성공 (auto): ${successCount}건`);
  console.log(`   - 대체 (fallback): ${fallbackCount}건`);
  console.log(`   - 실패 (error): ${failCount}건`);
  if (rateLimitHalted) {
    console.log(`   - 비고: 속도 제한(Rate Limit) 도달로 안전하게 조기 중단됨`);
  }

  console.log(`\n2. 실행 상세 내역 표 (총 ${results.length}건):`);
  console.log(`| id | 메뉴명 | image_query | image_thumb 주소 | 작가 이름 | 상태 |`);
  console.log(`|---|---|---|---|---|---|`);
  results.forEach((r) => {
    console.log(`| ${r.id} | ${r.name} | ${r.image_query} | ${r.image_thumb || '-'} | ${r.photographer_name || '-'} | ${r.status} |`);
  });

  console.log(`\n3. 참고: 전체 DB 중 image_query 가 완전히 같은 메뉴 묶음`);
  console.log(`   - 총 묶음 수: ${duplicateGroups.length}개`);
  console.log(`   - 예시 5개:`);
  duplicateGroups.slice(0, 5).forEach(([q, names], idx) => {
    console.log(`     ${idx + 1}) "${q}" (${names.length}개 메뉴): ${names.join(', ')}`);
  });
  console.log(`===================================================================\n`);
}

main().catch((err) => {
  console.error('[치명적 오류]:', err);
  process.exit(1);
});
