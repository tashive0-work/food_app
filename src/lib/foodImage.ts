import { FOOD_IMAGES } from "@/data/foodImages";
import { FOOD_KEYWORDS, DEFAULT_KEYWORD } from "@/data/foodKeywords";
import { FOODS } from "@/data/foods";

let foodImageMap: Map<string, string> | null = null;

function getFoodImageMap(): Map<string, string> {
  if (!foodImageMap) {
    foodImageMap = new Map();
    for (const f of FOODS) {
      if (f.image) {
        foodImageMap.set(f.name, f.image);
      }
    }
  }
  return foodImageMap;
}

/**
 * 메뉴명으로 이미지 URL 을 결정합니다.
 * 1) 수동 등록 URL 이 있으면 사용
 * 2) Supabase DB (AI 생성 이미지 포함) 동기화된 이미지가 있으면 사용
 * 3) 없으면 빈 문자열을 반환합니다.
 */
export function getFoodImageUrl(name: string): string {
  const manual = FOOD_IMAGES[name]?.url;
  if (manual && manual.trim() !== "") return manual;

  const dbImage = getFoodImageMap().get(name);
  if (dbImage && dbImage.trim() !== "") return dbImage;

  return "";
}

/** 메뉴명에 해당하는 폴백 이모지 */
export function getFoodEmoji(name: string): string {
  return (FOOD_KEYWORDS[name] ?? DEFAULT_KEYWORD).emoji;
}

/** 수동 등록된 크레딧 (Unsplash Source 사용 시에는 없음) */
export function getFoodCredit(name: string): string | undefined {
  return FOOD_IMAGES[name]?.credit;
}
