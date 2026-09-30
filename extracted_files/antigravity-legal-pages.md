# 작업 지시: 이용약관 · 개인정보 처리방침 페이지 추가

Next.js 14 (App Router) + TypeScript 프로젝트입니다.

법적 고지 문서 2종을 서비스에 실제로 노출시키는 작업입니다. 문서 본문은 별도로 제공되므로, **여기서는 페이지 구조와 링크 연결만 구현**합니다.

---

## 1. 페이지 파일 생성

아래 두 파일을 생성해 주세요.

### `src/app/privacy/page.tsx`

```tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "개인정보 처리방침 - 오늘 뭐 먹지",
  description: "오늘 뭐 먹지 서비스의 개인정보 처리방침입니다.",
};

export default function PrivacyPage() {
  return (
    <div className="app">
      <div className="legalWrap">
        <Link href="/" className="legalBack">
          ← 돌아가기
        </Link>
        <h1 className="legalTitle">개인정보 처리방침</h1>

        {/* 
          여기에 개인정보 처리방침 본문을 작성합니다.
          별도 제공되는 문서 내용을 <section>, <h2>, <p>, <ul> 등으로 마크업하세요.
          조문 구조: <section className="legalSec"> 안에 <h2> + 본문
        */}
      </div>
    </div>
  );
}
```

### `src/app/terms/page.tsx`

```tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "이용약관 - 오늘 뭐 먹지",
  description: "오늘 뭐 먹지 서비스의 이용약관입니다.",
};

export default function TermsPage() {
  return (
    <div className="app">
      <div className="legalWrap">
        <Link href="/" className="legalBack">
          ← 돌아가기
        </Link>
        <h1 className="legalTitle">이용약관</h1>

        {/* 여기에 이용약관 본문을 작성합니다. */}
      </div>
    </div>
  );
}
```

---

## 2. 스타일 추가

**파일:** `src/app/globals.css`

파일 하단 `@media` 블록들 **앞에** 아래를 추가해 주세요.

```css
/* 법적 고지 페이지 */
.legalWrap{
  max-width:720px;margin:0 auto;
  padding:28px 20px max(60px, env(safe-area-inset-bottom, 40px));
}
.legalBack{
  display:inline-block;margin-bottom:22px;
  font-size:13.5px;color:var(--dim);text-decoration:none;
  border-bottom:1px solid var(--line);padding-bottom:2px;
}
.legalBack:hover{color:var(--ink);border-bottom-color:var(--ink);}
.legalTitle{
  font-family:var(--font-blackhan), sans-serif;
  font-size:clamp(26px,7vw,34px);margin:0 0 8px;letter-spacing:-.01em;
}
.legalMeta{
  font-family:var(--font-nanum), monospace;
  font-size:12px;color:var(--dim);margin:0 0 32px;
  padding-bottom:20px;border-bottom:1.5px dashed #C9BEAC;
}
.legalSec{margin:0 0 30px;}
.legalSec h2{
  font-size:16.5px;font-weight:700;margin:0 0 12px;
  color:var(--ink);letter-spacing:-.01em;
}
.legalSec h3{
  font-size:14.5px;font-weight:600;margin:20px 0 8px;color:var(--ink);
}
.legalSec p{
  margin:0 0 12px;font-size:14px;line-height:1.75;color:#4A423A;
}
.legalSec ul,.legalSec ol{
  margin:0 0 12px;padding-left:20px;
}
.legalSec li{
  font-size:14px;line-height:1.75;color:#4A423A;margin-bottom:6px;
}
.legalSec strong{color:var(--ink);font-weight:700;}

/* 본문 내 표 */
.legalTable{
  width:100%;border-collapse:collapse;margin:0 0 16px;font-size:13px;
}
.legalTable th,.legalTable td{
  border:1.5px solid var(--line);padding:9px 11px;text-align:left;
  line-height:1.6;
}
.legalTable th{
  background:#FFFDF8;font-weight:700;color:var(--ink);
}
.legalTable td{color:#4A423A;}

/* 중요 고지 박스 */
.legalNotice{
  background:#FFFDF8;border:1.5px solid var(--line);
  border-left:3px solid var(--red);
  padding:14px 16px;margin:0 0 16px;border-radius:2px;
}
.legalNotice p{margin:0;font-size:13.5px;line-height:1.7;}

/* 푸터 링크 */
.footLinks{
  display:flex;justify-content:center;gap:14px;
  margin:0 0 12px;flex-wrap:wrap;
}
.footLinks a{
  font-size:12px;color:var(--dim);text-decoration:none;
  border-bottom:1px solid transparent;
}
.footLinks a:hover{color:var(--ink);border-bottom-color:var(--line);}
```

---

## 3. 푸터에 링크 연결

**파일:** `src/app/page.tsx`

상단 import에 추가:
```ts
import Link from "next/link";
```

파일 하단의 `<footer className="foot">` 블록을 아래로 교체:

```tsx
<footer className="foot">
  <div className="footLinks">
    <Link href="/terms">이용약관</Link>
    <Link href="/privacy">개인정보 처리방침</Link>
  </div>
  <p>레시피는 만개의레시피, 식당은 네이버 지도로 연결됩니다.</p>
  <p className="footDim">
    추천 로직은 규칙 기반 점수 모델입니다. 사용 기록이 쌓이면 개인화 학습으로 넘어갑니다.
  </p>
  <p className="footDim">
    추천 결과는 참고용 정보이며 의학적·영양학적 조언이 아닙니다.
  </p>
</footer>
```

**마지막 문단(면책 고지)은 반드시 포함해 주세요.** 건강 관련 오해를 방지하기 위한 필수 고지입니다.

---

## 4. 본문 마크업 규칙

문서 본문을 HTML로 옮길 때 아래 규칙을 지켜 주세요.

- 각 조(제1조, 제2조...)는 `<section className="legalSec">`으로 감쌀 것
- 조 제목은 `<h2>`, 항 제목은 `<h3>`
- 표는 `<table className="legalTable">` 사용
- **"추천 결과는 참고용"**, **"개인정보를 입력하지 마세요"** 등 강조가 필요한 문단은 `<div className="legalNotice">` 사용
- 시행일자는 제목 바로 아래 `<p className="legalMeta">` 에 배치
- 원문의 `[ ]` 표시 항목은 **그대로 두지 말고**, 사용자에게 실제 값을 확인한 후 채울 것. 확인이 어려우면 작업을 중단하고 사용자에게 물어볼 것

---

## 5. 검증

1. `npx tsc --noEmit` 통과
2. `npm run build` 통과
3. `npm run dev` 후 확인:
   - `/terms`, `/privacy` 접속 시 정상 렌더링
   - 메인 페이지 푸터에 두 링크가 보이고 클릭 시 이동
   - 각 페이지의 "돌아가기" 클릭 시 메인으로 복귀
   - 모바일 폭(375px)에서 표가 넘치지 않는지 확인

---

## 완료 후 보고

1. 생성한 파일 목록
2. 빌드 결과
3. **채우지 못한 `[ ]` 항목이 있다면 목록으로 보고할 것**
