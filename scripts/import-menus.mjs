/**
 * 메뉴 일괄 등록 — scripts/menu-seed.json 을 Supabase `foods` 테이블에 넣습니다.
 *
 * 실행: npm run import:menus
 *
 * 하는 일
 *   1) 신규 메뉴를 넣습니다. 이름이 이미 있으면 건너뜁니다. (기존 데이터를 덮어쓰지 않습니다)
 *   2) 세부 메뉴가 비어 있는 기존 메뉴에만 세부 메뉴를 채웁니다.
 *
 * 안전장치 — 아무것도 지우지 않습니다. 기존 값은 어떤 경우에도 바뀌지 않습니다.
 *           --dry 를 붙이면 실제로 넣지 않고 무엇이 바뀔지만 보여줍니다.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const SEED = resolve(process.cwd(), "scripts/menu-seed.json");
const DRY = process.argv.includes("--dry");
const log = (m) => console.log(`[import-menus] ${m}`);
const die = (m) => {
  console.error(`[import-menus] 중단 — ${m}`);
  process.exit(1);
};

/** node 로 직접 실행하면 .env.local 을 읽지 않으므로 직접 읽습니다. */
function loadEnv() {
  for (const f of [".env.local", ".env"]) {
    const p = resolve(process.cwd(), f);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
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

async function main() {
  loadEnv();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) die(".env.local 에 NEXT_PUBLIC_SUPABASE_URL 과 SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.");
  if (!existsSync(SEED)) die(`${SEED} 파일이 없습니다.`);

  const seed = JSON.parse(readFileSync(SEED, "utf8"));
  const newItems = seed.new || [];
  const varMap = seed.vars || {};
  log(`씨앗 파일 — 신규 ${newItems.length}개 / 세부메뉴 보강 ${Object.keys(varMap).length}개`);

  const db = createClient(url, key, { auth: { persistSession: false } });

  // --- 현재 상태 읽기 ---
  // Supabase 는 한 번에 최대 1000행만 돌려줍니다. range 로 끝까지 끌어옵니다.
  const PAGE = 1000;
  const current = [];
  for (let from = 0; ; from += PAGE) {
    const { data: page, error } = await db
      .from("foods")
      .select("id, name, variants")
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) die(`DB 조회 실패 — ${error.message}`);
    if (!page || page.length === 0) break;
    current.push(...page);
    if (page.length < PAGE) break;
  }

  const before = current.length;
  const existing = new Map(current.map((r) => [r.name, r]));
  log(`현재 등록된 메뉴 ${before}개`);

  // --- 1. 신규 메뉴 ---
  const toInsert = newItems
    .filter((r) => !existing.has(r[0]))
    .map(([name, kind, spice, fill, warm, ease, comfort, light, themes, variants]) => ({
      name, kind, spice, fill, warm, ease, comfort, light,
      themes: themes || [],
      variants: variants || [],
      active: true,
      source: "seed-2026-09",
    }));
  const skipped = newItems.length - toInsert.length;

  // --- 2. 세부 메뉴 보강 (비어 있는 것만) ---
  const toUpdate = [];
  for (const [name, variants] of Object.entries(varMap)) {
    const row = existing.get(name);
    if (!row) continue;
    if (row.variants && row.variants.length > 0) continue; // 이미 있으면 손대지 않음
    toUpdate.push({ id: row.id, name, variants });
  }

  log(`넣을 신규 ${toInsert.length}개 (이미 있어 건너뜀 ${skipped}개) · 세부메뉴 채울 메뉴 ${toUpdate.length}개`);

  if (DRY) {
    log("--dry 모드 — 실제로는 아무것도 바꾸지 않았습니다.");
    if (toInsert.length) log(`예: ${toInsert.slice(0, 5).map((r) => r.name).join(", ")} …`);
    return;
  }

  // --- 실행 ---
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += 100) {
    const chunk = toInsert.slice(i, i + 100);
    const { data, error } = await db.from("foods").insert(chunk).select("id");
    if (error) die(`신규 등록 실패 (${i + 1}번째 묶음) — ${error.message}`);
    inserted += (data || []).length;
    log(`  신규 ${inserted}/${toInsert.length}`);
  }

  let updated = 0;
  for (const u of toUpdate) {
    const { error } = await db.from("foods").update({ variants: u.variants }).eq("id", u.id);
    if (error) die(`세부메뉴 보강 실패 (${u.name}) — ${error.message}`);
    updated += 1;
    if (updated % 50 === 0) log(`  세부메뉴 ${updated}/${toUpdate.length}`);
  }

  // --- 확인 --- (개수는 count 로, 집계는 전체 페이지를 읽어서)
  const { count: exactCount, error: cntErr } = await db
    .from("foods")
    .select("*", { count: "exact", head: true })
    .eq("active", true);
  if (cntErr) die(`확인 조회 실패 — ${cntErr.message}`);

  const after = [];
  for (let from = 0; ; from += PAGE) {
    const { data: page, error } = await db
      .from("foods")
      .select("name, kind, variants")
      .eq("active", true)
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) die(`확인 조회 실패 — ${error.message}`);
    if (!page || page.length === 0) break;
    after.push(...page);
    if (page.length < PAGE) break;
  }

  const withVars = after.filter((r) => r.variants && r.variants.length > 0).length;
  const varTotal = after.reduce((n, r) => n + (r.variants ? r.variants.length : 0), 0);
  const kinds = new Set(after.map((r) => r.kind)).size;

  console.log("");
  log(`완료 — 메뉴 ${before}개 → ${exactCount}개 (신규 ${inserted}, 세부메뉴 보강 ${updated})`);
  log(`세부 메뉴를 가진 메뉴 ${withVars}개 / 세부 메뉴 총 ${varTotal}개 / 카테고리 ${kinds}종`);
  log("다음: npm run sync:foods 로 앱 파일에 반영하세요.");
}

main().catch((e) => die(e?.message || String(e)));
