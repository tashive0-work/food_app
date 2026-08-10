import { FOOD_IMAGES } from "@/data/foodImages";
import { FOOD_KEYWORDS, DEFAULT_KEYWORD } from "@/data/foodKeywords";

/**
 * 메뉴명으로 이미지 URL 을 결정합니다.
 * 수동 등록 URL 이 있으면 사용하고, 없으면 빈 문자열을 반환합니다.
 */
export function getFoodImageUrl(name: string): string {
  const manual = FOOD_IMAGES[name]?.url;
  if (manual && manual.trim() !== "") return manual;
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
