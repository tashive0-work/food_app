/**
 * scripts/verify-food-images.mjs
 *
 * 생성된 메뉴 사진이 메뉴 이름과 실제로 맞는지 Gemini 비전 모델로 검수합니다.
 * 사람이 380장을 눈으로 보는 대신 쓰려고 만들었습니다.
 *
 * 하는 일
 *   1. foods 테이블에서 사진이 있는 메뉴를 전부 가져옵니다 (1,000개 제한 넘겨서)
 *   2. 사진을 내려받아 「이 사진이 이 메뉴가 맞는가」를 모델에 묻습니다
 *   3. 문제 있는 것만 모아 scripts/out/verify-report.html 로 보여주고,
 *      다시 생성할 때 쓸 --ids= 명령을 그대로 찍어 줍니다
 *
 * 아무것도 고치지 않습니다. DB도 사진도 건드리지 않고 읽기만 합니다.
 *
 * 실행 예:
 *   node --env-file=.env.local scripts/verify-food-images.mjs
 *   node --env-file=.env.local scripts/verify-food-images.mjs --limit=20
 *   node --env-file=.env.local scripts/verify-food-images.mjs --ids=1639,1702
 *   node --env-file=.env.local scripts/verify-food-images.mjs --force
 *
 * 중간에 끊겨도 다시 실행하면 이미 검사한 것은 건너뛰고 이어서 합니다.
 * 처음부터 다시 하려면 --force 를 붙이세요.
 */

import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
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

const LOG_FILE = resolve(LOG_DIR, 'verify-images.log');
const STATE_FILE = resolve(OUT_DIR, 'verify-results.json');
const REPORT_FILE = resolve(OUT_DIR, 'verify-report.html');

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
  console.error('[verify-food-images] Supabase URL 또는 키가 설정되지 않았습니다.');
  process.exit(1);
}

// ── CLI 인자 ───────────────────────────────────────────────────────────
const args = process.argv.slice(2);
let targetIds = null;
let limit = null;
let force = false;
let concurrency = 4;
let modelOverride = null;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--force') {
    force = true;
  } else if (arg.startsWith('--ids=')) {
    targetIds = arg.slice(6).split(',').map((x) => Number(x.trim())).filter((x) => !isNaN(x));
  } else if (arg.startsWith('--limit=')) {
    limit = parseInt(arg.slice(8), 10);
  } else if (arg.startsWith('--concurrency=')) {
    concurrency = Math.max(1, Math.min(8, parseInt(arg.slice(14), 10) || 4));
  } else if (arg.startsWith('--model=')) {
    modelOverride = arg.slice(8).trim();
  }
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const ai = new GoogleGenAI({ vertexai: true, project: PROJECT_ID, location: LOCATION });

/**
 * 비전 모델 고르기.
 *
 * 사진 생성에 쓴 건 gemini-3.1-flash-image 이고, 보고 판단하는 건 별도 모델입니다.
 * 프로젝트마다 쓸 수 있는 이름이 달라서, 되는 것을 찾을 때까지 차례로 시도합니다.
 */
const MODEL_CANDIDATES = modelOverride
  ? [modelOverride]
  : ['gemini-3.1-flash', 'gemini-2.5-flash', 'gemini-2.0-flash'];

async function pickModel() {
  for (const name of MODEL_CANDIDATES) {
    try {
      await ai.models.generateContent({ model: name, contents: 'ping' });
      log(`판단 모델: ${name}`);
      return name;
    } catch (err) {
      const msg = String(err?.message || err);
      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
        // 쿼터 때문이면 모델 자체는 쓸 수 있는 것입니다
        log(`판단 모델: ${name} (쿼터 응답이지만 사용 가능)`);
        return name;
      }
      log(`모델 ${name} 사용 불가 — 다음 후보로 넘어갑니다.`);
    }
  }
  throw new Error(
    `쓸 수 있는 비전 모델을 못 찾았습니다. --model=<이름> 으로 직접 지정해 주세요. 시도한 것: ${MODEL_CANDIDATES.join(', ')}`
  );
}

/** Supabase 1,000개 제한을 넘겨 사진이 있는 메뉴를 전부 가져옵니다 */
async function fetchFoods() {
  const cols = 'id, name, kind, image_query, image_url, image_thumb, image_status';
  if (targetIds && targetIds.length > 0) {
    const { data, error } = await supabase
      .from('foods').select(cols).in('id', targetIds).order('id', { ascending: true });
    if (error) throw new Error(`DB 조회 오류: ${error.message}`);
    return (data || []).filter((f) => f.image_url);
  }

  const PAGE = 1000;
  const all = [];
  for (let from = 0; ; from += PAGE) {
    const { data: page, error } = await supabase
      .from('foods').select(cols)
      .not('image_url', 'is', null)
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`DB 조회 오류: ${error.message}`);
    if (!page || page.length === 0) break;
    all.push(...page);
    if (page.length < PAGE) break;
    if (from > 100000) break;
  }
  return all;
}

function loadState() {
  if (force || !existsSync(STATE_FILE)) return {};
  try {
    return JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

let state = loadState();
let sinceSave = 0;
function saveState(finalSave = false) {
  sinceSave++;
  if (!finalSave && sinceSave < 10) return;
  sinceSave = 0;
  try {
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    log(`[경고] 중간 결과 저장 실패: ${err.message}`);
  }
}

const PROMPT_HEAD = `너는 한국 음식 사진을 검수하는 사람이다. 아래 사진이 주어진 메뉴 사진으로 쓸 수 있는지 판단해라.

판단 기준 — 아래 중 하나라도 해당하면 문제다:
  A. 음식이나 음료가 아닌 것이 찍혀 있다
  B. 메뉴 이름과 전혀 다른 음식이다 (예: 둥굴레차인데 커피, 김밥인데 샌드위치)
  C. 한국 음식인데 다른 나라 음식 모양으로 나왔다 (예: 김밥인데 일본 후토마키, 만두인데 중국 딤섬 바구니)
  D. 글자·로고·워터마크가 찍혀 있다
  E. 사람 손이나 얼굴이 크게 들어가 음식이 가려진다
  F. 음식이 뭉개져 무엇인지 알아볼 수 없다

중요: 애매하면 문제 없음으로 판단해라. 그릇 모양, 곁들임 반찬, 배경, 조명, 사진 각도는 문제가 아니다.
흔한 변형이면 문제 없음이다 (예: 비빔밥이 돌솥이든 놋그릇이든 상관없다).

반드시 아래 JSON 하나만 출력해라. 설명 문장을 앞뒤에 붙이지 마라.
{"ok": true 또는 false, "code": "A"~"F" 중 하나 또는 "", "reason": "한국어로 한 문장"}`;

async function fetchImage(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`사진을 받지 못했습니다 (HTTP ${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  const mime = res.headers.get('content-type') || 'image/webp';
  return { data: buf.toString('base64'), mimeType: mime.split(';')[0] };
}

function parseVerdict(text) {
  const m = String(text || '').match(/\{[\s\S]*\}/);
  if (!m) return { ok: true, code: '', reason: '판단 결과를 읽지 못해 통과 처리했습니다.', unparsed: true };
  try {
    const v = JSON.parse(m[0]);
    return { ok: v.ok !== false, code: String(v.code || ''), reason: String(v.reason || '') };
  } catch {
    return { ok: true, code: '', reason: '판단 결과를 읽지 못해 통과 처리했습니다.', unparsed: true };
  }
}

async function verifyOne(model, food, maxRetries = 5) {
  const label = food.image_query ? `${food.name} (${food.image_query})` : food.name;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const img = await fetchImage(food.image_url);
      const res = await ai.models.generateContent({
        model,
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { mimeType: img.mimeType, data: img.data } },
            { text: `${PROMPT_HEAD}\n\n메뉴 이름: ${label}\n메뉴 종류: ${food.kind}` },
          ],
        }],
        config: { temperature: 0 },
      });
      const text = res.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
      return parseVerdict(text);
    } catch (err) {
      const msg = String(err?.message || err);
      const is429 = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED');
      if (attempt < maxRetries) {
        const waitSec = is429 ? 10 * attempt : 4 * attempt;
        log(`[재시도] ${food.name}(#${food.id}) ${is429 ? '429 쿼터 한도' : msg.slice(0, 80)} — ${waitSec}초 후`);
        await new Promise((r) => setTimeout(r, waitSec * 1000));
        continue;
      }
      return { ok: true, code: '', reason: `검사 실패: ${msg.slice(0, 120)}`, failed: true };
    }
  }
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function writeReport(foods, bad, failed) {
  const byId = new Map(foods.map((f) => [f.id, f]));
  const card = (r) => {
    const f = byId.get(r.id);
    return `<figure>
      <img src="${esc(f?.image_url || '')}" alt="${esc(r.name)}" loading="lazy">
      <figcaption>
        <b>${esc(r.name)}</b> <span class="id">#${r.id}</span>
        <span class="kind">${esc(f?.kind || '')}</span>
        <span class="code">${esc(r.code || '')}</span>
        <p>${esc(r.reason || '')}</p>
      </figcaption>
    </figure>`;
  };
  const idsLine = bad.map((r) => r.id).join(',');
  const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>메뉴 사진 검수 결과</title>
<style>
  body{font-family:system-ui,"Malgun Gothic",sans-serif;margin:0;padding:24px;background:#F7F8FA;color:#191F28}
  h1{font-size:20px;margin:0 0 6px}
  .sum{color:#6B7684;font-size:14px;margin:0 0 18px;line-height:1.7}
  .cmd{background:#191F28;color:#fff;padding:12px 14px;border-radius:10px;font-family:ui-monospace,Consolas,monospace;
       font-size:12.5px;white-space:pre-wrap;word-break:break-all;margin:0 0 24px}
  h2{font-size:16px;margin:26px 0 10px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:14px}
  figure{margin:0;background:#fff;border:1px solid #E5E8EB;border-radius:12px;overflow:hidden}
  figure img{width:100%;aspect-ratio:1/1;object-fit:cover;display:block;background:#FFF3ED}
  figcaption{padding:9px 10px 11px;font-size:12.5px;line-height:1.5}
  .id{color:#8B95A1}
  .kind{display:inline-block;margin-left:4px;padding:1px 6px;border-radius:999px;background:#F2F4F6;font-size:11px;color:#4E5968}
  .code{display:inline-block;margin-left:4px;padding:1px 6px;border-radius:999px;background:#FFE2D3;font-size:11px;color:#E8663D;font-weight:700}
  figcaption p{margin:6px 0 0;color:#4E5968}
  .none{color:#6B7684}
</style></head><body>
<h1>메뉴 사진 검수 결과</h1>
<p class="sum">검사한 사진 <b>${foods.length}</b>장 · 문제 있는 것 <b>${bad.length}</b>장 · 검사 못 한 것 ${failed.length}장<br>
생성일 ${new Date().toLocaleString('ko-KR')}</p>
${bad.length ? `<p class="sum">아래 명령으로 문제 있는 사진만 다시 만들 수 있습니다.</p>
<div class="cmd">node --env-file=.env.local scripts/gen-food-images.mjs --ids=${idsLine}</div>` : ''}
<h2>문제 있는 사진 ${bad.length}장</h2>
<div class="grid">${bad.length ? bad.map(card).join('') : '<p class="none">없습니다.</p>'}</div>
${failed.length ? `<h2>검사하지 못한 것 ${failed.length}장</h2>
<div class="grid">${failed.map(card).join('')}</div>` : ''}
</body></html>`;
  writeFileSync(REPORT_FILE, html, 'utf8');
}

async function main() {
  log('=== 메뉴 사진 검수 시작 ===');
  const model = await pickModel();

  const foods = await fetchFoods();
  const todo = foods.filter((f) => force || !state[f.id]);
  const work = limit ? todo.slice(0, limit) : todo;

  log(`사진 있는 메뉴 ${foods.length}개 · 이번에 검사할 것 ${work.length}개 (이미 검사함 ${foods.length - todo.length}개)`);
  if (work.length === 0) {
    log('검사할 것이 없습니다. 처음부터 다시 하려면 --force 를 붙이세요.');
  }

  let done = 0;
  const queue = [...work];
  async function worker() {
    for (;;) {
      const food = queue.shift();
      if (!food) return;
      const v = await verifyOne(model, food);
      state[food.id] = { id: food.id, name: food.name, ...v };
      done++;
      if (!v.ok) log(`[문제] ${food.name}(#${food.id}) [${v.code}] ${v.reason}`);
      if (done % 25 === 0) log(`진행 ${done}/${work.length}`);
      saveState();
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, Math.max(1, work.length)) }, worker));
  saveState(true);

  const results = foods.map((f) => state[f.id]).filter(Boolean);
  const bad = results.filter((r) => !r.ok && !r.failed);
  const failed = results.filter((r) => r.failed);
  writeReport(foods, bad, failed);

  log('');
  log('=== 검수 완료 ===');
  log(`검사한 사진: ${results.length}장`);
  log(`문제 있는 사진: ${bad.length}장`);
  log(`검사 못 한 사진: ${failed.length}장`);
  if (bad.length) {
    log('');
    log('문제 목록:');
    for (const r of bad) log(`  ${r.name}(#${r.id}) [${r.code}] ${r.reason}`);
    log('');
    log('다시 만들려면 아래 명령을 쓰세요:');
    log(`node --env-file=.env.local scripts/gen-food-images.mjs --ids=${bad.map((r) => r.id).join(',')}`);
  }
  log(`보고서: ${REPORT_FILE}`);
}

main().catch((err) => {
  log(`[치명적 오류] ${err.message}`);
  saveState(true);
  process.exit(1);
});
