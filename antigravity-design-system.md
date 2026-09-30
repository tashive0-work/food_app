# 작업 지시 [1/3]: 디자인 시스템 전면 교체

Next.js 14 (App Router) + TypeScript 프로젝트입니다.

이 작업은 **UI 전면 리뉴얼 3단계 중 1단계**입니다. 이번에는 **`src/app/globals.css` 한 파일만** 수정합니다. 컴포넌트 구조 변경은 2·3단계에서 진행하므로 **`.tsx` 파일은 일체 수정하지 마세요.**

---

## 배경

현재 디자인의 문제점:
- Primary 컬러(빨강)가 헤더·탭을 덮어 화면의 40%를 차지 → 강조색이 배경색이 되어 촌스러움
- 카드 간격 8px, 패딩 14px로 여백이 부족
- `border-radius: 2px`가 어정쩡 (각지지도 부드럽지도 않음)
- 그림자가 없어 깊이감 부재
- 버튼이 작아(높이 약 34px) 터치 타깃으로 부적절

**새 방향:** 뉴트럴 베이스 + 딥그린 Primary + 주황 Accent.
초록은 시스템·진단·신뢰를 담당하고, 주황은 음식·추천 강조를 담당하는 역할 분담 구조입니다.

---

## 수정 방법

**`src/app/globals.css` 파일의 전체 내용을 아래로 교체**해 주세요.

**단, 파일 최상단의 `@font-face` 선언 블록(7개)은 그대로 유지**해야 합니다. Pretendard 폰트 선언이 사라지면 폰트가 다시 깨집니다. `@font-face` 블록 **아래의 모든 내용**을 교체하는 것입니다.

```css
/* ========================================
   오늘 뭐 먹지 — Design System v2
   Base: Neutral / Primary: Deep Green / Accent: Orange
   ======================================== */

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  background-color: #FFFFFF;
}

.app{
  /* ---- Color ---- */
  --base:#FFFFFF;
  --surface:#F7F9F8;
  --border:#E4EAE6;
  --ink:#16211C;
  --dim:#7C8A83;
  --primary:#1F6F4A;
  --primaryDeep:#175539;
  --primaryBg:#EFF7F2;
  --accent:#E8873A;
  --accentBg:#FDF1E7;
  --danger:#C4443A;

  /* ---- Elevation ---- */
  --sh1:0 1px 3px rgba(22,33,28,.06);
  --sh2:0 1px 3px rgba(22,33,28,.06), 0 8px 24px -12px rgba(22,33,28,.14);
  --sh3:0 2px 6px rgba(22,33,28,.08), 0 16px 40px -16px rgba(22,33,28,.2);

  /* ---- Radius ---- */
  --r-sm:8px;
  --r-md:12px;
  --r-lg:16px;
  --r-xl:20px;

  font-family: var(--font-pretendard), 'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', -apple-system, sans-serif;
  background:var(--base); color:var(--ink); min-height:100%;
  -webkit-font-smoothing:antialiased;
  -moz-osx-font-smoothing:grayscale;
}
.app *{box-sizing:border-box;}
.app button:focus-visible,.app a:focus-visible{
  outline:2.5px solid var(--primary);outline-offset:2px;
}

/* ========== 헤더 ========== */
.hero{
  background:var(--base);
  color:var(--ink);
  padding:24px 20px 20px;
  border-bottom:1px solid var(--border);
}
.heroInner{max-width:720px;margin:0 auto;}
.eyebrow{
  font-size:11px;font-weight:500;letter-spacing:.08em;
  color:var(--dim);margin:0 0 6px;text-transform:none;
}
.hero h1{
  font-size:clamp(26px,7vw,32px);font-weight:800;line-height:1.15;
  margin:0;letter-spacing:-.02em;color:var(--ink);
}
.hero .sub{
  margin:10px 0 0;font-size:14px;line-height:1.6;
  color:var(--dim);max-width:34ch;
}

/* ========== 탭 ========== */
.tabsBg{
  background:var(--base);position:sticky;top:0;z-index:20;
  border-bottom:1px solid var(--border);
}
.tabs{display:flex;gap:0;max-width:720px;margin:0 auto;}
.tab{
  flex:1;padding:15px 8px;border:0;background:transparent;
  color:var(--dim);font-family:inherit;font-size:14px;font-weight:600;
  cursor:pointer;border-bottom:2.5px solid transparent;
  transition:color .15s,border-color .15s;
}
.tab:hover{color:var(--ink);}
.tab.on{color:var(--primary);border-bottom-color:var(--primary);}

.wrap{
  padding:24px 20px max(48px, env(safe-area-inset-bottom, 32px));
  max-width:720px;margin:0 auto;
}

/* ========== 진단 진행률 ========== */
.progress{display:flex;align-items:center;gap:12px;margin-bottom:32px;}
.progress span{
  font-size:12px;font-weight:600;color:var(--dim);
  font-variant-numeric:tabular-nums;
}
.track{flex:1;height:4px;background:var(--border);border-radius:99px;overflow:hidden;}
.fill{height:100%;background:var(--primary);border-radius:99px;transition:width .4s cubic-bezier(.4,0,.2,1);}

/* ========== 진단 문항 ========== */
.qtext{
  font-size:clamp(21px,5.5vw,24px);font-weight:700;line-height:1.4;
  margin:0 0 24px;letter-spacing:-.02em;
}
.opts{display:flex;flex-direction:column;gap:10px;}
.opt{
  text-align:left;padding:18px 20px;
  border:1.5px solid var(--border);background:var(--base);
  border-radius:var(--r-md);
  font-family:inherit;font-size:15px;font-weight:500;
  color:var(--ink);cursor:pointer;
  transition:border-color .15s,background .15s,transform .15s,box-shadow .15s;
}
.opt:hover{
  border-color:var(--primary);background:var(--primaryBg);
  transform:translateY(-1px);box-shadow:var(--sh1);
}
.opt:active{transform:translateY(0);}
.back{
  margin-top:20px;background:none;border:0;color:var(--dim);
  font-size:13.5px;cursor:pointer;font-family:inherit;padding:6px 0;
  text-decoration:underline;text-underline-offset:3px;
}
.back:hover{color:var(--ink);}

/* ========== 상태 요약 (구 영수증) ========== */
.receipt{
  background:var(--base);
  border:1px solid var(--border);
  border-radius:var(--r-lg);
  box-shadow:var(--sh2);
  padding:24px 22px;
  position:relative;
  animation:slideUp .45s cubic-bezier(.2,.7,.3,1) both;
}
@keyframes slideUp{
  from{opacity:0;transform:translateY(12px);}
  to{opacity:1;transform:none;}
}
.rTop{text-align:center;margin-bottom:20px;}
.rShop{
  font-size:13px;font-weight:700;letter-spacing:.02em;
  margin:0 0 6px;color:var(--primary);
}
.rMeta{
  margin:2px 0;font-size:11.5px;color:var(--dim);
  font-variant-numeric:tabular-nums;
}
.rRule{border-top:1px solid var(--border);margin:16px 0;}
.rline{
  display:flex;align-items:center;gap:12px;
  font-size:13.5px;padding:5px 0;
}
.rlabel{width:34px;flex:none;color:var(--dim);font-weight:600;font-size:12.5px;}
.rbar{flex:1;letter-spacing:.3em;color:var(--primary);font-size:11px;}
.rval{color:var(--dim);font-size:11.5px;font-variant-numeric:tabular-nums;}
.rval2{color:var(--ink);font-weight:600;font-size:13.5px;}
.rTotalLabel{
  margin:0;font-size:10.5px;letter-spacing:.12em;
  color:var(--dim);font-weight:600;
}
.rTotal{
  font-size:clamp(20px,5.5vw,26px);font-weight:800;line-height:1.3;
  margin:8px 0 10px;letter-spacing:-.02em;
}
.rNote{
  margin:0;font-size:13.5px;line-height:1.7;color:var(--dim);
}
.rTear{display:none;}

/* ========== 차트 ========== */
.chartBox{margin-top:32px;}
.chart{
  background:var(--base);border:1px solid var(--border);
  border-radius:var(--r-lg);box-shadow:var(--sh1);
  padding:12px 8px 8px;
}

/* ========== 섹션 ========== */
.secHead{margin:40px 0 16px;}
.secTitle{
  font-size:20px;font-weight:700;margin:0;letter-spacing:-.02em;
}
.secSub{margin:6px 0 0;font-size:13.5px;color:var(--dim);line-height:1.6;}

/* ========== 카드 ========== */
.grid{display:flex;flex-direction:column;gap:12px;}
.card{
  background:var(--base);
  border:1px solid var(--border);
  border-radius:var(--r-lg);
  box-shadow:var(--sh1);
  padding:18px 20px;
  display:flex;align-items:center;justify-content:space-between;
  gap:14px;flex-wrap:wrap;
  transition:box-shadow .18s,transform .18s;
}
.card:hover{box-shadow:var(--sh2);transform:translateY(-1px);}
.cardTop{display:flex;align-items:center;gap:14px;min-width:0;}
.rank{
  font-size:12px;font-weight:700;color:var(--dim);
  width:22px;flex:none;text-align:right;
  font-variant-numeric:tabular-nums;
}
.cardName h3{
  margin:0;font-size:16.5px;font-weight:600;letter-spacing:-.01em;
}
.kind{
  margin:4px 0 0;font-size:12px;color:var(--dim);font-weight:500;
}
.cardBtns{display:flex;gap:8px;flex:none;}

/* ========== 버튼 ========== */
.btn{
  display:inline-flex;align-items:center;justify-content:center;
  min-height:42px;padding:10px 18px;
  border-radius:var(--r-md);
  font-size:13.5px;font-weight:600;
  text-decoration:none;white-space:nowrap;
  transition:background .15s,border-color .15s,opacity .15s;
  font-family:inherit;cursor:pointer;
}
.btnMain{background:var(--primary);color:#fff;border:0;}
.btnMain:hover{background:var(--primaryDeep);}
.btnSub{
  background:var(--base);color:var(--ink);
  border:1.5px solid var(--border);
}
.btnSub:hover{border-color:var(--ink);}

.more{
  width:100%;margin-top:16px;padding:16px;
  background:var(--surface);color:var(--ink);
  border:1.5px solid var(--border);border-radius:var(--r-md);
  font-family:inherit;font-size:14.5px;font-weight:600;cursor:pointer;
  transition:background .15s,border-color .15s;
}
.more:hover{background:var(--primaryBg);border-color:var(--primary);color:var(--primary);}
.moreCount{font-size:12.5px;opacity:.6;font-variant-numeric:tabular-nums;}
.endNote{text-align:center;margin:20px 0 0;font-size:13px;color:var(--dim);}
.restart{
  width:100%;margin-top:10px;padding:15px;
  background:transparent;border:1.5px solid var(--border);
  border-radius:var(--r-md);color:var(--dim);
  font-family:inherit;font-size:14px;cursor:pointer;
  transition:border-color .15s,color .15s;
}
.restart:hover{border-color:var(--ink);color:var(--ink);}

/* ========== 테마 칩 ========== */
.chips{display:flex;flex-wrap:wrap;gap:8px;}
.chip{
  padding:10px 16px;border:1.5px solid var(--border);
  background:var(--base);border-radius:99px;
  font-family:inherit;font-size:13.5px;font-weight:500;
  color:var(--ink);cursor:pointer;
  transition:background .15s,border-color .15s,color .15s;
}
.chip:hover{border-color:var(--primary);color:var(--primary);}
.chip.on{background:var(--primary);border-color:var(--primary);color:#fff;}

/* ========== AI 재추천 ========== */
.aiRecommendBox{
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:var(--r-lg);
  padding:20px;
}

/* ========== 푸터 ========== */
.foot{
  margin-top:56px;
  padding:28px 20px max(40px, env(safe-area-inset-bottom, 24px));
  border-top:1px solid var(--border);text-align:center;
  background:var(--surface);
}
.foot p{margin:0 0 6px;font-size:12px;color:var(--dim);line-height:1.7;}
.footDim{opacity:.75;}
.footLinks{display:flex;justify-content:center;gap:16px;margin:0 0 14px;flex-wrap:wrap;}
.footLinks a{
  font-size:12.5px;color:var(--dim);text-decoration:none;font-weight:500;
  border-bottom:1px solid transparent;
}
.footLinks a:hover{color:var(--primary);border-bottom-color:var(--primary);}

/* ========== 법적 고지 페이지 ========== */
.legalWrap{
  max-width:720px;margin:0 auto;
  padding:28px 20px max(60px, env(safe-area-inset-bottom, 40px));
}
.legalBack{
  display:inline-block;margin-bottom:24px;
  font-size:13.5px;color:var(--dim);text-decoration:none;font-weight:500;
}
.legalBack:hover{color:var(--primary);}
.legalTitle{font-size:clamp(24px,6vw,30px);font-weight:800;margin:0 0 8px;letter-spacing:-.02em;}
.legalMeta{
  font-size:12px;color:var(--dim);margin:0 0 32px;
  padding-bottom:20px;border-bottom:1px solid var(--border);
}
.legalSec{margin:0 0 32px;}
.legalSec h2{font-size:16.5px;font-weight:700;margin:0 0 12px;letter-spacing:-.01em;}
.legalSec h3{font-size:14.5px;font-weight:600;margin:20px 0 8px;}
.legalSec p{margin:0 0 12px;font-size:14px;line-height:1.75;color:var(--dim);}
.legalSec ul,.legalSec ol{margin:0 0 12px;padding-left:20px;}
.legalSec li{font-size:14px;line-height:1.75;color:var(--dim);margin-bottom:6px;}
.legalSec strong{color:var(--ink);font-weight:600;}
.legalTable{width:100%;border-collapse:collapse;margin:0 0 16px;font-size:13px;}
.legalTable th,.legalTable td{
  border:1px solid var(--border);padding:10px 12px;text-align:left;line-height:1.6;
}
.legalTable th{background:var(--surface);font-weight:600;color:var(--ink);}
.legalTable td{color:var(--dim);}
.legalNotice{
  background:var(--primaryBg);border:1px solid var(--border);
  border-left:3px solid var(--primary);
  padding:14px 16px;margin:0 0 16px;border-radius:var(--r-sm);
}
.legalNotice p{margin:0;font-size:13.5px;line-height:1.7;color:var(--ink);}

/* ========== 반응형 ========== */
@media (min-width:768px){
  .hero{padding:40px 20px 32px;}
  .heroInner{max-width:900px;text-align:center;}
  .hero .sub{max-width:none;margin-left:auto;margin-right:auto;}
  .wrap{max-width:900px;padding:32px 24px 64px;}
  .tabs{max-width:900px;}
  .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;align-items:stretch;}
  .card{flex-direction:column;align-items:flex-start;gap:16px;}
  .cardTop{width:100%;}
  .card > div:last-child{width:100%;justify-content:space-between;}
  .receipt{max-width:560px;margin:0 auto;}
  .quiz{max-width:640px;margin:0 auto;}
}

@media (min-width:1200px){
  .grid{grid-template-columns:repeat(3,1fr);}
  .wrap{max-width:1120px;}
  .tabs{max-width:1120px;}
  .heroInner{max-width:1120px;}
}

@media (max-width:400px){
  .card{align-items:flex-start;}
  .cardBtns{width:100%;}
  .btn{flex:1;}
}

@media (prefers-reduced-motion:reduce){
  .app *{animation:none !important;transition:none !important;}
}
```

---

## 주의사항

1. **`@font-face` 블록은 절대 삭제하지 마세요.** 파일 최상단의 Pretendard 선언 7개는 그대로 두고 그 아래만 교체합니다.

2. **폰트 변수명 확인 필요.** 위 CSS는 `var(--font-pretendard)`를 사용합니다. 현재 프로젝트에서 Pretendard를 어떤 변수명으로 선언했는지 확인하고, 다르면 **실제 변수명에 맞춰 수정**하세요. (예: `--font-blackhan`을 재활용했다면 그 이름을 쓸 것)

3. **`.tsx` 파일은 이번 단계에서 수정하지 않습니다.** 클래스명을 모두 그대로 유지했으므로 CSS만 교체해도 정상 동작해야 합니다.

4. `layout.tsx`의 `viewport.themeColor`가 `#C7302A`로 되어 있다면 **`#1F6F4A`로 변경**해 주세요. 이것만 예외적으로 tsx 수정을 허용합니다.

---

## 검증

```bash
npx tsc --noEmit
npm run build
npm run dev
```

브라우저에서 확인할 항목:

1. 헤더가 흰 배경이고 로고가 검정 텍스트인가
2. 탭 선택 시 초록 밑줄이 표시되는가
3. 진단 선택지가 호버 시 연한 초록 배경으로 바뀌는가
4. 결과 화면 카드에 그림자와 둥근 모서리(16px)가 적용되었는가
5. 버튼 높이가 42px 이상으로 커졌는가
6. 폰트가 여전히 정상 표시되는가 (**깨지면 즉시 보고**)

**주의:** 이 작업의 성공 여부는 빌드 로그로 판단할 수 없습니다. 반드시 실제 브라우저 렌더링을 확인하거나, 확인이 불가능하면 사용자에게 요청하세요.

---

## 완료 후 보고

1. `@font-face` 블록 보존 여부
2. 실제 사용한 폰트 CSS 변수명
3. 빌드 결과
4. 육안 확인 필요 항목 안내
