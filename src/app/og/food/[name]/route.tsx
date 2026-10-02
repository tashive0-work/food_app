import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";
import { FOODS } from "@/data/foods";

export const runtime = "nodejs";

function findFood(raw: string) {
  const name = decodeURIComponent(raw || "");
  return (
    FOODS.find((f) => f.name === name) ||
    FOODS.find((f) => f.name.replace(/\s+/g, "") === name.replace(/\s+/g, "")) ||
    null
  );
}

export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {
  const food = findFood(params.name);

  if (!food) {
    return new Response("Not Found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  }

  // 1. 폰트 로드 (Pretendard Bold OTF)
  const fontPath = path.join(process.cwd(), "assets", "fonts", "Pretendard-Bold.otf");
  const fontData = fs.readFileSync(fontPath);

  // 2. 마스코트 이미지 로드 (base64 Data URL)
  const mascotPath = path.join(process.cwd(), "public", "mascot", "omeok-default.png");
  const mascotBase64 = fs.readFileSync(mascotPath).toString("base64");
  const mascotSrc = `data:image/png;base64,${mascotBase64}`;

  // 3. 워드마크 로고 로드 (흰색 벡터 SVG Data URL)
  const logoPath = path.join(process.cwd(), "public", "brand", "logo-wordmark.svg");
  const originalLogoSvg = fs.readFileSync(logoPath, "utf8");
  const whiteLogoSvg = originalLogoSvg.replace(/fill="#E8663D"/g, 'fill="#FFFFFF"');
  const logoBase64 = Buffer.from(whiteLogoSvg).toString("base64");
  const logoSrc = `data:image/svg+xml;base64,${logoBase64}`;

  // 메뉴명 길이에 따른 폰트 크기 조절
  const nameLength = food.name.length;
  const titleFontSize = nameLength > 12 ? 52 : nameLength > 8 ? 62 : 76;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#E8663D",
          padding: "60px 80px",
          fontFamily: "Pretendard",
        }}
      >
        {/* 좌측 컨텐츠 영역 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
            flex: 1,
            paddingRight: "40px",
          }}
        >
          {/* 상단: 카테고리 + 메뉴명 + 서브설명 */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "rgba(255, 255, 255, 0.22)",
                color: "#FFFFFF",
                fontSize: "24px",
                fontWeight: 700,
                padding: "8px 24px",
                borderRadius: "30px",
                alignSelf: "flex-start",
                marginBottom: "24px",
              }}
            >
              {food.kind}
            </div>
            <div
              style={{
                display: "flex",
                color: "#FFFFFF",
                fontSize: `${titleFontSize}px`,
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: "-0.03em",
                wordBreak: "keep-all",
              }}
            >
              {food.name}
            </div>
            <div
              style={{
                display: "flex",
                color: "rgba(255, 255, 255, 0.85)",
                fontSize: "26px",
                fontWeight: 700,
                marginTop: "20px",
              }}
            >
              오늘의 잇템 추천 메뉴
            </div>
          </div>

          {/* 하단: 흰색 워드마크 로고 */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <img
              src={logoSrc}
              alt="오늘의 잇템"
              width="190"
              height="35"
              style={{ objectFit: "contain" }}
            />
          </div>
        </div>

        {/* 우측 마스코트 오먹이 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "420px",
            height: "420px",
            flexShrink: 0,
          }}
        >
          <img
            src={mascotSrc}
            alt="오먹이"
            width="420"
            height="420"
            style={{ objectFit: "contain" }}
          />
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Pretendard",
          data: fontData,
          weight: 700,
          style: "normal",
        },
      ],
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=604800",
      },
    }
  );
}
