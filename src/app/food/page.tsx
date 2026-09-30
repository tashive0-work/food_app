import type { Metadata } from "next";
import Link from "next/link";
import { FOODS } from "@/data/foods";
import { BottomNav } from "@/components/BottomNav";

// 종류 표시 순서 (여기 없는 종류는 뒤에 자동으로 붙습니다)
const KIND_ORDER = ["한식", "분식", "중식", "일식", "양식", "아시안", "간편", "야식"];
const KIND_ICON: Record<string, string> = {
  한식: "🍚", 분식: "🍢", 중식: "🥟", 일식: "🍣", 양식: "🍝", 아시안: "🍜", 간편: "🥪", 야식: "🍗",
};

const TOTAL = FOODS.length;

export const metadata: Metadata = {
  title: `음식 추천 — 메뉴 ${TOTAL}가지 전체 보기`,
  description: `오늘 뭐 먹지 고민될 때 보는 음식 종류 전체 목록. 한식·분식·중식·일식·양식·아시안까지 메뉴 ${TOTAL}가지를 종류별로 모았어요. 점심 메뉴 추천, 저녁 메뉴 추천이 필요하면 8문항 진단으로 바로 골라드려요.`,
  alternates: { canonical: "/food" },
  openGraph: {
    title: `음식 추천 — 메뉴 ${TOTAL}가지 전체 보기 | 오늘 뭐 먹지`,
    url: "/food",
    type: "website",
  },
};

function groupByKind() {
  const map = new Map<string, typeof FOODS>();
  for (const f of FOODS) {
    if (!map.has(f.kind)) map.set(f.kind, []);
    map.get(f.kind)!.push(f);
  }
  const kinds = [
    ...KIND_ORDER.filter((k) => map.has(k)),
    ...Array.from(map.keys()).filter((k) => !KIND_ORDER.includes(k)),
  ];
  return kinds.map((k) => ({ kind: k, foods: map.get(k)! }));
}

export default function FoodIndexPage() {
  const groups = groupByKind();

  return (
    <div className="app hasNav">
      <main className="wrap" style={{ paddingBottom: "32px" }}>
        <header className="pageHead">
          <Link href="/" className="pageBack" aria-label="홈으로">
            ←
          </Link>
          <h1 className="pageTitle">음식 추천 · 전체 메뉴 {TOTAL}가지</h1>
        </header>

        <p style={{ fontSize: "14px", lineHeight: 1.65, color: "var(--dim)", margin: "4px 0 16px" }}>
          오늘 뭐 먹지 고민될 때, 음식 종류별로 한눈에 보세요. 메뉴를 누르면 이럴 때 먹기 좋은지,
          어떤 꿀조합이 좋은지 알려드려요.
        </p>

        <Link
          href="/quiz"
          className="btn btnMain"
          style={{ display: "block", textAlign: "center", textDecoration: "none", marginBottom: "20px" }}
        >
          고르기 어렵다면? 8문항으로 메뉴 추천받기 →
        </Link>

        {/* 종류 바로가기 */}
        <nav aria-label="음식 종류" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "24px" }}>
          {groups.map((g) => (
            <a
              key={g.kind}
              href={`#${encodeURIComponent(g.kind)}`}
              style={{
                padding: "6px 12px",
                borderRadius: "999px",
                border: "1px solid var(--border)",
                fontSize: "13px",
                color: "var(--ink)",
                textDecoration: "none",
                background: "#FFFFFF",
              }}
            >
              {KIND_ICON[g.kind] ?? "🍽️"} {g.kind} {g.foods.length}
            </a>
          ))}
        </nav>

        {groups.map((g) => (
          <section key={g.kind} id={encodeURIComponent(g.kind)} style={{ marginBottom: "28px", scrollMarginTop: "16px" }}>
            <h2 style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 10px", color: "var(--ink)" }}>
              {KIND_ICON[g.kind] ?? "🍽️"} {g.kind} 메뉴 추천 <span style={{ color: "var(--dim)", fontWeight: 600, fontSize: "14px" }}>{g.foods.length}</span>
            </h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {g.foods.map((f) => (
                <li key={f.id}>
                  <Link
                    href={`/food/${encodeURIComponent(f.name)}`}
                    style={{
                      display: "inline-block",
                      padding: "8px 12px",
                      borderRadius: "var(--r-lg)",
                      border: "1px solid var(--border)",
                      boxShadow: "var(--sh1)",
                      background: "#FFFFFF",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "var(--ink)",
                      textDecoration: "none",
                    }}
                  >
                    {f.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>

      <BottomNav />
    </div>
  );
}
