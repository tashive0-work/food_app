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
 * 세부 메뉴(variants)까지 함께 찾습니다.
 *   · "참치김치찌개" → 김치찌개 카드가 나오고, 찾은 세부 메뉴를 표시합니다
 *   · "김치찌개"     → 김치찌개 카드 + 세부 메뉴 전부 표시
 *
 * 순서는 "얼마나 정확히 맞았는지" 로 매깁니다.
 * 이름이 정확히 같은 것 → 이름으로 시작 → 이름에 포함 → 세부 메뉴 → 분류·테마.
 */
export function searchFoods(query: string): Food[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const isChosungQuery = /^[ㄱ-ㅎ]+$/.test(q);

  const hits: { food: Food; score: number }[] = [];

  for (const f of FOODS) {
    const name = f.name.toLowerCase();
    const variants = f.variants || [];
    const matched = variants.filter((v) => v.toLowerCase().includes(q));

    let score = -1;
    if (name === q) score = 0;                       // 정확히 일치
    else if (name.startsWith(q)) score = 1;          // 앞부분 일치
    else if (name.includes(q)) score = 2;            // 이름에 포함
    else if (matched.length > 0) score = 3;          // 세부 메뉴에 포함
    else if (f.kind.toLowerCase().includes(q)) score = 4;
    else if (f.themes.some((t) => t.includes(q))) score = 5;
    else if (isChosungQuery) {
      if (getChosung(f.name).includes(q)) score = 2;
      else if (variants.some((v) => getChosung(v).includes(q))) score = 3;
    }
    if (score < 0) continue;

    // 이름으로 찾았으면 세부 메뉴를 전부 보여 주고,
    // 세부 메뉴로 찾았으면 걸린 것만 앞에 둡니다.
    const show = score <= 2
      ? variants
      : [...matched, ...variants.filter((v) => !matched.includes(v))];

    hits.push({
      food: { ...f, matchedVariants: show.slice(0, 6) },
      score,
    });
  }

  hits.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    // 같은 점수면 대중적인 것 먼저
    const pa = a.food.popularity ?? 1;
    const pb = b.food.popularity ?? 1;
    if (pa !== pb) return pb - pa;
    return a.food.name.length - b.food.name.length;
  });

  return hits.slice(0, 30).map((h) => h.food);
}
