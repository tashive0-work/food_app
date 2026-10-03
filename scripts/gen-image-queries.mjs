/**
 * scripts/gen-image-queries.mjs
 * 
 * Unsplash 1단계: foods 영문 이미지 검색어(image_query) 자동 생성 스크립트
 * 
 * 대상: foods 테이블에서 image_query 가 null 인 메뉴
 * 규칙:
 * 1. 기존 src/data/foodKeywords.ts 에 정의된 메뉴는 해당 키워드를 공백으로 변환하여 사용
 * 2. 그 외 메뉴는 Gemini (gemini-3.6-flash) 로 50개씩 묶어 영문 검색어 생성 (2~4단어)
 * 3. --dry-run: DB 쓰지 않고 결과 출력
 * 4. --limit N: 최대 N개만 처리
 * 5. DB 쓰기는 SUPABASE_SERVICE_ROLE_KEY 로만 수행하며, image_status 는 건드리지 않음
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

// ── 1. 환경변수 안전 로딩 ──
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[Error] NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 가 없습니다.');
  process.exit(1);
}

// ── 2. CLI 인자 파싱 ──
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
let limit = null;
const limitIdx = args.indexOf('--limit');
if (limitIdx !== -1 && args[limitIdx + 1]) {
  limit = parseInt(args[limitIdx + 1], 10);
}

// ── 3. foodKeywords.ts 파싱 (참고 힌트용) ──
function loadFoodKeywords() {
  const map = new Map();
  const filePath = resolve(process.cwd(), 'src/data/foodKeywords.ts');
  if (!existsSync(filePath)) return map;

  const content = readFileSync(filePath, 'utf8');
  const regex = /"([^"]+)":\s*\{\s*keywords:\s*"([^"]+)"/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const name = match[1].trim();
    const rawKw = match[2].trim();
    const cleaned = rawKw.split(',').map((s) => s.trim()).filter(Boolean).join(' ');
    map.set(name, cleaned);
  }
  return map;
}

const existingKeywordsMap = loadFoodKeywords();

// ── 4. Gemini API 호출 함수 (gemini-3.6-flash & gemini-3.8-flash 폴백) ──
async function callGeminiForFoodQueries(foodBatch) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY 환경변수가 설정되지 않았습니다.');
  }

  const prompt = `You are an expert culinary terminology specialist and photo stock search query generator for Unsplash.
For each food item provided below with its category and reference hint, generate an English search query string.

CRITICAL RULES:
1. Length: 2 to 4 English words (at most 5 words if essential for Romanization + ingredients).
2. For Korean dishes, ALWAYS format as: [Romanized dish name] + [core ingredient / cooking style]
   Examples:
   - "부대찌개" -> "budae jjigae army stew"
   - "아구찜" -> "agujjim braised monkfish"
   - "전복죽" -> "jeonbokjuk abalone porridge"
   - "곱창" -> "gopchang grilled intestines"
   - "보쌈" -> "bossam boiled pork"
   - "수제비" -> "sujebi hand torn noodle soup"
   - "순두부찌개" -> "sundubu jjigae soft tofu"
   - "삼계탕" -> "samgyetang ginseng chicken soup"
   - "낙지볶음" -> "nakji bokkeum spicy octopus"
   - "뼈해장국" -> "haejangguk pork spine soup"
   - "콩나물국밥" -> "kongnamul gukbap beansprout soup"
3. NEVER omit core signature ingredients (e.g. abalone for 전복, monkfish for 아귀, octopus for 낙지, tripe/intestines for 곱창, etc.).
4. Ensure distinct queries: Different dishes MUST NOT share the exact same query (e.g. don't use generic "pancake" for both pajeon and kimchijeon; use "haemul pajeon seafood scallion" and "kimchijeon kimchi pancake").
5. Strictly NO brand names, shop names, or restaurant names.
6. The provided 'hint' is ONLY an approximate reference; do NOT copy it verbatim if it lacks Romanization or core ingredients.
7. Output MUST be ONLY a valid JSON array of objects with "name" and "query" keys:
[{"name": "...", "query": "..."}]

Input food items:
${JSON.stringify(
  foodBatch.map((f) => ({
    name: f.name,
    category: f.kind || '음식',
    hint: existingKeywordsMap.get(f.name) || undefined,
  }))
)}
`;

  const models = [
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-flash-lite-latest',
  ];
  let lastError = null;

  for (const model of models) {
    let quotaRetries = 0;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          // 429 (Quota exceeded)
          if (res.status === 429) {
            // 일일 한도(RPD) 소진인 경우 즉시 다음 모델로 전환
            if (errText.includes('PerDay') || errText.includes('Please retry in') || errText.includes('retryDelay')) {
              console.warn(`  [일일 한도 초과] ${model} 일일 요청 한도 소진. 다음 모델로 전환합니다.`);
              lastError = new Error(`[${model}] Daily quota exhausted: ${errText}`);
              break; // 다음 모델로 즉시 전환
            }

            // 분당 한도(RPM) 초과인 경우 15초 대기 후 재시도
            quotaRetries++;
            if (quotaRetries <= 10) {
              console.warn(`  [한도 대기 (${quotaRetries}/10)] ${model} RPM 한도 도달. 15초 대기 후 재시도...`);
              await new Promise((r) => setTimeout(r, 15000));
              attempt--; // attempt 차감 무효화
              continue;
            }
          }
          if (res.status === 503) {
            console.warn(`  [서버 혼잡] ${model} 503 오류. 6초 대기 후 재시도...`);
            await new Promise((r) => setTimeout(r, 6000));
            continue;
          }
          throw new Error(`[${model}] HTTP ${res.status}: ${errText}`);
        }

        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

        const parsed = JSON.parse(cleanJson);
        if (!Array.isArray(parsed)) {
          throw new Error('Gemini 응답이 배열 형식이 아닙니다.');
        }
        return parsed;
      } catch (err) {
        lastError = err;
        if (attempt < 3) {
          const delay = attempt * 3000;
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }
  }

  throw lastError || new Error('All Gemini models and retry attempts failed');
}

// ── 5. 메인 실행 함수 ──
async function main() {
  console.log(`[시작] Unsplash image_query 생성 스크립트`);
  console.log(`- 모드: ${isDryRun ? 'DRY-RUN (DB 미반영)' : 'PRODUCTION (DB 업데이트)'}`);
  if (limit) console.log(`- 제한: ${limit}개`);
  console.log(`- 규칙: 1,606개 전수 Gemini AI 생성 (Free Tier RPM 5 준수, 배치당 13초 간격)`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // (1) image_query 가 null 인 메뉴 조회 (1000개 단위 페이징)
  const PAGE = 1000;
  const targetFoods = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('foods')
      .select('id, name, kind, image_query')
      .is('image_query', null)
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);

    if (error) {
      console.error(`[DB 조회 실패]: ${error.message}`);
      process.exit(1);
    }
    if (!data || data.length === 0) break;
    targetFoods.push(...data);
    if (data.length < PAGE) break;
  }

  console.log(`[대상] image_query 가 null 인 메뉴: 총 ${targetFoods.length}개`);
  if (targetFoods.length === 0) {
    console.log('생성할 대상 메뉴가 없습니다. 종료합니다.');
    return;
  }

  const processingList = limit ? targetFoods.slice(0, limit) : targetFoods;
  console.log(`[진행] 처리 대상 메뉴: ${processingList.length}개`);

  // (2) 1,606개 전수 Gemini 50개씩 묶어서 요청 & 배치별 즉시 DB 업데이트
  const geminiResults = [];
  const failedItems = [];
  const BATCH_SIZE = 50;
  let totalUpdated = 0;

  for (let i = 0; i < processingList.length; i += BATCH_SIZE) {
    const batch = processingList.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(processingList.length / BATCH_SIZE);
    console.log(`[Gemini] 배치 ${batchNum}/${totalBatches} (${batch.length}개) 요청 중...`);

    let parsed = null;
    try {
      parsed = await callGeminiForFoodQueries(batch);
    } catch (err) {
      console.warn(`  [경고] 배치 ${batchNum} 1차 실패: ${err.message}. 1회 재시도 중...`);
      try {
        await new Promise((r) => setTimeout(r, 4000));
        parsed = await callGeminiForFoodQueries(batch);
      } catch (retryErr) {
        console.error(`  [오류] 배치 ${batchNum} 재시도 실패: ${retryErr.message}`);
      }
    }

    const resultMap = new Map();
    if (Array.isArray(parsed)) {
      parsed.forEach((p) => {
        if (p.name && p.query) {
          resultMap.set(p.name.trim(), p.query.trim());
        }
      });
    }

    const currentBatchSaved = [];
    for (const item of batch) {
      const q = resultMap.get(item.name.trim());
      if (q) {
        const itemResult = { ...item, query: q, source: 'Gemini' };
        geminiResults.push(itemResult);
        currentBatchSaved.push(itemResult);
      } else {
        failedItems.push(item);
      }
    }

    // DRY-RUN 이 아닐 경우 배치 단위로 즉시 DB 에 업데이트 (중단 시 안전하게 이어서 재실행 가능)
    if (!isDryRun && currentBatchSaved.length > 0) {
      for (const savedItem of currentBatchSaved) {
        const { error: updateError } = await supabase
          .from('foods')
          .update({ image_query: savedItem.query })
          .eq('id', savedItem.id);

        if (updateError) {
          console.error(`  [DB 오류] ${savedItem.name}: ${updateError.message}`);
        } else {
          totalUpdated++;
        }
      }
      console.log(`  -> 배치 ${batchNum} DB 저장 완료 (누적: ${totalUpdated}개)`);
    }

    // Free Tier 분당 5회(RPM 5) 제한 준수를 위해 배치 간 15초 대기
    if (i + BATCH_SIZE < processingList.length) {
      console.log(`  [대기] Free Tier RPM 5 준수를 위해 15초간 대기합니다...`);
      await new Promise((r) => setTimeout(r, 15000));
    }
  }

  // (3) 전체 결과 병합
  const finalResultsMap = new Map();
  geminiResults.forEach((item) => finalResultsMap.set(item.id, item));

  const orderedResults = processingList
    .map((item) => finalResultsMap.get(item.id))
    .filter(Boolean);

  // (4) DRY-RUN 출력
  if (isDryRun) {
    console.log('\n==================== [DRY-RUN 결과 30개] ====================');
    const dryRunSlice = orderedResults.slice(0, 30);
    dryRunSlice.forEach((item, idx) => {
      const num = String(idx + 1).padStart(2, '0');
      console.log(
        `${num}. [${item.name}] (${item.kind || '일반'}) -> "${item.query}" [출처: ${item.source}]`
      );
    });
    console.log('=============================================================\n');

    if (failedItems.length > 0) {
      console.log(`[실패 목록] 총 ${failedItems.length}개 누락:`);
      failedItems.forEach((f) => console.log(`- ${f.name} (${f.kind})`));
    }
    console.log(`[DRY-RUN 완료] DB 쓰기 없이 종료합니다.`);
    return;
  }

  // (5) 전체 실행 종합 리포트 생성 및 분석
  console.log(`\n==================== [전체 실행 완료 리포트] ====================`);
  console.log(`1. 처리 결과:`);
  console.log(`   - 성공: ${totalUpdated}건`);
  console.log(`   - 실패(누락): ${failedItems.length}건`);
  if (failedItems.length > 0) {
    console.log(`   - 실패 메뉴 목록:`);
    failedItems.forEach((f) => console.log(`     * ${f.name} (${f.kind})`));
  } else {
    console.log(`   - 실패 메뉴: 없음 (100% 성공)`);
  }

  // 2. 중복 image_query 집계
  const queryCountMap = new Map();
  orderedResults.forEach((item) => {
    const q = item.query;
    if (!queryCountMap.has(q)) {
      queryCountMap.set(q, []);
    }
    queryCountMap.get(q).push(item.name);
  });

  const duplicates = Array.from(queryCountMap.entries()).filter(([q, names]) => names.length > 1);
  console.log(`\n2. 동일한 image_query 가 2개 이상인 경우: 총 ${duplicates.length}건`);
  if (duplicates.length > 0) {
    duplicates.forEach(([q, names]) => {
      console.log(`   - "${q}" (${names.length}개 메뉴): ${names.join(', ')}`);
    });
  } else {
    console.log(`   - 중복된 쿼리 없음`);
  }

  // 3. 카테고리별 무작위 3개씩 샘플
  const categoryMap = new Map();
  orderedResults.forEach((item) => {
    const cat = item.kind || '기타';
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, []);
    }
    categoryMap.get(cat).push(item);
  });

  console.log(`\n3. 카테고리별 무작위 3개씩 샘플:`);
  for (const [cat, list] of categoryMap.entries()) {
    // Fisher-Yates shuffle
    const shuffled = [...list].sort(() => 0.5 - Math.random());
    const sample = shuffled.slice(0, 3);
    console.log(`   [${cat}] (총 ${list.length}개 메뉴 중 3개 샘플):`);
    sample.forEach((s) => {
      console.log(`     * ${s.name} -> "${s.query}"`);
    });
  }

  // 4. DB 검증 쿼리 실행
  console.log(`\n4. DB 최종 현황:`);
  const allFoods = [];
  for (let from = 0; ; from += PAGE) {
    const { data: pageData, error: pageErr } = await supabase
      .from('foods')
      .select('id, image_query')
      .range(from, from + PAGE - 1);
    if (pageErr) {
      console.error(`  [DB 검증 오류]: ${pageErr.message}`);
      break;
    }
    allFoods.push(...pageData);
    if (pageData.length < PAGE) break;
  }

  if (allFoods.length > 0) {
    const nonNullCount = allFoods.filter((f) => f.image_query !== null && f.image_query.trim() !== '').length;
    console.log(`   - image_query is not null: ${nonNullCount}개`);
    console.log(`   - 전체 foods: ${allFoods.length}개`);
    console.log(`   - 반영률: ${((nonNullCount / allFoods.length) * 100).toFixed(1)}%`);
  }
  console.log(`=================================================================\n`);
}

main().catch((err) => {
  console.error('[치명적 오류]:', err);
  process.exit(1);
});
