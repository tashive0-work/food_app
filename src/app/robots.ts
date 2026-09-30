import type { MetadataRoute } from "next";

const BASE = "https://eatodayme.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // 운영·개인 화면은 검색에 노출하지 않습니다.
        disallow: ["/admin", "/api/", "/result", "/favorites", "/settings"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
