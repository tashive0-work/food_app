import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SplashScreen } from "@/components/SplashScreen";

export const metadata: Metadata = {
  metadataBase: new URL("https://eatodayme.com"),
  title: "오늘 뭐 먹지? 고민은 여기까지!",
  description: "점심·저녁 메뉴 고민될 때, 8문항만 답하면 지금 상태에 맞는 메뉴를 골라드려요. 무료.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "오늘 뭐 먹지",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "오늘 뭐 먹지? 고민은 여기까지!",
    description: "점심·저녁 메뉴 고민될 때, 8문항만 답하면 지금 상태에 맞는 메뉴를 골라드려요. 무료.",
    url: "https://eatodayme.com",
    siteName: "오늘 뭐 먹지",
    images: [{
      url: "/og-image.png",
      width: 1200,
      height: 630,
      alt: "오늘 뭐 먹지? 고민은 여기까지!",
    }],
    locale: "ko_KR",
    type: "website",
  },
  // 네이버 서치어드바이저 / 구글 서치 콘솔 소유확인
  verification: {
    google: "VGRzWxLfRkUeTxWemr6hRaA7l43IEAzPc29B_OpPpQM",
    other: {
      "naver-site-verification": "e2784fad6a60e9ca28e22376b274e06aace5ba31",
    },
  },
  alternates: {
    canonical: "https://eatodayme.com",
  },
  keywords: [
    "메뉴 추천", "점심 메뉴 추천", "저녁 메뉴 추천", "메뉴 고르기",
    "오늘 뭐 먹지", "혼밥 메뉴", "메뉴 고민", "음식 추천 사이트",
  ],
  twitter: {
    card: "summary_large_image",
    title: "오늘 뭐 먹지? 고민은 여기까지!",
    description: "점심·저녁 메뉴 고민될 때, 8문항만 답하면 지금 상태에 맞는 메뉴를 골라드려요. 무료.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#E8663D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#E8663D" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="오늘 뭐 먹지" />
      </head>
      <body>
        <SplashScreen />
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(rs) {
                  rs.forEach(function(r) { r.unregister(); });
                });
                if (window.caches) {
                  caches.keys().then(function(ks) {
                    ks.forEach(function(k) { caches.delete(k); });
                  });
                }
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
