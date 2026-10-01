/**
 * 메뉴 '국물 여부' 일괄 적용 — scripts/soup.json 을 foods.soup 에 씁니다.
 *
 * 실행: npm run set:soup        (--dry 를 붙이면 바꾸지 않고 비교만)
 *
 * 먼저 migration-soup.sql 을 Supabase 에서 한 번 실행해 칼럼을 만들어야 합니다.
 * 값이 이미 같은 메뉴는 건너뜁니다. 다시 실행해도 안전합니다.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const SRC = resolve(process.cwd(), "scripts/soup.json");
const DRY = process.argv.includes("--dry");
const PAGE = 1000;
const log = (m) => console.log(`[set-soup] ${m}`);
const die = (m) => {
  console.error(`[set-soup] 중단 — ${m}`);
  process.exit(1);
};

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

loadEnv();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) die(".env.local 에 NEXT_PUBLIC_SUPABASE_URL 과 SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.");
if (!existsSync(SRC)) die(`${SRC} 파일이 없습니다.`);

const want = JSON.parse(readFileSync(SRC, "utf8"));
log(`씨앗 파일 — ${Object.keys(want).length}개 메뉴`);

const db = createClient(url, key, { auth: { persistSession: false } });

const rows = [];
for (let from = 0; ; from += PAGE) {
  const { data, error } = await db
    .from("foods")
    .select("id, name, soup")
    .order("id", { ascending: true })
    .range(from, from + PAGE - 1);
  if (error) {
    if (/soup/.test(error.message)) {
      die("soup 칼럼이 없습니다. migration-soup.sql 을 Supabase 에서 먼저 실행하세요.");
    }
    die(`DB 조회 실패 — ${error.message}`);
  }
  if (!data || data.length === 0) break;
  rows.push(...data);
  if (data.length < PAGE) break;
}
log(`DB 메뉴 ${rows.length}개`);

const todo = [];
let same = 0;
let unknown = 0;
for (const r of rows) {
  const v = want[r.name];
  if (v === undefined) { unknown += 1; continue; }
  if (r.soup === v) { same += 1; continue; }
  todo.push({ id: r.id, name: r.name, v });
}
log(`바꿀 것 ${todo.length}개 · 이미 같음 ${same}개 · 목록에 없어 건너뜀 ${unknown}개`);

if (DRY) {
  log("--dry 모드 — 아무것도 바꾸지 않았습니다.");
  process.exit(0);
}

let done = 0;
for (const t of todo) {
  const { error } = await db.from("foods").update({ soup: t.v }).eq("id", t.id);
  if (error) die(`적용 실패 (${t.name}) — ${error.message}`);
  done += 1;
  if (done % 100 === 0) log(`  ${done}/${todo.length}`);
}

const { count: soupCount, error: e1 } = await db
  .from("foods").select("*", { count: "exact", head: true }).eq("soup", true).eq("active", true);
const { count: total, error: e2 } = await db
  .from("foods").select("*", { count: "exact", head: true }).eq("active", true);
if (e1 || e2) die("확인 조회 실패");

console.log("");
log(`완료 — ${done}개 적용`);
log(`국물 있음 ${soupCount}개 / 국물 없음 ${total - soupCount}개 (전체 ${total})`);
log("다음: npm run sync:foods 로 앱 파일에 반영하세요.");
