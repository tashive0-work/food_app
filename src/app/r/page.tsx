import type { Metadata } from "next";
import Link from "next/link";
import { shareTypeByKey } from "@/lib/shareType";

/**
 * 공유받은 사람이 여는 화면.
 *
 * 결과는 localStorage 에만 있어서 링크로는 넘길 수 없습니다.
 * 그래서 이 페이지는 「유형 + 메뉴 이름」만 주소로 받아 카드로 보여주고,
 * 바로 진단을 시작하게 하는 입구 역할만 합니다.
 */
interface PageProps {
  searchParams: { t?: string; f?: string };
}

export function generateMetadata({ searchParams }: PageProps): Metadata {
  const type = shareTypeByKey(searchParams?.t);
  const food = (searchParams?.f || "").slice(0, 20);

  const title = `오늘의 음식 유형: ${type.name}`;
  const description = food
    ? `${type.line} · 오늘 가장 잘 맞는 메뉴는 ${food}. 8문항이면 내 유형도 나옵니다.`
    : `${type.line} · 8문항이면 내 유형도 나옵니다.`;

  const q = new URLSearchParams();
  if (searchParams?.t) q.set("t", searchParams.t);
  if (food) q.set("f", food);
  const image = `https://eatodayme.com/og/result?${q.toString()}`;
  const url = `https://eatodayme.com/r?${q.toString()}`;

  return {
    title,
    description,
    // 공유 링크마다 생기는 얇은 페이지라 검색에는 올리지 않습니다.
    // 색인되면 메뉴 상세 페이지들과 중복으로 잡혀 검색 노출에 손해입니다.
    robots: { index: false, follow: true },
    openGraph: {
      title: `${title} | 오늘의 잇템`,
      description,
      url,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | 오늘의 잇템`,
      description,
      images: [image],
    },
  };
}

export default function SharedResultPage({ searchParams }: PageProps) {
  const type = shareTypeByKey(searchParams?.t);
  const food = (searchParams?.f || "").slice(0, 20);

  return (
    <div className="app">
      <main className="wrap" style={{ paddingTop: 40, paddingBottom: 48 }}>
        <section
          style={{
            background: "#E8663D",
            borderRadius: 22,
            padding: "30px 24px 26px",
            color: "#fff",
            boxShadow: "0 10px 30px rgba(232,102,61,.25)",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              padding: "7px 14px",
              borderRadius: 999,
              background: "rgba(255,255,255,.22)",
              fontSize: 12.5,
              fontWeight: 800,
            }}
          >
            친구가 받은 진단 결과
          </span>

          <h1
            style={{
              margin: "16px 0 8px",
              fontSize: 30,
              fontWeight: 800,
              lineHeight: 1.25,
              letterSpacing: "-0.02em",
              wordBreak: "keep-all",
            }}
          >
            {type.emoji} {type.name}
          </h1>
          <p style={{ margin: 0, fontSize: 14.5, fontWeight: 600, opacity: 0.9 }}>{type.line}</p>

          {food && (
            <div
              style={{
                marginTop: 20,
                padding: "14px 16px",
                borderRadius: 14,
                background: "rgba(255,255,255,.16)",
              }}
            >
              <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, opacity: 0.85 }}>
                오늘 가장 잘 맞는 메뉴
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 24, fontWeight: 800 }}>{food}</p>
            </div>
          )}
        </section>

        <div style={{ marginTop: 26, textAlign: "center" }}>
          <p style={{ margin: "0 0 14px", fontSize: 14.5, color: "var(--dim)", lineHeight: 1.65 }}>
            8문항만 답하면 지금 내 상태에 맞는 메뉴를 골라드려요.
            <br />
            30초면 끝나고, 무료입니다.
          </p>
          <Link
            href="/quiz"
            style={{
              display: "block",
              padding: "16px 20px",
              borderRadius: 14,
              background: "#191F28",
              color: "#fff",
              fontSize: 16,
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            나도 진단받기
          </Link>
          <Link
            href="/"
            style={{
              display: "inline-block",
              marginTop: 14,
              fontSize: 13.5,
              fontWeight: 700,
              color: "var(--dim)",
              textDecoration: "none",
            }}
          >
            오늘의 잇템 둘러보기
          </Link>
        </div>

        {food && (
          <p style={{ marginTop: 26, fontSize: 12, color: "var(--faint)", textAlign: "center", lineHeight: 1.7 }}>
            이 결과는 친구가 받은 것입니다. 사람마다 답이 달라 메뉴도 달라집니다.
          </p>
        )}
      </main>
    </div>
  );
}
