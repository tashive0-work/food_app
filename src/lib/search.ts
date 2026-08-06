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

export function searchFoods(query: string): Food[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const isChosungQuery = /^[ㄱ-ㅎ]+$/.test(q);

  return FOODS.filter((f) => {
    const name = f.name.toLowerCase();
    if (name.includes(q)) return true;
    if (f.kind.toLowerCase().includes(q)) return true;
    if (f.themes.some((t) => t.includes(q))) return true;
    if (isChosungQuery && getChosung(f.name).includes(q)) return true;
    return false;
  }).slice(0, 30);
}
