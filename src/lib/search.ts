import { FOODS } from "@/data/foods";
import { Food } from "@/types/food";

/** 한글 초성 추출 (ㄱㅊㅉㄱ → 김치찌개 검색 지원) */
const CHO = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ",
             "ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];

function getChosung(str: string): string {
  return str.split("").map((ch) => {
    const code = ch.charCodeAt(0) - 0xac00;
    if (code < 0 || code > 11171) return ch;
    return CHO[Math.floor(code / 588)];
  }).join("");
}

/**
 * 메뉴 검색.
 *
 * 세부 메뉴(참치김치찌개 등)도 **독립된 카드**로 내보냅니다.
 * 그래야 레시피·근처 식당·배달 버튼이 그 메뉴 이름으로 동작합니다.
 * (추천 화면에서는 세부 메뉴를 카드로 쪼개지 않습니다. TOP5 가 김치찌개 종류로만
 *  채워지면 안 되기 때문입니다.)
 *
 * 순서: 이름 정확히 일치 → 앞부분 일치 → 이름에 포함 → 세부 메뉴 → 분류·테마.
 */
export function searchFoods(query: string): Food[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const isChosungQuery = /^[ㄱ-ㅎ]+$/.test(q);
  const hits: { food: Food; score: number }[] = [];
  const seen = new Set<string>();

  const push = (food: Food, score: number) => {
    if (seen.has(food.name)) return;
    seen.add(food.name);
    hits.push({ food, score });
  };

  /** 세부 메뉴를 부모 메뉴의 성격을 물려받은 하나의 메뉴로 만듭니다 */
  const asMenu = (parent: Food, variantName: string, index: number): Food => ({
    ...parent,
    // 찜하기·좋아요가 부모와 섞이지 않도록 별도 id 를 줍니다
    id: parent.id * 1000 + 900 + index,
    name: variantName,
    parentName: parent.name,
    variants: undefined,
    matchedVariants: undefined,
  });

  for (const f of FOODS) {
    const name = f.name.toLowerCase();
    const variants = f.variants || [];

    let score = -1;
    if (name === q) score = 0;
    else if (name.startsWith(q)) score = 1;
    else if (name.includes(q)) score = 2;
    else if (f.kind.toLowerCase().includes(q)) score = 4;
    else if (f.themes.some((t) => t.includes(q))) score = 5;
    else if (isChosungQuery && getChosung(f.name).includes(q)) score = 2;

    if (score >= 0) push(f, score);

    // 세부 메뉴 — 걸린 것만 독립 카드로
    variants.forEach((v, i) => {
      const lv = v.toLowerCase();
      let vs = -1;
      if (lv === q) vs = 0;
      else if (lv.startsWith(q)) vs = 1;
      else if (lv.includes(q)) vs = 3;
      else if (isChosungQuery && getChosung(v).includes(q)) vs = 3;
      // 부모 이름으로 찾았으면 그 세부 메뉴도 함께 보여 줍니다
      else if (score >= 0 && score <= 2) vs = 3;
      if (vs >= 0) push(asMenu(f, v, i), vs);
    });
  }

  hits.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    const pa = a.food.popularity ?? 1;
    const pb = b.food.popularity ?? 1;
    if (pa !== pb) return pb - pa;
    return a.food.name.length - b.food.name.length;
  });

  return hits.slice(0, 60).map((h) => h.food);
}
