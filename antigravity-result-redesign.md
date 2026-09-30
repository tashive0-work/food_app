# 작업 지시 [2/3]: 결과 화면 구조 재설계

Next.js 14 (App Router) + TypeScript 프로젝트입니다.

UI 전면 리뉴얼 3단계 중 **2단계**입니다. 1단계(디자인 시스템 CSS 교체)는 완료되었습니다. 이번에는 **컴포넌트 구조와 정보 위계**를 바꿉니다.

---

## 배경 — 왜 구조를 바꾸는가

현재 결과 화면은 추천 10개를 **모두 같은 크기, 같은 버튼 구성**으로 나열합니다. 1위와 10위가 시각적으로 동등하여 사용자는 여전히 "이 중에 뭘 먹지"를 고민해야 합니다.

이 앱의 존재 이유는 **결정을 대신해 주는 것**입니다. 8문항에 답한 대가가 30개 목록이면 고민이 해결되지 않고 형태만 바뀝니다.

**목표 구조:**
```
상태 요약 카드
      ↓
레이더 차트 (결과의 시각적 중심)
      ↓
[1위] 큰 카드 — 사진 + 매칭 근거 태그 + 액션
      ↓
[2·3위] 중간 카드 2개 나란히
      ↓
▼ 나머지 27개 보기 (접힘)
```

---

## 사전 확인 사항

작업 시작 전 아래를 확인해 주세요.

**추천 목록 중복 렌더링 여부**
사용자 제보에 따르면 결과 화면에서 동일 음식이 두 번씩 표시되는 현상이 관찰되었습니다 (마라탕 2위 2회, 떡볶이 4위 2회 등).

`src/app/page.tsx`의 `list.slice(0, shown).map(...)` 부분과 `src/lib/recommend.ts`의 `FOODS` 배열에 중복 항목이 있는지 확인하고, 중복이 실제로 존재하면 보고해 주세요. `key={f.id}`가 중복되면 React 렌더링 이상이 발생할 수 있습니다.

---

## 작업 1. 음식 이미지 지원 추가

### 1-1. 타입 확장

**파일:** `src/types/food.ts`

`Food` 인터페이스에 이미지 필드 추가:

```ts
export interface Food {
  id: number;
  name: string;
  kind: string;
  spice: number;
  fill: number;
  warm: number;
  ease: number;
  comfort: number;
  light: number;
  themes: string[];
  match?: number;
  image?: string;      // 이미지 URL (없으면 폴백 표시)
  imageCredit?: string; // 사진작가 크레딧 (Unsplash 라이선스 요구사항)
}
```

### 1-2. 이미지 데이터 파일 생성

**파일:** `src/data/foodImages.ts` (신규)

```ts
/**
 * 음식별 이미지 URL 매핑
 * 
 * 이미지 출처: Unsplash / Pexels / Pixabay (상업적 이용 가능)
 * Unsplash 이미지 사용 시 라이선스에 따라 작가 크레딧 표기가 필요합니다.
 * 
 * 미등록 음식은 자동으로 폴백(음식명 타이포) 처리됩니다.
 * 점진적으로 채워 나가면 됩니다.
 */
export const FOOD_IMAGES: Record<string, { url: string; credit?: string }> = {
  // 예시 — 실제 URL로 교체 필요
  // "김치찌개": { url: "https://images.unsplash.com/photo-xxxxx?w=800&q=80", credit: "작가명" },
};
```

### 1-3. recommend.ts에서 이미지 병합

**파일:** `src/lib/recommend.ts`

파일 상단에 import 추가:
```ts
import { FOOD_IMAGES } from "@/data/foodImages";
```

`recommend()` 함수의 `.map()` 안에서 반환 객체에 이미지 정보를 병합:
```ts
return {
  ...f,
  image: FOOD_IMAGES[f.name]?.url,
  imageCredit: FOOD_IMAGES[f.name]?.credit,
  match: Math.max(38, Math.min(99, Math.round(100 - p * 1.35))),
};
```

---

## 작업 2. 매칭 근거 태그 생성 함수

**파일:** `src/lib/recommend.ts` 하단에 추가

```ts
/**
 * 음식이 왜 추천되었는지를 설명하는 태그를 생성합니다.
 * 사용자 상태와 음식 속성이 잘 맞는 축을 최대 2개 선택합니다.
 */
export function matchTags(food: Food, s: AppState): string[] {
  const tags: { label: string; score: number }[] = [];

  // 조리/대기 시간이 짧음
  if (food.ease >= 3) tags.push({ label: "빨리 나와요", score: food.ease });
  // 매운맛이 상태와 일치
  if (food.spice >= 3 && s.spice >= 3) tags.push({ label: "얼큰해요", score: 5 });
  // 담백함이 상태와 일치
  if (food.spice <= 1 && s.spice <= 1) tags.push({ label: "담백해요", score: 5 });
  // 소화 부담이 적음
  if (food.light >= 3) tags.push({ label: "속이 편해요", score: food.light });
  // 든든함
  if (food.fill >= 4 && s.hunger >= 3) tags.push({ label: "든든해요", score: 5 });
  // 따뜻한 국물
  if (food.warm >= 4 && s.warm >= 3) tags.push({ label: "뜨끈해요", score: 5 });
  // 시원함
  if (food.warm <= 1 && s.warm <= 1) tags.push({ label: "시원해요", score: 5 });
  // 위로
  if (food.comfort >= 3 && s.comfort >= 3) tags.push({ label: "포근해요", score: 4 });

  return tags.sort((a, b) => b.score - a.score).slice(0, 2).map((t) => t.label);
}
```

`Food`, `AppState` 타입이 이미 import되어 있는지 확인하세요.

---

## 작업 3. HeroCard 컴포넌트 (1위 전용)

**파일:** `src/components/HeroCard.tsx` (신규)

```tsx
"use client";

import React from "react";
import { Food, AppState } from "@/types/food";
import { recipeUrl, mapUrl, matchTags } from "@/lib/recommend";
import { logInteraction } from "@/lib/supabase";

interface HeroCardProps {
  food: Food;
  state: AppState;
  isFavorite: boolean;
  onToggleFavorite: (id: number) => void;
  diagnosisId?: string | null;
}

export function HeroCard({
  food,
  state,
  isFavorite,
  onToggleFavorite,
  diagnosisId,
}: HeroCardProps) {
  const tags = matchTags(food, state);

  return (
    <article className="heroCard">
      {/* 이미지 영역 — 없으면 폴백 */}
      <div className="heroCardImg">
        {food.image ? (
          <img src={food.image} alt={food.name} loading="lazy" />
        ) : (
          <div className="heroCardImgFallback">
            <span>{food.name}</span>
          </div>
        )}
        <span className="heroCardBadge">오늘의 추천</span>
      </div>

      <div className="heroCardBody">
        <div className="heroCardHead">
          <div>
            <h3>{food.name}</h3>
            <p className="heroCardKind">
              {food.kind}
              {food.match != null && (
                <> · <strong>{food.match}%</strong> 일치</>
              )}
            </p>
          </div>
          <button
            className={isFavorite ? "favBtn on" : "favBtn"}
            onClick={() => {
              onToggleFavorite(food.id);
              logInteraction(
                diagnosisId || null,
                food.name,
                1,
                isFavorite ? "unfavorite" : "favorite"
              );
            }}
            aria-label={isFavorite ? "찜 해제" : "찜하기"}
          >
            {isFavorite ? "찜함" : "찜하기"}
          </button>
        </div>

        {tags.length > 0 && (
          <div className="tagRow">
            {tags.map((t) => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="heroCardBtns">
          <a
            className="btn btnMain"
            href={recipeUrl(food.name)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              logInteraction(diagnosisId || null, food.name, 1, "recipe_click")
            }
          >
            레시피 보기
          </a>
          <a
            className="btn btnSub"
            href={mapUrl(food.name)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              logInteraction(diagnosisId || null, food.name, 1, "map_click")
            }
          >
            근처 식당
          </a>
        </div>

        {food.imageCredit && (
          <p className="imgCredit">사진: {food.imageCredit} / Unsplash</p>
        )}
      </div>
    </article>
  );
}
```

---

## 작업 4. FoodCard에 태그 추가

**파일:** `src/components/FoodCard.tsx`

Props에 `state`를 추가하고, 태그를 표시하도록 수정합니다.

1. `import { matchTags } from "@/lib/recommend";` 추가 (기존 import 문에 병합)
2. `import { AppState } from "@/types/food";` 추가
3. Props 인터페이스에 `state?: AppState;` 추가
4. 컴포넌트 내부에서 `const tags = state ? matchTags(food, state) : [];`
5. `.kind` 문단 아래에 태그 렌더링 추가:

```tsx
{tags.length > 0 && (
  <div className="tagRow">
    {tags.map((t) => (
      <span key={t} className="tag">{t}</span>
    ))}
  </div>
)}
```

**주의:** `state`는 optional입니다. 테마 탭과 찜 탭에서는 상태값이 없으므로 태그 없이 렌더링되어야 합니다.

---

## 작업 5. page.tsx 결과 영역 재구성

**파일:** `src/app/page.tsx`

### 5-1. import 추가
```ts
import { HeroCard } from "@/components/HeroCard";
```

### 5-2. 상태 추가
기존 `const [shown, setShown] = useState(10);` 를 아래로 교체:
```ts
const [expanded, setExpanded] = useState(false);
```
`shown` 관련 로직(`setShown(10)` 등)은 모두 제거합니다.

### 5-3. 헤더 문구 수정
```tsx
<p className="sub">지금 상태를 여덟 번만 답해주세요. 나머지는 저희가 정할게요.</p>
```
(현재 "일곱 번만"으로 되어 있으나 문항이 8개이므로 수정)

### 5-4. 결과 렌더링 영역 교체

기존의 `<section>` 안 추천 목록 부분(`<div className="grid">` ~ `더 보기` 버튼)을 아래로 **전체 교체**:

```tsx
<section>
  <div className="secHead">
    <h2 className="secTitle">오늘은 이걸 추천해요</h2>
    <p className="secSub">지금 상태에 가장 잘 맞는 메뉴예요.</p>
  </div>

  {/* 1위 — 큰 카드 */}
  {list[0] && (
    <HeroCard
      food={list[0]}
      state={state}
      isFavorite={favorites.includes(list[0].id)}
      onToggleFavorite={toggleFavorite}
      diagnosisId={diagnosisId}
    />
  )}

  {/* 2·3위 — 중간 카드 */}
  {list.length > 1 && (
    <>
      <div className="secHead secHeadSm">
        <h3 className="secTitleSm">다른 선택지</h3>
      </div>
      <div className="subGrid">
        {list.slice(1, 3).map((f, i) => (
          <FoodCard
            key={f.id}
            food={f}
            rank={i + 2}
            state={state}
            isFavorite={favorites.includes(f.id)}
            onToggleFavorite={toggleFavorite}
            diagnosisId={diagnosisId}
          />
        ))}
      </div>
    </>
  )}

  {/* 나머지 — 접힘 */}
  {!expanded ? (
    <button className="more" onClick={() => setExpanded(true)}>
      나머지 {Math.max(0, list.length - 3)}개 더 보기
    </button>
  ) : (
    <>
      <div className="secHead secHeadSm">
        <h3 className="secTitleSm">전체 목록</h3>
      </div>
      <div className="grid">
        {list.slice(3).map((f, i) => (
          <FoodCard
            key={f.id}
            food={f}
            rank={i + 4}
            state={state}
            isFavorite={favorites.includes(f.id)}
            onToggleFavorite={toggleFavorite}
            diagnosisId={diagnosisId}
          />
        ))}
      </div>
      <button className="more" onClick={() => setExpanded(false)}>
        접기
      </button>
    </>
  )}

  <AiReRecommendInput currentScores={state} onApplyDelta={handleApplyAiDelta} />

  <button className="restart" onClick={restart}>
    다시 진단하기
  </button>
</section>
```

### 5-5. restart 함수 수정
`setShown(10);` 을 `setExpanded(false);` 로 교체

---

## 작업 6. 테마 탭 순위 제거

**파일:** `src/components/ThemeTab.tsx`

테마별 목록은 순위 개념이 없는데 `rank={i + 1}`로 번호가 붙어 "1위가 더 좋은 것"처럼 오인됩니다. 실제로는 데이터 배열 순서일 뿐입니다.

`rank={i + 1}` 을 `rank={0}` 으로 변경하고, `FoodCard`에서 `rank`가 0이면 순위를 렌더링하지 않도록 수정:

```tsx
{rank > 0 && <span className="rank">{rank}</span>}
```

또한 테마당 항목이 최대 27개까지 나와 스크롤이 과도하므로, `ThemeTab` 내부에서 `themeFoods.slice(0, 12)`로 제한하고 "더 보기" 버튼을 추가해 주세요. 상태는 `useState`로 관리합니다.

---

## 작업 7. CSS 추가

**파일:** `src/app/globals.css`

`/* ========== 반응형 ========== */` 블록 **앞**에 추가:

```css
/* ========== HeroCard (1위) ========== */
.heroCard{
  background:var(--base);
  border:1px solid var(--border);
  border-radius:var(--r-xl);
  box-shadow:var(--sh2);
  overflow:hidden;
  margin-bottom:32px;
}
.heroCardImg{
  position:relative;width:100%;aspect-ratio:4/3;max-height:240px;
  background:var(--surface);overflow:hidden;
}
.heroCardImg img{width:100%;height:100%;object-fit:cover;display:block;}
.heroCardImgFallback{
  width:100%;height:100%;display:flex;align-items:center;justify-content:center;
  background:linear-gradient(135deg,var(--primaryBg),var(--accentBg));
}
.heroCardImgFallback span{
  font-size:clamp(24px,7vw,34px);font-weight:800;
  color:var(--primary);letter-spacing:-.02em;
}
.heroCardBadge{
  position:absolute;top:14px;left:14px;
  background:var(--accent);color:#fff;
  font-size:11.5px;font-weight:700;letter-spacing:.02em;
  padding:6px 12px;border-radius:99px;
}
.heroCardBody{padding:20px;}
.heroCardHead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;}
.heroCardHead h3{margin:0;font-size:22px;font-weight:700;letter-spacing:-.02em;}
.heroCardKind{margin:5px 0 0;font-size:13px;color:var(--dim);font-weight:500;}
.heroCardKind strong{color:var(--accent);font-weight:700;}
.heroCardBtns{display:flex;gap:10px;margin-top:18px;}
.heroCardBtns .btn{flex:1;}
.imgCredit{margin:12px 0 0;font-size:10.5px;color:var(--dim);opacity:.65;}

/* ========== 찜 버튼 ========== */
.favBtn{
  flex:none;padding:8px 14px;border-radius:99px;
  border:1.5px solid var(--border);background:var(--base);
  font-family:inherit;font-size:12px;font-weight:600;
  color:var(--dim);cursor:pointer;
  transition:border-color .15s,color .15s,background .15s;
}
.favBtn:hover{border-color:var(--primary);color:var(--primary);}
.favBtn.on{background:var(--primaryBg);border-color:var(--primary);color:var(--primary);}

/* ========== 매칭 근거 태그 ========== */
.tagRow{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px;}
.tag{
  font-size:11.5px;font-weight:600;
  padding:5px 10px;border-radius:var(--r-sm);
  background:var(--accentBg);color:var(--accent);
}

/* ========== 2·3위 서브 그리드 ========== */
.subGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;}
.secHeadSm{margin:28px 0 12px;}
.secTitleSm{font-size:15px;font-weight:700;margin:0;color:var(--dim);letter-spacing:-.01em;}

@media (max-width:400px){
  .subGrid{grid-template-columns:1fr;}
}
```

`@media (min-width:768px)` 블록 안에 추가:
```css
  .heroCardImg{max-height:300px;}
  .heroCardBody{padding:24px;}
```

---

## 검증

```bash
npx tsc --noEmit
npm run build
npm run dev
```

브라우저 확인 항목:

1. 진단 완료 후 **1위가 큰 카드**로 표시되는가 (이미지 영역 + "오늘의 추천" 배지)
2. 이미지가 없으므로 **폴백(음식명 큰 글씨 + 그라데이션 배경)**이 보이는가
3. 매칭 근거 **태그가 최대 2개** 표시되는가 (예: "얼큰해요", "빨리 나와요")
4. **2·3위가 나란히** 표시되는가
5. "나머지 N개 더 보기" 클릭 시 펼쳐지고, "접기"로 다시 닫히는가
6. 테마 탭에서 **순위 번호가 사라졌는가**
7. 헤더 문구가 "여덟 번만"으로 바뀌었는가
8. 카드 중복 렌더링이 없는가

**주의:** 빌드 성공은 검증이 아닙니다. 실제 브라우저 렌더링을 확인하거나, 불가능하면 사용자에게 요청하세요.

---

## 완료 후 보고

1. 변경/생성 파일 목록
2. 중복 렌더링 원인 조사 결과
3. 빌드 결과
4. 육안 확인이 필요한 항목
