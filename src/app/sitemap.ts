import type { MetadataRoute } from "next";
import { FOODS } from "@/data/foods";
import { THEMES } from "@/data/themes";

const BASE = "https://eatodayme.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/food`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/quiz`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/theme`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/trend`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/search`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/region`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/roulette`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/feedback`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  // 테마 15개
  const themePages: MetadataRoute.Sitemap = THEMES.map((t) => ({
    url: `${BASE}/theme?k=${encodeURIComponent(t.key)}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // 메뉴 상세 — 롱테일 검색 유입의 핵심 (개수는 foods 테이블을 따릅니다)
  const foodPages: MetadataRoute.Sitemap = FOODS.map((f) => ({
    url: `${BASE}/food/${encodeURIComponent(f.name)}`,
    lastModified: f.updatedAt ? new Date(f.updatedAt) : undefined,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...themePages, ...foodPages];
}
