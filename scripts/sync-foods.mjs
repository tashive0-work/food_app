/**
 * Supabase `foods` 테이블 → src/data/foods.ts 재생성
 *
 * 메뉴는 읽기만 아주 많고 쓰기는 가끔인 데이터입니다.
 * 그래서 DB 를 원본으로 두고, 빌드할 때 한 번만 읽어 파일로 굳힙니다.
 * 앱 코드는 지금처럼 `@/data/foods` 를 import 하면 됩니다.
 *
 * 실행: npm run build (prebuild 로 자동) 또는 npm run sync:foods
 *
 * 안전장치 — 아래 경우 파일을 건드리지 않고 기존 것을 씁니다 (빌드는 계속됩니다)
 *   · 환경변수 없음 · DB 조회 실패 · 결과 0건 · 메뉴 수가 20% 넘게 감소
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const OUT = resolve(process.cwd(), "src/data/foods.ts");
const SHRINK_GUARD = 0.8;

const log = (m) => console.log(`[sync-foods] ${m}`);

/**
 * node 로 직접 실행하면 .env.local 을 읽지 않습니다 (Next.js 가 해주는 일입니다).
 * @next/env 가 있으면 그것으로, 없으면 직접 파싱합니다.
 * Vercel 에서는 이미 process.env 에 들어 있어 둘 다 그냥 통과합니다.
 */
async function loadEnv() {
  try {
    const { loadEnvConfig } = await import("@next/env");
    loadEnvConfig(process.cwd(), true, { info: () => {}, error: () => {} });
    return "@next/env";
  } catch {
    // 직접 파싱 (의존성 없이)
    for (const f of [".env.local", ".env"]) {
      const p = resolve(process.cwd(), f);
      if (!existsSync(p)) continue;
      for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
        if (!m) continue;
        let v = m[2].trim();
        if (
          (v.startsWith('"') && v.endsWith('"')) ||
          (v.startsWith("'") && v.endsWith("'"))
        ) {
          v = v.slice(1, -1);
        }
        if (process.env[m[1]] === undefined) process.env[m[1]] = v;
      }
    }
    return "직접 파싱";
  }
}

function countExisting() {
  if (!existsSync(OUT)) return 0;
  return (readFileSync(OUT, "utf8").match(/^\s*\["/gm) || []).length;
}

function keepExisting(reason) {
  log(`건너뜀 — ${reason}. 기존 foods.ts 를 그대로 사용합니다.`);
  process.exit(0);
}

const how = await loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
// service role 우선. anon 키가 예전 legacy(eyJ...) 라 막혀 있을 수 있기 때문입니다.
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  log(`환경변수 로딩 방식: ${how}`);
  log(`  NEXT_PUBLIC_SUPABASE_URL      : ${url ? "찾음" : "없음"}`);
  log(`  SUPABASE_SERVICE_ROLE_KEY     : ${process.env.SUPABASE_SERVICE_ROLE_KEY ? "찾음" : "없음"}`);
  log(`  NEXT_PUBLIC_SUPABASE_ANON_KEY : ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "찾음" : "없음"}`);
  keepExisting("Supabase 환경변수 없음");
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Supabase 는 한 번에 최대 1000행만 돌려줍니다 (limit 을 크게 줘도 잘립니다).
 * 그래서 range 로 1000개씩 끝까지 끌어옵니다.
 */
const PAGE = 1000;
const data = [];
for (let from = 0; ; from += PAGE) {
  const { data: page, error } = await supabase
    .from("foods")
    .select("name, kind, spice, fill, warm, ease, comfort, light, themes, variants, popularity, soup, updated_at")
    .eq("active", true)
    .order("id", { ascending: true })
    .range(from, from + PAGE - 1);

  if (error) keepExisting(`DB 조회 실패: ${error.message}`);
  if (!page || page.length === 0) break;
  data.push(...page);
  if (page.length < PAGE) break;
  if (from > 100000) keepExisting("조회가 끝나지 않습니다 (안전 중단)");
}

if (data.length === 0) keepExisting("조회 결과 0건");

const before = countExisting();
if (before > 0 && data.length < before * SHRINK_GUARD) {
  keepExisting(`메뉴 수가 급감(${before} → ${data.length}). 사고 방지를 위해 중단`);
}

const esc = (s) => String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
const arr = (a) => "[" + (a || []).map((x) => `"${esc(x)}"`).join(", ") + "]";

// variants 를 항상 내보냅니다 (비어 있어도). popularity 자리를 고정하기 위해서입니다.
const lines = data.map((f) => {
  const pop = typeof f.popularity === "number" ? f.popularity : 1;
  const soup = f.soup === true;
  const updatedAt = f.updated_at ? `"${esc(f.updated_at)}"` : "null";
  return (
    `  ["${esc(f.name)}", "${esc(f.kind)}", ` +
    `${f.spice}, ${f.fill}, ${f.warm}, ${f.ease}, ${f.comfort}, ${f.light}, ` +
    `${arr(f.themes)}, ${arr(f.variants)}, ${pop}, ${soup}, ${updatedAt}],`
  );
});

const out = `import { Food } from "@/types/food";

// ⚠️ 이 파일은 자동 생성됩니다. 직접 고치지 마세요.
//    원본은 Supabase 의 foods 테이블입니다. 빌드할 때 scripts/sync-foods.mjs 가 다시 씁니다.
//    메뉴를 고치려면 어드민 콘솔이나 Supabase 에서 수정하세요.
//    생성 시각: ${new Date().toISOString()}

export const RAW: [string, string, number, number, number, number, number, number, string[], string[], number, boolean, string | null][] = [
${lines.join("\n")}
];

export const FOODS: Food[] = RAW.map(
  ([name, kind, spice, fill, warm, ease, comfort, light, themes, variants, popularity, soup, updatedAt], i) => ({
    id: i,
    name,
    kind,
    spice,
    fill,
    warm,
    ease,
    comfort,
    light,
    themes,
    variants,
    popularity,
    soup,
    updatedAt: updatedAt || undefined,
  })
);
`;

writeFileSync(OUT, out, "utf8");
log(`완료 — 메뉴 ${data.length}개 (이전 ${before}개) → src/data/foods.ts  [env: ${how}]`);
