import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";
import { shareTypeByKey } from "@/lib/shareType";

export const runtime = "nodejs";

/**
 * 진단 결과 공유 카드 이미지.
 *
 *   /og/result?t=spicy&f=김치찌개          → 1200×630 (카톡·링크 미리보기용)
 *   /og/result?t=spicy&f=김치찌개&s=story  → 1080×1920 (인스타 스토리용)
 *
 * 메뉴 공유 카드(/og/food/[name])와 같은 폰트·마스코트·로고를 씁니다.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = shareTypeByKey(searchParams.get("t") || undefined);
  const food = (searchParams.get("f") || "").slice(0, 20);
  const story = searchParams.get("s") === "story";

  const fontPath = path.join(process.cwd(), "assets", "fonts", "Pretendard-Bold.otf");
  const fontData = fs.readFileSync(fontPath);

  const mascotPath = path.join(process.cwd(), "public", "mascot", "omeok-default.png");
  const mascotSrc = `data:image/png;base64,${fs.readFileSync(mascotPath).toString("base64")}`;

  const logoPath = path.join(process.cwd(), "public", "brand", "logo-wordmark.svg");
  const whiteLogo = fs.readFileSync(logoPath, "utf8").replace(/fill="#E8663D"/g, 'fill="#FFFFFF"');
  const logoSrc = `data:image/svg+xml;base64,${Buffer.from(whiteLogo).toString("base64")}`;

  // 유형 이름이 길면 글자를 줄입니다
  const n = type.name.length;
  const nameSize = story ? (n > 10 ? 76 : n > 7 ? 88 : 100) : (n > 10 ? 58 : n > 7 ? 68 : 78);

  const Badge = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.22)",
        color: "#FFFFFF",
        fontSize: story ? "30px" : "24px",
        fontWeight: 700,
        padding: story ? "12px 30px" : "8px 24px",
        borderRadius: "999px",
        alignSelf: "flex-start",
      }}
    >
      오늘의 음식 유형
    </div>
  );

  const TypeName = (
    <div
      style={{
        display: "flex",
        color: "#FFFFFF",
        fontSize: `${nameSize}px`,
        fontWeight: 700,
        lineHeight: 1.15,
        letterSpacing: "-0.03em",
        wordBreak: "keep-all",
      }}
    >
      {type.emoji} {type.name}
    </div>
  );

  const TypeLine = (
    <div
      style={{
        display: "flex",
        color: "rgba(255,255,255,0.88)",
        fontSize: story ? "34px" : "28px",
        fontWeight: 700,
        wordBreak: "keep-all",
      }}
    >
      {type.line}
    </div>
  );

  const FoodBox = food ? (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: "rgba(255,255,255,0.16)",
        borderRadius: story ? "28px" : "22px",
        padding: story ? "28px 34px" : "22px 28px",
        alignSelf: "flex-start",
      }}
    >
      <div
        style={{
          display: "flex",
          color: "rgba(255,255,255,0.8)",
          fontSize: story ? "28px" : "23px",
          fontWeight: 700,
        }}
      >
        오늘 가장 잘 맞는 메뉴
      </div>
      <div
        style={{
          display: "flex",
          color: "#FFFFFF",
          fontSize: story ? "62px" : "48px",
          fontWeight: 700,
          marginTop: story ? "10px" : "6px",
          letterSpacing: "-0.02em",
        }}
      >
        {food}
      </div>
    </div>
  ) : null;

  const Logo = (
    <img
      src={logoSrc}
      alt="오늘의 잇템"
      width={story ? 240 : 190}
      height={story ? 44 : 35}
      style={{ objectFit: "contain" }}
    />
  );

  const body = story ? (
    // ── 인스타 스토리 (세로) ──
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#E8663D",
        padding: "150px 80px 120px",
        fontFamily: "Pretendard",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "28px",
          width: "100%",
        }}
      >
        {Badge}
        {TypeName}
        {TypeLine}
      </div>

      <img src={mascotSrc} alt="오먹이" width="420" height="420" style={{ objectFit: "contain" }} />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "34px",
          width: "100%",
        }}
      >
        {FoodBox}
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          {Logo}
          <div style={{ display: "flex", color: "rgba(255,255,255,0.8)", fontSize: "26px", fontWeight: 700 }}>
            eatodayme.com
          </div>
        </div>
      </div>
    </div>
  ) : (
    // ── 링크 미리보기 (가로) ──
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
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {Badge}
          {TypeName}
          {TypeLine}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          {FoodBox}
          {Logo}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "400px",
          height: "400px",
          flexShrink: 0,
        }}
      >
        <img src={mascotSrc} alt="오먹이" width="400" height="400" style={{ objectFit: "contain" }} />
      </div>
    </div>
  );

  return new ImageResponse(body, {
    width: story ? 1080 : 1200,
    height: story ? 1920 : 630,
    fonts: [{ name: "Pretendard", data: fontData, weight: 700, style: "normal" }],
    headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800" },
  });
}
