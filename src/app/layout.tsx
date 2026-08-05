import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_KR, Black_Han_Sans, Nanum_Gothic_Coding } from "next/font/google";
import "./globals.css";

const ibmPlex = IBM_Plex_Sans_KR({
  weight: ["400", "500", "600", "700"],
  preload: false,
  variable: "--font-ibm",
  display: "swap",
});

const blackHan = Black_Han_Sans({
  weight: ["400"],
  preload: false,
  variable: "--font-blackhan",
  display: "swap",
});

const nanumGothic = Nanum_Gothic_Coding({
  weight: ["400", "700"],
  preload: false,
  variable: "--font-nanum",
  display: "swap",
});

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
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "오늘 뭐 먹지 로고",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#C7302A",
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
    <html lang="ko" className={`${ibmPlex.variable} ${blackHan.variable} ${nanumGothic.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#C7302A" />
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
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
