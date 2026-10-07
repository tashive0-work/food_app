/**
 * scripts/gen-food-images.mjs
 *
 * Vertex AI (Google Cloud ADC) gemini-3.1-flash-image 모델을 사용하여
 * 메뉴 사진을 생성하고, sharp 로 webp 변환 후 Supabase Storage(food-images) 및 foods 테이블을 갱신합니다.
 *
 * 실행 예:
 *   node --env-file=.env.local scripts/gen-food-images.mjs
 *   node --env-file=.env.local scripts/gen-food-images.mjs --ids=1,4,29,82,277,173
 *   node --env-file=.env.local scripts/gen-food-images.mjs --limit=10
 *   node --env-file=.env.local scripts/gen-food-images.mjs --dry-run
 *   node --env-file=.env.local scripts/gen-food-images.mjs --contact-sheet-only
 */

import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnv() {
  for (const f of ['.env.local', '.env']) {
    const p = resolve(process.cwd(), f);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (process.env[m[1]] === undefined) process.env[m[1]] = v;
    }
  }
}

loadEnv();

const LOG_DIR = resolve(process.cwd(), 'logs');
const OUT_DIR = resolve(process.cwd(), 'scripts/out');
if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const LOG_FILE = resolve(LOG_DIR, 'gen-images.log');
const FAIL_FILE = resolve(LOG_DIR, 'failed-foods.json');
const CONTACT_SHEET_FILE = resolve(OUT_DIR, 'contact-sheet.html');

function log(msg) {
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const formatted = `[${ts}] ${msg}`;
  console.log(formatted);
  try {
    appendFileSync(LOG_FILE, formatted + '\n', 'utf8');
  } catch {}
}

const PROJECT_ID = (process.env.GOOGLE_CLOUD_PROJECT || 'project-aa6b8ed7-94bd-4715-a88').trim();
const LOCATION = (process.env.GOOGLE_CLOUD_LOCATION || 'global').trim();
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[gen-food-images] Supabase URL 또는 키가 설정되지 않았습니다.');
  process.exit(1);
}

// CLI args parsing
const args = process.argv.slice(2);
let targetIds = null;
let limit = null;
let isDryRun = false;
let contactSheetOnly = false;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--dry-run') {
    isDryRun = true;
  } else if (arg === '--contact-sheet-only') {
    contactSheetOnly = true;
  } else if (arg.startsWith('--ids=')) {
    targetIds = arg.slice(6).split(',').map((x) => Number(x.trim())).filter((x) => !isNaN(x));
  } else if (arg === '--ids' && args[i + 1]) {
    targetIds = args[++i].split(',').map((x) => Number(x.trim())).filter((x) => !isNaN(x));
  } else if (arg.startsWith('--delay=')) {
    paceMs = Math.max(1, parseInt(arg.slice(8), 10)) * 1000;
  } else if (arg.startsWith('--max-delay=')) {
    maxPaceMs = Math.max(1, parseInt(arg.slice(12), 10)) * 1000;
  } else if (arg.startsWith('--limit=')) {
    limit = parseInt(arg.slice(8), 10);
  } else if (arg === '--limit' && args[i + 1]) {
    limit = parseInt(args[++i], 10);
  }
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const ai = new GoogleGenAI({
  vertexai: true,
  project: PROJECT_ID,
  location: LOCATION,
});

const MODEL_NAME = 'gemini-3.1-flash-image';

/**
 * 분당 쿼터에 맞춰 스스로 속도를 조절합니다.
 *
 * 무료 체험판 프로젝트는 이 모델의 호출 한도가 낮아 429(RESOURCE_EXHAUSTED)가 자주 납니다.
 *
 * 실제 로그를 보면 간격을 51초로 벌린 뒤에도 429가 나고, 반대로 429 직후
 * 재시도에서는 바로 통과합니다. 즉 **간격을 벌리는 것은 효과가 거의 없고,
 * 재시도가 효과가 있습니다.** 그래서 429가 날 때마다 전체 속도를 늦추지 않고,
 * 재시도를 다 쓰고도 실패한 경우에만 늦춥니다.
 *
 *   --delay=30   시작 간격(초). 기본 20초
 *   --max-delay=180  최대 간격(초). 기본 180초
 */
let paceMs = 15000;
let maxPaceMs = 60000;
let okStreak = 0;

/** 재시도를 다 쓰고도 실패했을 때만 — 간격을 1.5배로 늘립니다 */
function slowDown() {
  okStreak = 0;
  const next = Math.min(Math.round(paceMs * 1.5), maxPaceMs);
  if (next !== paceMs) {
    paceMs = next;
    log(`[속도 조절] 쿼터 한도에 걸려 호출 간격을 ${Math.round(paceMs / 1000)}초로 늘립니다.`);
  }
}

/** 연속 성공 — 조심스럽게 간격을 줄입니다 */
function speedUp(baseMs) {
  okStreak += 1;
  if (okStreak < 4) return;
  okStreak = 0;
  const next = Math.max(Math.round(paceMs * 0.8), baseMs);
  if (next !== paceMs) {
    paceMs = next;
    log(`[속도 조절] 연속 성공 — 호출 간격을 ${Math.round(paceMs / 1000)}초로 줄입니다.`);
  }
}

/** Supabase 1000개 제한을 극복하는 전체 대상 메뉴 조회 */
async function fetchTargetFoods() {
  if (targetIds && targetIds.length > 0) {
    const { data, error } = await supabase
      .from('foods')
      .select('id, name, kind, image_query, image_status')
      .in('id', targetIds)
      .order('id', { ascending: true });
    if (error) throw new Error(`DB 조회 오류: ${error.message}`);
    return data || [];
  }

  const PAGE = 1000;
  const allFoods = [];
  for (let from = 0; ; from += PAGE) {
    const { data: page, error } = await supabase
      .from('foods')
      .select('id, name, kind, image_query, image_status')
      .eq('image_status', 'none')
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);

    if (error) throw new Error(`DB 조회 오류: ${error.message}`);
    if (!page || page.length === 0) break;
    allFoods.push(...page);
    if (page.length < PAGE) break;
    if (limit && allFoods.length >= limit) break;
    if (from > 100000) break;
  }

  if (limit && limit > 0) {
    return allFoods.slice(0, limit);
  }
  return allFoods;
}

/**
 * 메뉴가 「마시는 것」인지 판단합니다.
 *
 * 왜 필요한가: 생성 프롬프트가 음식 기준("한국에서 내는 방식대로, 접시나 그릇 하나에")이라
 * 모델이 모르는 음료 이름(루이보스·교쿠로·랍상소우총 등)을 만나면 그냥 한식을 그려 버렸습니다.
 * 실제로 다즐링 자리에 찌개, 루이보스 자리에 보쌈 사진이 들어갔습니다.
 */
const DRINK_WORDS = [
  '차', '커피', '라떼', '에이드', '주스', '스무디', '티', '음료', '쉐이크', '셰이크', '드링크',
  '소다', '콜라', '사이다', '우유', '요거트', '요구르트', '아메리카노', '에스프레소', '모카',
  '카푸치노', '마키아토', '프라푸치노', '프라페', '아포가토', '밀크', '워터', '즙', '원액',
  '식혜', '수정과', '숭늉', '미숫가루', '토닉', '펀치', '콤부차', '에일', '탄산', '생수',
  '콜드브루', '아인슈페너', '블랙', '브루',
];
/** 위 단어로 안 걸리는 음료 고유명사 */
const DRINK_NAMES = new Set([
  '캐모마일', '비체린', '얼그레이', '아이스초코', '히비스커스', '룽고', '암바사', '다즐링',
  '미과수', '랍상소우총', '페퍼민트', '플랫화이트', '생맥산', '포도봉봉', '레몬그라스',
  '리스트레토', '카페오레', '레모네이드', '샤케라토', '제호탕', '코르타도', '배숙', '교쿠로',
  '아삼', '루이보스', '마살라짜이', '솔의눈', '밀키스', '잉글리시 브렉퍼스트', '환타',
  '무알콜 모히토', '보리수단', '베리티', '마시는 식초',
]);

function isDrink(food) {
  if (food.kind !== '디저트·카페') return false;
  if (DRINK_NAMES.has(food.name)) return true;
  return DRINK_WORDS.some((w) => food.name.includes(w));
}

/** Gemini 이미지 생성 (429 지수 백오프) */
async function generateFoodImage(food, maxRetries = 6) {
  const queryStr = food.image_query ? food.image_query : food.name;
  const common = 'soft natural daylight, appetizing, nothing else in frame. No text, no letters, no logos, no watermarks, no hands, no people.';
  let prompt;
  if (isDrink(food)) {
    // 마시는 것 — 잔이나 컵에. 그릇에 담긴 음식이 나오면 안 됩니다.
    prompt = `A realistic drink photo of ${food.name} (${queryStr}), a beverage served in a clear glass or a cup as it is served in a Korean cafe, on a plain light warm-gray table, slightly above eye level, ${common} It must be a drink in a glass or cup — never a bowl of soup, stew, rice or any savory dish.`;
  } else if (food.kind === '디저트·카페') {
    // 디저트 — 접시에 한 조각
    prompt = `A realistic dessert photo of ${food.name} (${queryStr}), one serving plated on a small dessert plate as it is served in a Korean cafe, 45-degree angle, on a plain light warm-gray table, ${common}`;
  } else {
    prompt = `A realistic food photo of ${food.name} (${queryStr}), served as it is typically served in Korea, in one dish or bowl, 45-degree angle, on a plain light warm-gray table, ${common} No chopsticks touching food.`;
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      log(`[${food.id}] ${food.name} 이미지 생성 요청 중... (시도 ${attempt}/${maxRetries})`);
      const res = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          responseModalities: ['IMAGE'],
        },
      });

      const part = res.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
      if (!part || !part.inlineData?.data) {
        throw new Error('생성된 이미지 데이터(inlineData)가 응답에 없습니다.');
      }

      return Buffer.from(part.inlineData.data, 'base64');
    } catch (err) {
      const is429 = err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED');
      if (attempt < maxRetries) {
        const waitSec = is429 ? 15 * attempt : 5 * attempt;
        log(`[재시도 대기] ${food.name}(ID:${food.id}) 에러 발생 (${is429 ? '429 쿼터 한도' : err.message}). ${waitSec}초 후 재시도...`);
        await new Promise((r) => setTimeout(r, waitSec * 1000));
        continue;
      }
      if (is429) slowDown();   // 재시도를 다 쓰고도 안 된 경우에만
      throw err;
    }
  }
}

async function processFood(food) {
  try {
    if (isDryRun) {
      log(`[DRY-RUN] [${food.id}] ${food.name} (${food.image_query})`);
      return { success: true, id: food.id, name: food.name, dryRun: true };
    }

    const rawBuffer = await generateFoodImage(food, 6);

    // sharp: 800x800 webp (품질 80)
    const mainWebp = await sharp(rawBuffer)
      .resize(800, 800, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();

    // sharp: 400x400 webp (품질 80)
    const thumbWebp = await sharp(rawBuffer)
      .resize(400, 400, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();

    // Supabase Storage 업로드
    const mainPath = `${food.id}.webp`;
    const thumbPath = `${food.id}_thumb.webp`;

    const { error: mainUpErr } = await supabase.storage
      .from('food-images')
      .upload(mainPath, mainWebp, {
        contentType: 'image/webp',
        upsert: true,
      });

    if (mainUpErr) throw new Error(`메인 이미지 스토리지 업로드 실패: ${mainUpErr.message}`);

    const { error: thumbUpErr } = await supabase.storage
      .from('food-images')
      .upload(thumbPath, thumbWebp, {
        contentType: 'image/webp',
        upsert: true,
      });

    if (thumbUpErr) throw new Error(`썸네일 스토리지 업로드 실패: ${thumbUpErr.message}`);

    const { data: mainUrlData } = supabase.storage.from('food-images').getPublicUrl(mainPath);
    const { data: thumbUrlData } = supabase.storage.from('food-images').getPublicUrl(thumbPath);

    const imageUrl = mainUrlData.publicUrl;
    const imageThumb = thumbUrlData.publicUrl;

    // DB 업데이트
    const { error: dbErr } = await supabase
      .from('foods')
      .update({
        image_url: imageUrl,
        image_thumb: imageThumb,
        image_alt: `${food.name} 사진`,
        image_source: 'ai',
        image_status: 'auto',
        image_updated_at: new Date().toISOString(),
      })
      .eq('id', food.id);

    if (dbErr) throw new Error(`DB 업데이트 실패: ${dbErr.message}`);

    log(`[완료] [${food.id}] ${food.name} -> ${imageUrl}`);
    return {
      success: true,
      id: food.id,
      name: food.name,
      imageUrl,
      imageThumb,
    };
  } catch (err) {
    log(`[실패] [${food.id}] ${food.name} 3회 연속 실패로 건너뜀: ${err.message}`);
    return { success: false, id: food.id, name: food.name, error: err.message };
  }
}

/** 확인용 contact-sheet.html 생성 */
export async function generateContactSheet() {
  log('contact-sheet.html 생성 중...');
  const PAGE = 1000;
  const allFoods = [];
  for (let from = 0; ; from += PAGE) {
    const { data: page, error } = await supabase
      .from('foods')
      .select('id, name, kind, image_thumb, image_url, image_status')
      .eq('active', true)
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);

    if (error) {
      log(`contact-sheet DB 조회 실패: ${error.message}`);
      break;
    }
    if (!page || page.length === 0) break;
    allFoods.push(...page);
    if (page.length < PAGE) break;
  }

  const generatedCount = allFoods.filter((f) => f.image_thumb || f.image_url).length;

  // 카테고리별 그룹화
  const grouped = {};
  for (const f of allFoods) {
    const category = f.kind || '기타';
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push(f);
  }

  const categories = Object.keys(grouped).sort();

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI 메뉴 사진 현황 Contact Sheet</title>
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --accent: #38bdf8;
      --badge-done: #10b981;
      --badge-none: #64748b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      padding: 24px;
      line-height: 1.5;
    }
    header {
      max-width: 1400px;
      margin: 0 auto 32px;
      padding-bottom: 20px;
      border-bottom: 1px solid #334155;
    }
    h1 { font-size: 26px; font-weight: 700; margin-bottom: 8px; color: #fff; }
    .stats {
      display: flex;
      gap: 20px;
      font-size: 14px;
      color: var(--text-muted);
      margin-top: 12px;
      flex-wrap: wrap;
    }
    .stat-badge {
      background: #334155;
      padding: 4px 12px;
      border-radius: 9999px;
      color: #e2e8f0;
    }
    .stat-badge strong { color: var(--accent); }
    .container { max-width: 1400px; margin: 0 auto; }
    .category-section { margin-bottom: 40px; }
    .category-title {
      font-size: 20px;
      font-weight: 600;
      color: var(--accent);
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .category-count {
      font-size: 13px;
      color: var(--text-muted);
      font-weight: normal;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 16px;
    }
    .card {
      background: var(--card-bg);
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #334155;
      display: flex;
      flex-direction: column;
      transition: transform 0.15s, border-color 0.15s;
    }
    .card:hover {
      transform: translateY(-2px);
      border-color: var(--accent);
    }
    .img-wrap {
      width: 100%;
      aspect-ratio: 1 / 1;
      background: #090d16;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .img-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .placeholder {
      font-size: 11px;
      color: var(--text-muted);
      text-align: center;
      padding: 8px;
    }
    .info {
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .name {
      font-size: 13px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .id-tag {
      font-size: 11px;
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🍳 AI 메뉴 사진 전체 현황 (Contact Sheet)</h1>
      <div class="stats">
        <div class="stat-badge">전체 메뉴: <strong>${allFoods.length}개</strong></div>
        <div class="stat-badge">사진 생성 완료: <strong>${generatedCount}개</strong> (${((generatedCount / (allFoods.length || 1)) * 100).toFixed(1)}%)</div>
        <div class="stat-badge">미생성: <strong>${allFoods.length - generatedCount}개</strong></div>
        <div class="stat-badge">생성 시각: <strong>${new Date().toLocaleString('ko-KR')}</strong></div>
      </div>
    </header>

    ${categories
      .map(
        (cat) => `
    <section class="category-section">
      <h2 class="category-title">
        ${cat} <span class="category-count">(${grouped[cat].filter((f) => f.image_thumb || f.image_url).length}/${grouped[cat].length} 완료)</span>
      </h2>
      <div class="grid">
        ${grouped[cat]
          .map((food) => {
            const imgSrc = food.image_thumb || food.image_url;
            return `
        <div class="card">
          <div class="img-wrap">
            ${
              imgSrc
                ? `<img src="${imgSrc}" alt="${food.name}" loading="lazy">`
                : `<div class="placeholder">대기 중<br>(none)</div>`
            }
          </div>
          <div class="info">
            <span class="name" title="${food.name}">${food.name}</span>
            <span class="id-tag">#${food.id}</span>
          </div>
        </div>`;
          })
          .join('')}
      </div>
    </section>`
      )
      .join('')}
  </div>
</body>
</html>`;

  writeFileSync(CONTACT_SHEET_FILE, html, 'utf8');
  log(`contact-sheet.html 생성 완료: ${CONTACT_SHEET_FILE}`);
}

async function main() {
  if (contactSheetOnly) {
    await generateContactSheet();
    return;
  }

  const startTime = Date.now();
  log(`=== Vertex AI 메뉴 사진 생성기 시작 ===`);
  log(`프로젝트: ${PROJECT_ID}, 리전: ${LOCATION}, 모델: ${MODEL_NAME}`);
  if (isDryRun) log(`모드: DRY-RUN`);

  const foods = await fetchTargetFoods();
  log(`총 대상 메뉴 수: ${foods.length}개`);

  if (foods.length === 0) {
    log('처리할 대상 메뉴가 없습니다. (모든 메뉴가 이미 생성되었거나 대상 없음)');
    await generateContactSheet();
    return;
  }

  const results = [];
  const BASE_PACE_MS = paceMs;
  log(`호출 간격: 시작 ${Math.round(paceMs / 1000)}초 · 최대 ${Math.round(maxPaceMs / 1000)}초 (429 가 나면 자동으로 늘립니다)`);
  const failedList = [];

  for (let i = 0; i < foods.length; i++) {
    const food = foods[i];
    log(`[${i + 1}/${foods.length}] 처리 시작: ID ${food.id} - ${food.name}`);
    const res = await processFood(food);
    results.push(res);

    if (!res.success) {
      failedList.push({ id: food.id, name: food.name, error: res.error });
      try {
        writeFileSync(FAIL_FILE, JSON.stringify(failedList, null, 2), 'utf8');
      } catch {}
    }

    // 호출 간 대기 — 429 가 나면 자동으로 길어지고, 잘 되면 다시 짧아집니다
    if (res.success && !res.dryRun) speedUp(BASE_PACE_MS);
    if (i < foods.length - 1 && !isDryRun) {
      await new Promise((r) => setTimeout(r, paceMs));
    }
  }

  const durationMin = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  const successes = results.filter((r) => r.success && !r.dryRun);
  const failures = results.filter((r) => !r.success);

  log('\n=== 전체 작업 완료 요약 ===');
  log(`소요 시간: ${durationMin}분`);
  log(`성공: ${successes.length}개, 실패: ${failures.length}개`);
  if (failedList.length > 0) {
    log(`실패 목록 (${failedList.length}개): ${failedList.map((f) => `${f.name}(#${f.id})`).join(', ')}`);
  }

  await generateContactSheet();
  try {
    const { generateDocxReport } = await import('./gen-food-docx.mjs');
    await generateDocxReport();
  } catch (docxErr) {
    log(`[docx 생성 오류] ${docxErr.message}`);
  }
}

main().catch((err) => {
  log(`[치명적 오류 발생] ${err.message}`);
  process.exit(1);
});
