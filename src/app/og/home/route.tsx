import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";
import { FOODS } from "@/data/foods";

export const runtime = "nodejs";

/**
 * 사이트 대표 공유 카드 (1200×630).
 *
 * 왜 이미지 파일을 안 쓰는가: 예전 `public/og-image.png` 에는 「215종 메뉴」라고
 * 적혀 있었는데 메뉴가 2,000개를 넘었습니다. 그림 파일로 두면 메뉴가 늘 때마다
 * 누군가 다시 만들어야 하고, 안 하면 계속 틀린 숫자가 카톡에 뜹니다.
 * 여기서 FOODS.length 를 읽어 그리면 빌드할 때마다 저절로 맞습니다.
 */
export async function GET() {
  const fontPath = path.join(process.cwd(), "assets", "fonts", "Pretendard-Bold.otf");
  const fontData = fs.readFileSync(fontPath);

  const mascotPath = path.join(process.cwd(), "public", "mascot", "omeok-default.png");
  const mascotSrc = `data:image/png;base64,${fs.readFileSync(mascotPath).toString("base64")}`;

  const logoPath = path.join(process.cwd(), "public", "brand", "logo-wordmark.svg");
  const whiteLogo = fs.readFileSync(logoPath, "utf8").replace(/fill="#E8663D"/g, 'fill="#FFFFFF"');
  const logoSrc = `data:image/svg+xml;base64,${Buffer.from(whiteLogo).toString("base64")}`;

  const count = FOODS.length.toLocaleString("ko-KR");

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 70px",
          background: "linear-gradient(135deg, #F2764A 0%, #E8663D 55%, #D8502A 100%)",
          fontFamily: "Pretendard",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} alt="오늘의 잇템" width={260} height={48} style={{ display: "block" }} />

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: "760px" }}>
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                alignItems: "center",
                backgroundColor: "rgba(255,255,255,0.22)",
                color: "#FFFFFF",
                fontSize: "26px",
                fontWeight: 700,
                padding: "9px 26px",
                borderRadius: "999px",
                marginBottom: "22px",
              }}
            >
              메뉴 {count}가지
            </div>
            <div style={{ display: "flex", color: "#FFFFFF", fontSize: "80px", fontWeight: 700, lineHeight: 1.18 }}>
              오늘 뭐 먹지?
            </div>
            <div style={{ display: "flex", color: "rgba(255,255,255,0.93)", fontSize: "34px", fontWeight: 700, lineHeight: 1.45, marginTop: "18px" }}>
              8문항만 답하면 지금 상태에 맞는 메뉴를 골라드려요
            </div>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mascotSrc} alt="" width={230} height={230} style={{ display: "block" }} />
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [{ name: "Pretendard", data: fontData, style: "normal", weight: 700 }],
    }
  );
}
