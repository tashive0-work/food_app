import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const srcDir = path.join(rootDir, '오먹이');
const outDir = path.join(rootDir, 'public', 'mascot');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 매핑: 원본 파일명 후보 (공백 및 언더바 지원) -> 출력 파일명
const mapping = [
  {
    candidates: ['오먹이_메인.png', '오먹이 메인.png'],
    output: 'omeok-default.png',
  },
  {
    candidates: ['오먹이_궁금.png', '오먹이 궁금.png'],
    output: 'omeok-thinking.png',
  },
  {
    candidates: ['오먹이_신남.png', '오먹이 신남.png'],
    output: 'omeok-happy.png',
  },
  {
    candidates: ['오먹이_배고픔.png', '오먹이 배고픔.png'],
    output: 'omeok-hungry.png',
  },
  {
    candidates: ['오먹이_귀찮음.png', '오먹이 귀찮음.png'],
    output: 'omeok-tired.png',
  },
];

console.log('=== 마스코트 오먹이 이미지 1024x1024 변환 시작 ===\n');

for (const item of mapping) {
  let foundSrc = null;
  for (const cand of item.candidates) {
    const p = path.join(srcDir, cand);
    if (fs.existsSync(p)) {
      foundSrc = p;
      break;
    }
  }

  if (!foundSrc) {
    console.error(`[오류] 원본 파일을 찾을 수 없습니다: ${item.candidates.join(' 또는 ')}`);
    process.exit(1);
  }

  const destPath = path.join(outDir, item.output);
  console.log(`변환 중: ${path.basename(foundSrc)} -> ${item.output}`);

  await sharp(foundSrc)
    .resize(1024, 1024, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ quality: 100 })
    .toFile(destPath);
}

console.log('\n=== 변환 완료 및 결과 검증 ===\n');

for (const item of mapping) {
  const destPath = path.join(outDir, item.output);
  const metadata = await sharp(destPath).metadata();
  const stat = fs.statSync(destPath);
  const sizeKb = (stat.size / 1024).toFixed(1);

  const hasAlpha = metadata.hasAlpha === true || metadata.channels === 4;
  console.log(`- ${item.output}:`);
  console.log(`  해상도: ${metadata.width}x${metadata.height}`);
  console.log(`  용량: ${sizeKb} KB`);
  console.log(`  채널: ${metadata.channels}채널 (${metadata.space})`);
  console.log(`  알파 채널(RGBA): ${hasAlpha ? '예 (투명 배경 유지됨)' : '아니오'}`);
}

console.log('\n모든 파일이 정상 변환되었습니다.');
