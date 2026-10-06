import { FOOD_IMAGES } from "@/data/foodImages";
import { FOOD_KEYWORDS, DEFAULT_KEYWORD } from "@/data/foodKeywords";
import { FOODS } from "@/data/foods";

let foodImageMap: Map<string, string> | null = null;
let foodImageThumbMap: Map<string, string> | null = null;

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

function getFoodImageThumbMap(): Map<string, string> {
  if (!foodImageThumbMap) {
    foodImageThumbMap = new Map();
    for (const f of FOODS) {
      if (f.imageThumb) {
        foodImageThumbMap.set(f.name, f.imageThumb);
      } else if (f.image) {
        foodImageThumbMap.set(f.name, f.image);
      }
    }
  }
  return foodImageThumbMap;
}

/**
 * 메뉴명으로 메인 이미지 URL(800px) 을 결정합니다.
 */
export function getFoodImageUrl(name: string): string {
  const manual = FOOD_IMAGES[name]?.url;
  if (manual && manual.trim() !== "") return manual;

  const dbImage = getFoodImageMap().get(name);
  if (dbImage && dbImage.trim() !== "") return dbImage;

  return "";
}

/**
 * 메뉴명으로 썸네일 이미지 URL(400px) 을 결정합니다.
 */
export function getFoodImageThumbUrl(name: string): string {
  const manual = FOOD_IMAGES[name]?.url;
  if (manual && manual.trim() !== "") return manual;

  const dbThumb = getFoodImageThumbMap().get(name);
  if (dbThumb && dbThumb.trim() !== "") return dbThumb;

  return getFoodImageUrl(name);
}

/** 메뉴명에 해당하는 폴백 이모지 */
export function getFoodEmoji(name: string): string {
  return (FOOD_KEYWORDS[name] ?? DEFAULT_KEYWORD).emoji;
}

/** 수동 등록된 크레딧 (Unsplash Source 사용 시에는 없음) */
export function getFoodCredit(name: string): string | undefined {
  return FOOD_IMAGES[name]?.credit;
}
