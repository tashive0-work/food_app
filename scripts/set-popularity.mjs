/**
 * 메뉴 '대중성' 값 일괄 적용 — scripts/popularity.json 을 foods.popularity 에 씁니다.
 *
 * 실행: npm run set:popularity        (--dry 를 붙이면 바꾸지 않고 비교만)
 *
 * 먼저 migration-popularity.sql 을 Supabase 에서 한 번 실행해 칼럼을 만들어야 합니다.
 * 값이 이미 같은 메뉴는 건너뜁니다. 다시 실행해도 안전합니다.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const SRC = resolve(process.cwd(), "scripts/popularity.json");
const DRY = process.argv.includes("--dry");
const PAGE = 1000;
const log = (m) => console.log(`[set-popularity] ${m}`);
const die = (m) => {
  console.error(`[set-popularity] 중단 — ${m}`);
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
log(`씨앗 파일 — ${Object.keys(want).length}개 메뉴의 대중성 값`);

const db = createClient(url, key, { auth: { persistSession: false } });

// 현재 상태 (1000행 제한 때문에 page 로 끌어옵니다)
const rows = [];
for (let from = 0; ; from += PAGE) {
  const { data, error } = await db
    .from("foods")
    .select("id, name, popularity")
    .order("id", { ascending: true })
    .range(from, from + PAGE - 1);
  if (error) {
    if (/popularity/.test(error.message)) {
      die("popularity 칼럼이 없습니다. migration-popularity.sql 을 Supabase 에서 먼저 실행하세요.");
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
  if (v === undefined) {
    unknown += 1;
    continue;
  } // 씨앗에 없는 메뉴는 그대로 둠
  if (r.popularity === v) {
    same += 1;
    continue;
  }
  todo.push({ id: r.id, name: r.name, v });
}
log(`바꿀 것 ${todo.length}개 · 이미 같음 ${same}개 · 목록에 없어 건너뜀 ${unknown}개`);

if (DRY) {
  log("--dry 모드 — 아무것도 바꾸지 않았습니다.");
  process.exit(0);
}

let done = 0;
for (const t of todo) {
  const { error } = await db.from("foods").update({ popularity: t.v }).eq("id", t.id);
  if (error) die(`적용 실패 (${t.name}) — ${error.message}`);
  done += 1;
  if (done % 200 === 0) log(`  ${done}/${todo.length}`);
}

// 확인
const counts = {};
for (const v of [0, 1, 2]) {
  const { count, error } = await db
    .from("foods")
    .select("*", { count: "exact", head: true })
    .eq("popularity", v);
  if (error) die(`확인 조회 실패 — ${error.message}`);
  counts[v] = count;
}
console.log("");
log(`완료 — ${done}개 적용`);
log(`대중성 2(대중적) ${counts[2]}개 · 1(보통) ${counts[1]}개 · 0(희귀) ${counts[0]}개`);
log("다음: npm run sync:foods 로 앱 파일에 반영하세요.");
