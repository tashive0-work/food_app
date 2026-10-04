/**
 * scripts/gen-food-images.mjs
 *
 * Vertex AI (Google Cloud ADC) gemini-3.1-flash-image 모델을 사용하여
 * 메뉴 사진을 생성하고, sharp 로 webp 변환 후 Supabase Storage(food-images) 및 foods 테이블을 갱신합니다.
 *
 * 실행 예:
 *   node --env-file=.env.local scripts/gen-food-images.mjs --ids=1,4,29,82,277,173
 *   node --env-file=.env.local scripts/gen-food-images.mjs --limit=10
 *   node --env-file=.env.local scripts/gen-food-images.mjs --dry-run
 */

import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { readFileSync, existsSync } from 'node:fs';
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

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--dry-run') {
    isDryRun = true;
  } else if (arg.startsWith('--ids=')) {
    targetIds = arg.slice(6).split(',').map((x) => Number(x.trim())).filter((x) => !isNaN(x));
  } else if (arg === '--ids' && args[i + 1]) {
    targetIds = args[++i].split(',').map((x) => Number(x.trim())).filter((x) => !isNaN(x));
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

async function fetchTargetFoods() {
  let query = supabase
    .from('foods')
    .select('id, name, image_query, image_status')
    .order('id', { ascending: true });

  if (targetIds && targetIds.length > 0) {
    query = query.in('id', targetIds);
  } else {
    query = query.eq('image_status', 'none');
  }

  if (limit && limit > 0) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`DB 조회 오류: ${error.message}`);
  }
  return data || [];
}

async function generateFoodImage(food, maxRetries = 3) {
  const queryStr = food.image_query ? food.image_query : food.name;
  const prompt = `A realistic food photo of ${food.name} (${queryStr}), served as it is typically served in Korea, in one dish or bowl, 45-degree angle, on a plain light warm-gray table, soft natural daylight, appetizing, nothing else in frame. No text, no letters, no logos, no hands, no people, no chopsticks touching food.`;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`\n[${food.id}] ${food.name} 이미지 생성 요청 중... (시도 ${attempt + 1})`);
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
      if (is429 && attempt < maxRetries) {
        const waitSec = 20 * (attempt + 1);
        console.warn(`[429 Quota] 1분당 요청 한도 도달. ${waitSec}초 대기 후 재시도합니다...`);
        await new Promise((r) => setTimeout(r, waitSec * 1000));
        continue;
      }
      throw err;
    }
  }
}

async function processFood(food) {
  try {
    if (isDryRun) {
      console.log(`[DRY-RUN] [${food.id}] ${food.name} (${food.image_query})`);
      return { success: true, id: food.id, name: food.name, dryRun: true };
    }

    const rawBuffer = await generateFoodImage(food);

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

    if (mainUpErr) {
      throw new Error(`메인 이미지 스토리지 업로드 실패: ${mainUpErr.message}`);
    }

    const { error: thumbUpErr } = await supabase.storage
      .from('food-images')
      .upload(thumbPath, thumbWebp, {
        contentType: 'image/webp',
        upsert: true,
      });

    if (thumbUpErr) {
      throw new Error(`썸네일 스토리지 업로드 실패: ${thumbUpErr.message}`);
    }

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

    if (dbErr) {
      throw new Error(`DB 업데이트 실패: ${dbErr.message}`);
    }

    console.log(`[${food.id}] ${food.name} 완료: ${imageUrl}`);
    return {
      success: true,
      id: food.id,
      name: food.name,
      imageUrl,
      imageThumb,
    };
  } catch (err) {
    console.error(`[${food.id}] ${food.name} 처리 실패 (건너뜀):`, err.message);
    return { success: false, id: food.id, name: food.name, error: err.message };
  }
}

async function main() {
  console.log(`=== Vertex AI 메뉴 사진 생성기 ===`);
  console.log(`프로젝트: ${PROJECT_ID}, 리전: ${LOCATION}, 모델: ${MODEL_NAME}`);
  if (isDryRun) console.log(`모드: DRY-RUN`);

  const foods = await fetchTargetFoods();
  console.log(`대상 메뉴 수: ${foods.length}개`);

  if (foods.length === 0) {
    console.log('처리할 대상 메뉴가 없습니다.');
    return;
  }

  const results = [];
  for (let i = 0; i < foods.length; i++) {
    const food = foods[i];
    console.log(`\n[${i + 1}/${foods.length}] 처리 시작: ID ${food.id} - ${food.name}`);
    const res = await processFood(food);
    results.push(res);

    // API 호출 간 10초 대기 (분당 쿼터 보호)
    if (i < foods.length - 1 && !isDryRun) {
      await new Promise((r) => setTimeout(r, 10000));
    }
  }

  const successes = results.filter((r) => r.success && !r.dryRun);
  const failures = results.filter((r) => !r.success);

  console.log('\n=== 작업 결과 요약 ===');
  console.log(`성공: ${successes.length}개, 실패: ${failures.length}개`);
  if (successes.length > 0) {
    console.log('\n성공 목록:');
    console.table(
      successes.map((s) => ({
        id: s.id,
        메뉴명: s.name,
        image_url: s.imageUrl,
      }))
    );
  }
}

main().catch((err) => {
  console.error('[치명적 오류]', err);
  process.exit(1);
});
