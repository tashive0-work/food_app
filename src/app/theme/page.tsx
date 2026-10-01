import type { Metadata } from "next";
import { THEMES } from "@/data/themes";
import ThemeClient from "./ThemeClient";

interface PageProps {
  searchParams: { k?: string };
}

export function generateMetadata({ searchParams }: PageProps): Metadata {
  const k = searchParams?.k || "혼자";
  const curTheme = THEMES.find((t) => t.key === k || t.label === k) || THEMES[0];
  const themeName = curTheme ? curTheme.label : k;
  const themeDesc = curTheme ? curTheme.desc : "오늘 상태에 맞는 메뉴를 골라드려요.";
  const encodedK = encodeURIComponent(k);
  const canonical = `https://eatodayme.com/theme?k=${encodedK}`;
  const title = `${themeName} 메뉴 추천 — ${themeDesc}`;
  const description = `${themeName}에 딱 맞는 메뉴 추천. ${themeDesc}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${title} | 오늘 뭐 먹지`,
      description,
      url: canonical,
    },
    twitter: {
      title: `${title} | 오늘 뭐 먹지`,
      description,
    },
  };
}

export default function ThemePage({ searchParams }: PageProps) {
  const k = searchParams?.k || "혼자";
  return <ThemeClient initialKey={k} />;
}
