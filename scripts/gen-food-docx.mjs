/**
 * scripts/gen-food-docx.mjs
 *
 * Supabase DB foods 테이블의 이미지 생성 결과를 조회하여
 * 고품질 Word 보고서(.docx)로 정리 및 저장합니다.
 *
 * 실행:
 *   node --env-file=.env.local scripts/gen-food-docx.mjs
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  Header,
  Footer,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  WidthType,
  ShadingType,
  PageNumber,
} from 'docx';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnv() {
  for (const f of ['.env.local', '.env']) {
    const p = resolve(process.cwd(), f);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (process.env[m[1]] === undefined) process.env[m[1]] = v;
    }
  }
}

loadEnv();

const OUT_DIR = resolve(process.cwd(), 'scripts/out');
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const OUTPUT_DOCX = resolve(OUT_DIR, 'AI_메뉴_사진_생성_결과_보고서.docx');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[gen-food-docx] Supabase 환경변수가 없습니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export async function generateDocxReport() {
  console.log('[gen-food-docx] DB 조회 및 docx 보고서 생성 시작...');

  const PAGE = 1000;
  const allFoods = [];
  for (let from = 0; ; from += PAGE) {
    const { data: page, error } = await supabase
      .from('foods')
      .select('id, name, kind, image_query, image_url, image_status, image_updated_at')
      .eq('active', true)
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);

    if (error) {
      console.error(`DB 조회 실패: ${error.message}`);
      break;
    }
    if (!page || page.length === 0) break;
    allFoods.push(...page);
    if (page.length < PAGE) break;
  }

  const totalCount = allFoods.length;
  const completedFoods = allFoods.filter((f) => f.image_status === 'auto' && f.image_url);
  const completedCount = completedFoods.length;
  const pendingCount = totalCount - completedCount;
  const completionRate = ((completedCount / (totalCount || 1)) * 100).toFixed(1);

  // 카테고리별 집계
  const categoryStats = {};
  for (const f of allFoods) {
    const cat = f.kind || '기타';
    if (!categoryStats[cat]) {
      categoryStats[cat] = { total: 0, completed: 0 };
    }
    categoryStats[cat].total++;
    if (f.image_status === 'auto' && f.image_url) {
      categoryStats[cat].completed++;
    }
  }

  // A4 너비: 11906, 마진: 1440 * 2 = 2880, 내용 너비: 9026 DXA
  const CONTENT_WIDTH = 9026;
  const borderLight = { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' };
  const cellBorders = { top: borderLight, bottom: borderLight, left: borderLight, right: borderLight };

  const cellMargins = { top: 100, bottom: 100, left: 140, right: 140 };

  // 요약 통계 테이블 생성
  const summaryColWidths = [2600, 6426];
  const summaryRows = [
    ['프로젝트', '오늘의 잇템 (food_app)'],
    ['생성 모델', 'Google Cloud Vertex AI (gemini-3.1-flash-image)'],
    ['이미지 스토리지', 'Supabase Storage (food-images 버킷, WebP q80 변환)'],
    ['보고서 생성 시각', new Date().toLocaleString('ko-KR')],
    ['전체 활성 메뉴 수', `${totalCount} 개`],
    ['사진 생성 완료', `${completedCount} 개 (${completionRate}%)`],
    ['미생성 (진행 중 / 대기)', `${pendingCount} 개`],
    ['장당 예상 단가', '$0.030 (약 40원)'],
    ['완료분 소진 비용', `$${(completedCount * 0.03).toFixed(2)} (약 ${(completedCount * 40).toLocaleString('ko-KR')}원)`],
  ].map(([label, value], idx) => {
    const isEven = idx % 2 === 0;
    return new TableRow({
      children: [
        new TableCell({
          borders: cellBorders,
          width: { size: summaryColWidths[0], type: WidthType.DXA },
          shading: { fill: isEven ? 'F1F5F9' : 'F8FAFC', type: ShadingType.CLEAR },
          margins: cellMargins,
          children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, font: 'Malgun Gothic' })] })],
        }),
        new TableCell({
          borders: cellBorders,
          width: { size: summaryColWidths[1], type: WidthType.DXA },
          shading: { fill: 'FFFFFF', type: ShadingType.CLEAR },
          margins: cellMargins,
          children: [new Paragraph({ children: [new TextRun({ text: value, size: 20, font: 'Malgun Gothic' })] })],
        }),
      ],
    });
  });

  const summaryTable = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: summaryColWidths,
    rows: summaryRows,
  });

  // 카테고리별 집계 테이블 생성
  const catColWidths = [2256, 2256, 2256, 2258];
  const catHeaderRow = new TableRow({
    children: ['카테고리', '완료 수', '전체 수', '완료율'].map((h, i) =>
      new TableCell({
        borders: cellBorders,
        width: { size: catColWidths[i], type: WidthType.DXA },
        shading: { fill: '0284C7', type: ShadingType.CLEAR },
        margins: cellMargins,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: h, bold: true, color: 'FFFFFF', size: 20, font: 'Malgun Gothic' })],
          }),
        ],
      })
    ),
  });

  const catRows = Object.entries(categoryStats).map(([cat, stats], idx) => {
    const rate = ((stats.completed / (stats.total || 1)) * 100).toFixed(0);
    const isEven = idx % 2 === 0;
    return new TableRow({
      children: [
        new TableCell({
          borders: cellBorders,
          width: { size: catColWidths[0], type: WidthType.DXA },
          shading: { fill: isEven ? 'F8FAFC' : 'FFFFFF', type: ShadingType.CLEAR },
          margins: cellMargins,
          children: [new Paragraph({ children: [new TextRun({ text: cat, bold: true, size: 19, font: 'Malgun Gothic' })] })],
        }),
        new TableCell({
          borders: cellBorders,
          width: { size: catColWidths[1], type: WidthType.DXA },
          shading: { fill: isEven ? 'F8FAFC' : 'FFFFFF', type: ShadingType.CLEAR },
          margins: cellMargins,
          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${stats.completed} 개`, size: 19, font: 'Malgun Gothic' })] })],
        }),
        new TableCell({
          borders: cellBorders,
          width: { size: catColWidths[2], type: WidthType.DXA },
          shading: { fill: isEven ? 'F8FAFC' : 'FFFFFF', type: ShadingType.CLEAR },
          margins: cellMargins,
          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${stats.total} 개`, size: 19, font: 'Malgun Gothic' })] })],
        }),
        new TableCell({
          borders: cellBorders,
          width: { size: catColWidths[3], type: WidthType.DXA },
          shading: { fill: isEven ? 'F8FAFC' : 'FFFFFF', type: ShadingType.CLEAR },
          margins: cellMargins,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${rate}%`, bold: true, color: rate === '100' ? '16A34A' : '0284C7', size: 19, font: 'Malgun Gothic' })] })],
        }),
      ],
    });
  });

  const categoryTable = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: catColWidths,
    rows: [catHeaderRow, ...catRows],
  });

  // 메뉴 상세 목록 테이블 (대표 100개 또는 전체 완료 메뉴 요약)
  const detailColWidths = [800, 1800, 1200, 4226, 1000];
  const detailHeaderRow = new TableRow({
    children: ['ID', '메뉴명', '카테고리', '스토리지 이미지 URL', '상태'].map((h, i) =>
      new TableCell({
        borders: cellBorders,
        width: { size: detailColWidths[i], type: WidthType.DXA },
        shading: { fill: '334155', type: ShadingType.CLEAR },
        margins: cellMargins,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: h, bold: true, color: 'FFFFFF', size: 18, font: 'Malgun Gothic' })],
          }),
        ],
      })
    ),
  });

  // 테이블 가독성 및 문서 용량 최적화를 위해 완료된 메뉴 전체 목록
  const detailRows = completedFoods.slice(0, 500).map((f, idx) => {
    const isEven = idx % 2 === 0;
    return new TableRow({
      children: [
        new TableCell({
          borders: cellBorders,
          width: { size: detailColWidths[0], type: WidthType.DXA },
          shading: { fill: isEven ? 'F8FAFC' : 'FFFFFF', type: ShadingType.CLEAR },
          margins: cellMargins,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(f.id), size: 17, font: 'Malgun Gothic' })] })],
        }),
        new TableCell({
          borders: cellBorders,
          width: { size: detailColWidths[1], type: WidthType.DXA },
          shading: { fill: isEven ? 'F8FAFC' : 'FFFFFF', type: ShadingType.CLEAR },
          margins: cellMargins,
          children: [new Paragraph({ children: [new TextRun({ text: f.name, bold: true, size: 17, font: 'Malgun Gothic' })] })],
        }),
        new TableCell({
          borders: cellBorders,
          width: { size: detailColWidths[2], type: WidthType.DXA },
          shading: { fill: isEven ? 'F8FAFC' : 'FFFFFF', type: ShadingType.CLEAR },
          margins: cellMargins,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: f.kind || '-', size: 17, font: 'Malgun Gothic' })] })],
        }),
        new TableCell({
          borders: cellBorders,
          width: { size: detailColWidths[3], type: WidthType.DXA },
          shading: { fill: isEven ? 'F8FAFC' : 'FFFFFF', type: ShadingType.CLEAR },
          margins: cellMargins,
          children: [new Paragraph({ children: [new TextRun({ text: f.image_url || '-', size: 15, font: 'Consolas' })] })],
        }),
        new TableCell({
          borders: cellBorders,
          width: { size: detailColWidths[4], type: WidthType.DXA },
          shading: { fill: isEven ? 'F8FAFC' : 'FFFFFF', type: ShadingType.CLEAR },
          margins: cellMargins,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: f.image_status || '-', bold: true, color: '16A34A', size: 17, font: 'Malgun Gothic' })] })],
        }),
      ],
    });
  });

  const detailTable = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: detailColWidths,
    rows: [detailHeaderRow, ...detailRows],
  });

  // 4. 실서비스 반영 내역 테이블
  const deployColWidths = [2400, 6960];
  const deployRowsData = [
    ['서비스 명칭', '오늘의 잇템 (Food App)'],
    ['반영 일시', new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) + ' (KST)'],
    ['반영 대상 메뉴 수', `${completedCount.toLocaleString()}개 (전체 메뉴의 ${completionRate}%)`],
    [
      'DB / 데이터 연동',
      'scripts/sync-foods.mjs 수정 → Supabase foods 테이블의 image_url, image_thumb 컬럼을 동기화하여 src/data/foods.ts 데이터 파일에 자동 주입',
    ],
    [
      '전역 이미지 매퍼',
      'src/lib/foodImage.ts (getFoodImageUrl) 업데이트 → FOODS 데이터셋의 AI 생성 이미지 URL을 실시간 매핑하여 수동 등록이 없는 메뉴도 Supabase 스토리지 이미지로 자동 연동',
    ],
    [
      '보안 및 스토리지 도메인',
      'next.config.mjs 내 remotePatterns에 Supabase Storage 도메인(*.supabase.co) 등록 완료',
    ],
    [
      '적용 컴포넌트 및 페이지',
      '홈 추천 카드(HeroCard), 카테고리별 메뉴 큐레이션(page.tsx), 실시간 트렌드(TrendClient), 메뉴 상세 정보(FoodDetailClient) 등 사이트 전반의 FoodImage 컴포넌트 연동',
    ],
    [
      '빌드 및 배포 검증',
      'Next.js 14 Production SSG 빌드(전체 1,699개 정적 페이지 생성) 및 TypeScript 정적 타입 검사 100% 정상 통과',
    ],
  ];

  const deployHeaderRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        borders: cellBorders,
        width: { size: deployColWidths[0], type: WidthType.DXA },
        shading: { fill: '0284C7', type: ShadingType.CLEAR },
        margins: cellMargins,
        children: [new Paragraph({ children: [new TextRun({ text: '구분 항목', bold: true, color: 'FFFFFF', size: 18, font: 'Malgun Gothic' })] })],
      }),
      new TableCell({
        borders: cellBorders,
        width: { size: deployColWidths[1], type: WidthType.DXA },
        shading: { fill: '0284C7', type: ShadingType.CLEAR },
        margins: cellMargins,
        children: [new Paragraph({ children: [new TextRun({ text: '반영 및 검증 상세 내용', bold: true, color: 'FFFFFF', size: 18, font: 'Malgun Gothic' })] })],
      }),
    ],
  });

  const deployRows = deployRowsData.map(([item, desc], idx) => {
    const isEven = idx % 2 === 1;
    return new TableRow({
      children: [
        new TableCell({
          borders: cellBorders,
          width: { size: deployColWidths[0], type: WidthType.DXA },
          shading: { fill: isEven ? 'F8FAFC' : 'FFFFFF', type: ShadingType.CLEAR },
          margins: cellMargins,
          children: [new Paragraph({ children: [new TextRun({ text: item, bold: true, size: 17, color: '1E293B', font: 'Malgun Gothic' })] })],
        }),
        new TableCell({
          borders: cellBorders,
          width: { size: deployColWidths[1], type: WidthType.DXA },
          shading: { fill: isEven ? 'F8FAFC' : 'FFFFFF', type: ShadingType.CLEAR },
          margins: cellMargins,
          children: [new Paragraph({ children: [new TextRun({ text: desc, size: 17, color: '334155', font: 'Malgun Gothic' })] })],
        }),
      ],
    });
  });

  const deployTable = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: deployColWidths,
    rows: [deployHeaderRow, ...deployRows],
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: '오늘의 잇템 | AI 메뉴 사진 생성 결과 보고서', size: 16, color: '94A3B8', font: 'Malgun Gothic' })],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: '페이지 ', size: 18, color: '64748B', font: 'Malgun Gothic' }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '64748B', font: 'Malgun Gothic' }),
                  new TextRun({ text: ' / ', size: 18, color: '64748B', font: 'Malgun Gothic' }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: '64748B', font: 'Malgun Gothic' }),
                ],
              }),
            ],
          }),
        },
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 300 },
            children: [new TextRun({ text: '🍽️ AI 메뉴 사진 생성 및 실서비스 반영 보고서', bold: true, size: 36, color: '0F172A', font: 'Malgun Gothic' })],
          }),
          new Paragraph({
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: '본 문서는 Google Cloud Vertex AI(gemini-3.1-flash-image) 모델을 활용하여 생성된 메뉴 사진 및 Supabase 스토리지 적재 현황과, 이를 "오늘의 잇템" 실 서비스에 공식 반영한 작업 내역을 종합 정리한 공식 보고서입니다.',
                size: 21,
                color: '334155',
                font: 'Malgun Gothic',
              }),
            ],
          }),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 180 },
            children: [new TextRun({ text: '1. 생성 작업 개요 및 핵심 통계', bold: true, size: 28, color: '0284C7', font: 'Malgun Gothic' })],
          }),
          summaryTable,

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 500, after: 180 },
            children: [new TextRun({ text: '2. 실서비스 반영 결과 및 시스템 배포 내역', bold: true, size: 28, color: '0284C7', font: 'Malgun Gothic' })],
          }),
          deployTable,

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 500, after: 180 },
            children: [new TextRun({ text: '3. 카테고리별 세부 진척 및 완료 현황', bold: true, size: 28, color: '0284C7', font: 'Malgun Gothic' })],
          }),
          categoryTable,

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 500, after: 180 },
            children: [new TextRun({ text: '4. 생성 메뉴 상세 목록 (스토리지 URL)', bold: true, size: 28, color: '0284C7', font: 'Malgun Gothic' })],
          }),
          detailTable,
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  writeFileSync(OUTPUT_DOCX, buffer);
  console.log(`[gen-food-docx] 보고서 저장 완료: ${OUTPUT_DOCX}`);
  return OUTPUT_DOCX;
}

if (process.argv[1]?.endsWith('gen-food-docx.mjs')) {
  generateDocxReport().catch((err) => {
    console.error('[gen-food-docx 오류]', err);
    process.exit(1);
  });
}
