import type { MetadataRoute } from "next";
import { FOODS } from "@/data/foods";
import { THEMES } from "@/data/themes";

const BASE = "https://eatodayme.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/food`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/quiz`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/theme`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/trend`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/search`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/feedback`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  // 테마 15개
  const themePages: MetadataRoute.Sitemap = THEMES.map((t) => ({
    url: `${BASE}/theme?k=${encodeURIComponent(t.key)}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // 메뉴 상세 227개 — 롱테일 검색 유입의 핵심
  const foodPages: MetadataRoute.Sitemap = FOODS.map((f) => ({
    url: `${BASE}/food/${encodeURIComponent(f.name)}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...themePages, ...foodPages];
}
