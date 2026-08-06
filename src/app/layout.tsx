import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://food-app-three-beta-89.vercel.app"),
  title: "오늘 뭐 먹지 - 상태 기반 음식 추천",
  description: "지금 내 상태에 딱 맞는 메뉴를 진단받고 추천받아 보세요.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "오늘 뭐 먹지",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
  openGraph: {
    title: "오늘 뭐 먹지 - 상태 기반 음식 추천",
    description: "지금 내 상태에 딱 맞는 메뉴를 진단받고 추천받아 보세요.",
    url: "https://food-app-three-beta-89.vercel.app",
    siteName: "오늘 뭐 먹지",
    images: [{
      url: "/og-image.png",
      width: 1200,
      height: 630,
      alt: "오늘 뭐 먹지 - 상태 기반 음식 추천",
    }],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "오늘 뭐 먹지 - 상태 기반 음식 추천",
    description: "지금 내 상태에 딱 맞는 메뉴를 진단받고 추천받아 보세요.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#1F6F4A",
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
        <meta name="theme-color" content="#1F6F4A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="오늘 뭐 먹지" />
      </head>
      <body>
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
