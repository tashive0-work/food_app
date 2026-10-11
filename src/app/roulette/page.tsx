import type { Metadata } from "next";
import Link from "next/link";
import { FOODS } from "@/data/foods";
import { BottomNav } from "@/components/BottomNav";
import { RouletteClient } from "./RouletteClient";

const TOTAL = FOODS.length;

export const metadata: Metadata = {
  title: `음식 랜덤 룰렛 — 메뉴 ${TOTAL}가지 중에서`,
  description: `오늘 뭐 먹지 고민될 때 돌리는 음식 랜덤 룰렛. 끼니와 종류를 고르면 메뉴 ${TOTAL}가지 중에서 골라드려요. 점심 메뉴 추천, 저녁 메뉴 추천, 야식 고르기까지.`,
  alternates: { canonical: "/roulette" },
  openGraph: {
    title: `음식 랜덤 룰렛 | 오늘의 잇템`,
    description: "끼니와 종류만 고르면 돌려서 뽑아드려요.",
    url: "/roulette",
    type: "website",
  },
};

export default function RoulettePage() {
  return (
    <div className="app hasNav">
      <main className="wrap" style={{ paddingBottom: "32px" }}>
        <header className="pageHead">
          <Link href="/" className="pageBack" aria-label="홈으로">
            ←
          </Link>
          <h1 className="pageTitle">음식 랜덤 룰렛</h1>
        </header>

        <p style={{ fontSize: "14px", lineHeight: 1.65, color: "var(--dim)", margin: "4px 0 2px" }}>
          도저히 못 고르겠을 때. 끼니와 종류만 고르고 돌리세요.
        </p>

        <RouletteClient />
      </main>

      <BottomNav />
    </div>
  );
}
