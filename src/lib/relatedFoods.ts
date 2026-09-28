import { Food } from "@/types/food";
import { FOODS } from "@/data/foods";
import { DietSettings, loadDietSettings, applyDietFilter } from "./dietFilter";

export interface RelatedFoodItem {
  food: Food;
  diffScore: number;
  isSameKind: boolean;
  matchReasons: string[];
}

/**
 * 두 메뉴 간의 6축 점수(허기/기력/자극/위로/여유/온기) 차이의 절대값 합을 계산합니다.
 * 값이 작을수록 6축 유사도가 높습니다.
 */
export function calculateAxisDiff(a: Food, b: Food): number {
  return (
    Math.abs(a.fill - b.fill) +       // 허기 (배부름 정도)
    Math.abs(a.light - b.light) +     // 기력 (가벼움/소화 편의)
    Math.abs(a.spice - b.spice) +     // 자극 (매운맛)
    Math.abs(a.comfort - b.comfort) + // 위로 (포근함/익숙함)
    Math.abs(a.ease - b.ease) +       // 여유 (조리·취식 간편성)
    Math.abs(a.warm - b.warm)         // 온기 (온도감)
  );
}

/**
 * 메뉴와 대상 메뉴 간의 특징 공통점 태그를 추출합니다.
 */
export function getRelationTags(food: Food, target: Food): string[] {
  const tags: string[] = [];

  if (food.kind === target.kind) {
    tags.push(`같은 ${food.kind}`);
  }

  if (food.spice >= 3 && target.spice >= 3) {
    tags.push("얼큰한 맛");
  } else if (food.spice <= 1 && target.spice <= 1) {
    tags.push("담백한 맛");
  }

  if (food.warm >= 4 && target.warm >= 4) {
    tags.push("뜨끈한 국물");
  } else if (food.warm <= 1 && target.warm <= 1) {
    tags.push("시원한 느낌");
  }

  if (food.light >= 3 && target.light >= 3) {
    tags.push("속 편함");
  }

  if (food.fill >= 4 && target.fill >= 4) {
    tags.push("든든한 한 끼");
  }

  if (food.ease >= 4 && target.ease >= 4) {
    tags.push("빠른 조리");
  }

  return tags.slice(0, 2);
}

/**
 * 관련 음식 선정 기준 (우선순위 순):
 * 1) 같은 카테고리 (target.kind === f.kind)
 * 2) 6축 점수 차이 합이 가까운 순
 * 8~12개 (기본 10개) 노출
 */
export function getRelatedFoods(
  target: Food,
  options?: {
    limit?: number;
    dietSettings?: DietSettings;
  }
): RelatedFoodItem[] {
  const limit = options?.limit ?? 10;
  const settings = options?.dietSettings ?? loadDietSettings();

  // 자기 자신 제외
  const basePool = FOODS.filter((f) => f.id !== target.id && f.name !== target.name);

  // 알레르기·식이 필터 적용
  const filtered = applyDietFilter(basePool, settings);
  // 제외 조건으로 개수가 부족하면 있는 만큼만 제공 (요구사항 2-5 준용)
  const pool = filtered.length >= 8 ? filtered : basePool;

  const scoredList: RelatedFoodItem[] = pool.map((f) => {
    const isSameKind = f.kind === target.kind;
    const diffScore = calculateAxisDiff(f, target);
    const matchReasons = getRelationTags(f, target);
    return {
      food: f,
      diffScore,
      isSameKind,
      matchReasons,
    };
  });

  // 정렬 기준:
  // 1순위: 같은 카테고리 (isSameKind: true가 우선)
  // 2순위: 6축 점수 차이 합 오름차순 (작을수록 유사)
  // 3순위: id 안정 정렬
  scoredList.sort((a, b) => {
    const aSame = a.isSameKind ? 0 : 1;
    const bSame = b.isSameKind ? 0 : 1;
    if (aSame !== bSame) return aSame - bSame;

    if (a.diffScore !== b.diffScore) {
      return a.diffScore - b.diffScore;
    }

    return a.food.id - b.food.id;
  });

  return scoredList.slice(0, limit);
}
