import fs from "fs";
import path from "path";
import sharp from "sharp";

/**
 * build-og-image.mjs
 * 
 * 1200x630 규격의 OG 공유 이미지(public/og-image.png)를 생성합니다.
 * 1) 타이틀 영역을 '오늘의 잇템' 워드마크 벡터 로고로 교체
 * 2) 칩 3개 중 2번째 '215종 메뉴'를 '1,600+ 메뉴'로 교체
 * 3) 테라코타 배경, 마스코트(오먹이), 서브텍스트 등 나머지 디자인 100% 보존
 */
async function buildOgImage() {
  const rootDir = process.cwd();
  const logoPath = path.join(rootDir, "public", "brand", "logo-wordmark.svg");
  const fontPath = path.join(rootDir, "assets", "fonts", "Pretendard-Bold.otf");
  const targetPngPath = path.join(rootDir, "public", "og-image.png");

  if (!fs.existsSync(logoPath)) {
    throw new Error(`Logo file not found: ${logoPath}`);
  }

  // 1. logo-wordmark.svg 읽기 및 fill을 흰색(#FFFFFF)으로 변환
  const originalSvg = fs.readFileSync(logoPath, "utf8");
  const whiteSvg = originalSvg.replace(/fill="#E8663D"/g, 'fill="#FFFFFF"');

  const targetHeight = 66;
  const targetWidth = Math.round((431.4 / 80.0) * targetHeight);

  const logoBuffer = await sharp(Buffer.from(whiteSvg), { density: 300 })
    .resize(targetWidth, targetHeight, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  // 2. 제목 영역을 덮을 테라코타 단색 패치 (#E8663D, rgb: 232, 102, 61)
  const titlePatchBuffer = await sharp({
    create: {
      width: 480,
      height: 100,
      channels: 4,
      background: { r: 232, g: 102, b: 61, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

  // 3. '1,600+ 메뉴' 칩 SVG 생성 (폰트 base64 임베딩)
  let fontBase64 = "";
  if (fs.existsSync(fontPath)) {
    fontBase64 = fs.readFileSync(fontPath).toString("base64");
  }

  const chipSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="174" height="55" viewBox="0 0 174 55">
  <defs>
    <style>
      ${fontBase64 ? `@font-face { font-family: 'Pretendard'; src: url('data:font/otf;base64,${fontBase64}') format('opentype'); font-weight: 700; }` : ""}
      .chipText {
        font-family: 'Pretendard', sans-serif;
        font-size: 23px;
        font-weight: 700;
        fill: #CB451F;
        letter-spacing: -0.02em;
      }
    </style>
  </defs>
  <rect width="174" height="55" rx="27.5" fill="#FFFFFF"/>
  <text x="87" y="36" class="chipText" text-anchor="middle">1,600+ 메뉴</text>
</svg>`;

  const chipBuffer = await sharp(Buffer.from(chipSvg), { density: 300 })
    .resize(174, 55)
    .png()
    .toBuffer();

  // 4. 합성
  const tempPath = targetPngPath + ".tmp";
  await sharp(targetPngPath)
    .composite([
      // 타이틀 영역 패치 및 로고 합성
      {
        input: titlePatchBuffer,
        left: 70,
        top: 135,
      },
      {
        input: logoBuffer,
        left: 84,
        top: 153,
      },
      // 2번째 칩 '1,600+ 메뉴' 합성 (left: 253, top: 351)
      {
        input: chipBuffer,
        left: 253,
        top: 351,
      },
    ])
    .toFile(tempPath);

  fs.renameSync(tempPath, targetPngPath);
  console.log(`[build-og-image] public/og-image.png successfully updated! (1200x630, 1,600+ 메뉴 배지 반영)`);
}

buildOgImage().catch((err) => {
  console.error("[build-og-image] Failed to build OG image:", err);
  process.exit(1);
});
