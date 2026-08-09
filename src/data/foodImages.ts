/**
 * 수동 등록 이미지 URL (선택 사항)
 *
 * 기본적으로 모든 메뉴는 foodKeywords.ts 의 키워드로
 * Unsplash Source API 에서 자동 조회됩니다.
 *
 * 자동 조회 결과가 부적절한 메뉴만 여기에 등록하면
 * 해당 URL 이 우선 적용됩니다.
 *
 * 등록 방법:
 *   1. Unsplash / Pexels / Pixabay 에서 사진 검색
 *   2. 이미지 우클릭 → 이미지 주소 복사
 *   3. 아래에 추가 (메뉴명은 foods.ts 와 정확히 일치)
 *
 * 예시:
 *   "김치찌개": { url: "https://images.unsplash.com/photo-xxx?w=800&q=80", credit: "작가명" },
 *
 * Unsplash 이미지는 라이선스상 작가 크레딧 표기가 필요합니다.
 */
export interface FoodImage {
  url: string;
  credit?: string;
}

export const FOOD_IMAGES: Record<string, FoodImage> = {};
