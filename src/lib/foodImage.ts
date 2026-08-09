import { FOOD_IMAGES } from "@/data/foodImages";
import { FOOD_KEYWORDS, DEFAULT_KEYWORD } from "@/data/foodKeywords";

/**
 * 메뉴명으로 이미지 URL 을 결정합니다.
 * 수동 등록 URL 이 있으면 우선 사용하고,
 * 없으면 Unsplash Source API 주소를 생성합니다.
 */
export function getFoodImageUrl(name: string, w = 400, h = 300): string {
  const manual = FOOD_IMAGES[name]?.url;
  if (manual && manual.trim() !== "") return manual;

  const kw = FOOD_KEYWORDS[name] ?? DEFAULT_KEYWORD;
  // sig 파라미터로 메뉴마다 다른 사진이 오도록 고정 시드를 부여합니다
  const sig = encodeURIComponent(name);
  return `https://source.unsplash.com/${w}x${h}/?${kw.keywords}&sig=${sig}`;
}

/** 메뉴명에 해당하는 폴백 이모지 */
export function getFoodEmoji(name: string): string {
  return (FOOD_KEYWORDS[name] ?? DEFAULT_KEYWORD).emoji;
}

/** 수동 등록된 크레딧 (Unsplash Source 사용 시에는 없음) */
export function getFoodCredit(name: string): string | undefined {
  return FOOD_IMAGES[name]?.credit;
}
