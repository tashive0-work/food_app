import fs from "fs";
import path from "path";
import sharp from "sharp";

/**
 * build-og-image.mjs
 * 
 * 1200x630 규격의 OG 공유 이미지(public/og-image.png)를 생성합니다.
 * 기존 테라코타 배경, 마스코트(오먹이), 칩 3개, 서브텍스트의 레이아웃을 그대로 유지하고
 * 타이틀 영역을 '오늘의 잇템' 워드마크 벡터 로고(public/brand/logo-wordmark.svg)로 합성합니다.
 */
async function buildOgImage() {
  const rootDir = process.cwd();
  const logoPath = path.join(rootDir, "public", "brand", "logo-wordmark.svg");
  const targetPngPath = path.join(rootDir, "public", "og-image.png");

  if (!fs.existsSync(logoPath)) {
    throw new Error(`Logo file not found: ${logoPath}`);
  }

  // 1. logo-wordmark.svg 읽기 및 fill을 흰색(#FFFFFF)으로 변환
  const originalSvg = fs.readFileSync(logoPath, "utf8");
  const whiteSvg = originalSvg.replace(/fill="#E8663D"/g, 'fill="#FFFFFF"');

  // viewBox="4.0 -78.0 431.4 80.0"
  // 높이 66px 기준 너비 계산 (431.4 / 80.0 * 66 ≈ 356px)
  const targetHeight = 66;
  const targetWidth = Math.round((431.4 / 80.0) * targetHeight);

  // SVG 벡터 패스를 고해상도(300 DPI)로 래스터화 (텍스트 폰트 깨짐 없는 벡터 렌더링)
  const logoBuffer = await sharp(Buffer.from(whiteSvg), { density: 300 })
    .resize(targetWidth, targetHeight, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  // 2. 제목 영역을 덮을 테라코타 단색 패치 (#E8663D, rgb: 232, 102, 61)
  const patchWidth = 480;
  const patchHeight = 100;
  const patchBuffer = await sharp({
    create: {
      width: patchWidth,
      height: patchHeight,
      channels: 4,
      background: { r: 232, g: 102, b: 61, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

  // 3. 베이스 이미지에서 타이틀 영역 패치 후 새 로고 합성
  const tempPath = targetPngPath + ".tmp";
  await sharp(targetPngPath)
    .composite([
      {
        input: patchBuffer,
        left: 70,
        top: 135,
      },
      {
        input: logoBuffer,
        left: 84,
        top: 153,
      },
    ])
    .toFile(tempPath);

  fs.renameSync(tempPath, targetPngPath);
  console.log(`[build-og-image] public/og-image.png successfully generated! (1200x630)`);
}

buildOgImage().catch((err) => {
  console.error("[build-og-image] Failed to build OG image:", err);
  process.exit(1);
});
