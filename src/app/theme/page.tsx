import type { Metadata } from "next";
import { THEMES } from "@/data/themes";
import { THEME_INTROS } from "@/data/themeIntros";
import ThemeClient from "./ThemeClient";

interface PageProps {
  searchParams: { k?: string };
}

export function generateMetadata({ searchParams }: PageProps): Metadata {
  const k = searchParams?.k || "혼자";
  const curTheme = THEMES.find((t) => t.key === k || t.label === k) || THEMES[0];
  const themeKey = curTheme ? curTheme.key : k;
  const themeName = curTheme ? curTheme.label : k;
  const themeDesc = curTheme ? curTheme.desc : "오늘 상태에 맞는 메뉴를 골라드려요.";

  const intro = THEME_INTROS[themeKey];
  const firstParagraph = intro?.paragraphs?.[0];
  const description = firstParagraph
    ? (firstParagraph.length > 120 ? firstParagraph.slice(0, 120) : firstParagraph)
    : `${themeName}에 딱 맞는 메뉴 추천. ${themeDesc}`;

  const encodedK = encodeURIComponent(themeKey);
  const canonical = `https://eatodayme.com/theme?k=${encodedK}`;
  const title = `${themeName} 메뉴 추천 — ${themeDesc}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${title} | 오늘의 잇템`,
      description,
      url: canonical,
    },
    twitter: {
      title: `${title} | 오늘의 잇템`,
      description,
    },
  };
}

export default function ThemePage({ searchParams }: PageProps) {
  const k = searchParams?.k || "혼자";
  const curTheme = THEMES.find((t) => t.key === k || t.label === k) || THEMES[0];
  const themeKey = curTheme ? curTheme.key : k;
  const themeName = curTheme ? curTheme.label : k;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "홈",
        item: "https://eatodayme.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "테마",
        item: "https://eatodayme.com/theme",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: themeName,
        item: `https://eatodayme.com/theme?k=${encodeURIComponent(themeKey)}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ThemeClient initialKey={k} />
    </>
  );
}
