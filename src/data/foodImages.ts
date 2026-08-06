/**
 * 음식별 이미지 URL 매핑
 *
 * 사용 방법:
 *   1. Unsplash / Pexels / Pixabay 에서 사진 검색
 *   2. 이미지 우클릭 → 이미지 주소 복사
 *   3. Unsplash 는 주소 끝에 ?w=800&q=80 을 붙이면 용량이 줄어듭니다
 *   4. 아래 해당 메뉴의 url 에 붙여넣기
 *
 * 주의:
 *   - 메뉴명은 foods.ts 와 정확히 일치해야 합니다
 *   - Unsplash 이미지는 라이선스상 작가 크레딧 표기가 필요합니다
 *   - url 이 빈 문자열이면 자동으로 텍스트 폴백이 표시됩니다
 *
 * 우선 채울 메뉴 (홈·추천 노출 빈도 상위 20개):
 *   샐러드, 그릭요거트볼, 제철 과일, 잔치국수, 전복죽, 계란찜,
 *   김밥, 참치김밥, 라면, 마라탕, 김치찌개, 김치볶음밥, 비빔밥,
 *   떡볶이, 제육볶음, 삼겹살, 치킨, 파스타, 우동, 돈까스
 */
export interface FoodImage {
  url: string;
  credit?: string;
}

export const FOOD_IMAGES: Record<string, FoodImage> = {
  // ─── 우선 채울 메뉴 (노출 빈도 상위) ───
  "샐러드": { url: "", credit: "" },
  "그릭요거트볼": { url: "", credit: "" },
  "제철 과일": { url: "", credit: "" },
  "잔치국수": { url: "", credit: "" },
  "전복죽": { url: "", credit: "" },
  "계란찜": { url: "", credit: "" },
  "김밥": { url: "", credit: "" },
  "참치김밥": { url: "", credit: "" },
  "라면": { url: "", credit: "" },
  "마라탕": { url: "", credit: "" },
  "김치찌개": { url: "", credit: "" },
  "김치볶음밥": { url: "", credit: "" },
  "비빔밥": { url: "", credit: "" },
  "떡볶이": { url: "", credit: "" },
  "제육볶음": { url: "", credit: "" },
  "삼겹살": { url: "", credit: "" },
  "치킨": { url: "", credit: "" },
  "토마토 파스타": { url: "", credit: "" },
  "크림 파스타": { url: "", credit: "" },
  "우동": { url: "", credit: "" },
  "돈까스": { url: "", credit: "" },

  // ─── 한식 ───
  "된장찌개": { url: "", credit: "" },
  "부대찌개": { url: "", credit: "" },
  "순두부찌개": { url: "", credit: "" },
  "육개장": { url: "", credit: "" },
  "삼계탕": { url: "", credit: "" },
  "설렁탕": { url: "", credit: "" },
  "갈비탕": { url: "", credit: "" },
  "뼈해장국": { url: "", credit: "" },
  "콩나물국밥": { url: "", credit: "" },
  "불고기": { url: "", credit: "" },
  "곱창": { url: "", credit: "" },
  "족발": { url: "", credit: "" },
  "보쌈": { url: "", credit: "" },
  "닭갈비": { url: "", credit: "" },
  "찜닭": { url: "", credit: "" },
  "아구찜": { url: "", credit: "" },
  "낙지볶음": { url: "", credit: "" },
  "칼국수": { url: "", credit: "" },
  "수제비": { url: "", credit: "" },
  "비빔국수": { url: "", credit: "" },
  "냉면": { url: "", credit: "" },
  "콩국수": { url: "", credit: "" },
  "두부김치": { url: "", credit: "" },
  "골뱅이소면": { url: "", credit: "" },
  "어묵탕": { url: "", credit: "" },
  "해물파전": { url: "", credit: "" },
  "김치전": { url: "", credit: "" },

  // ─── 분식 ───
  "로제떡볶이": { url: "", credit: "" },
  "순대": { url: "", credit: "" },
  "짜파구리": { url: "", credit: "" },
  "만두": { url: "", credit: "" },
  "토스트": { url: "", credit: "" },

  // ─── 중식 ───
  "짜장면": { url: "", credit: "" },
  "짬뽕": { url: "", credit: "" },
  "탕수육": { url: "", credit: "" },
  "마라샹궈": { url: "", credit: "" },
  "양꼬치": { url: "", credit: "" },

  // ─── 일식 ───
  "초밥": { url: "", credit: "" },
  "회": { url: "", credit: "" },
  "연어덮밥": { url: "", credit: "" },
  "규동": { url: "", credit: "" },
  "메밀소바": { url: "", credit: "" },
  "라멘": { url: "", credit: "" },
  "오므라이스": { url: "", credit: "" },

  // ─── 야식 / 양식 ───
  "양념치킨": { url: "", credit: "" },
  "피자": { url: "", credit: "" },
  "햄버거": { url: "", credit: "" },
  "알리오올리오": { url: "", credit: "" },
  "리조또": { url: "", credit: "" },
  "스테이크": { url: "", credit: "" },
  "감바스": { url: "", credit: "" },
  "샌드위치": { url: "", credit: "" },
  "포케": { url: "", credit: "" },
  "부리토": { url: "", credit: "" },
  "타코": { url: "", credit: "" },
  "팬케이크": { url: "", credit: "" },

  // ─── 아시안 / 간편 ───
  "쌀국수": { url: "", credit: "" },
  "팟타이": { url: "", credit: "" },
  "카레라이스": { url: "", credit: "" },
  "편의점 도시락": { url: "", credit: "" },
  "아이스크림": { url: "", credit: "" },
  "호떡": { url: "", credit: "" },
};
