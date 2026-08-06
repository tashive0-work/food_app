/**
 * 알레르기 유발 물질별 제외 대상 메뉴 매핑
 *
 * 주의: 이 목록은 완전하지 않습니다.
 * 실제 조리 방식·브랜드에 따라 성분이 다를 수 있으므로,
 * UI 에 반드시 한계를 명시해야 합니다.
 */
export interface Allergen {
  key: string;
  label: string;
  /** 이 알레르기가 있을 때 제외할 메뉴명 (부분 일치) */
  excludeKeywords: string[];
}

export const ALLERGENS: Allergen[] = [
  { key: "seafood", label: "해산물", excludeKeywords: ["전복","해물","오징어","낙지","새우","조개","굴","아구","생선","회","초밥","参","알탕"] },
  { key: "dairy",   label: "유제품", excludeKeywords: ["요거트","치즈","크림","라떼","아이스크림","피자","그라탕","파스타","리조또"] },
  { key: "egg",     label: "계란",   excludeKeywords: ["계란","달걀","오므","마요"] },
  { key: "nuts",    label: "견과류", excludeKeywords: ["땅콩","아몬드","호두","캐슈","견과"] },
  { key: "pork",    label: "돼지고기", excludeKeywords: ["돼지","제육","삼겹","돈까스","족발","보쌈","순대","탕수육","김치찌개","부대찌개"] },
  { key: "beef",    label: "소고기", excludeKeywords: ["소고기","불고기","갈비","육개장","설렁탕","규동","스테이크"] },
  { key: "gluten",  label: "밀가루", excludeKeywords: ["국수","面","라면","우동","파스타","빵","토스트","샌드위치","피자","만두","칼국수","짜장","짬뽕","소바","튀김","부침개"] },
  { key: "spicy",   label: "매운 음식", excludeKeywords: [] }, // spice >= 3 으로 별도 처리
];

export const DIET_PREFS = [
  { key: "vegetarian", label: "채식 지향", excludeKeywords: ["고기","돼지","소고기","닭","제육","삼겹","치킨","족발","보쌈","순대","해물","생선","오징어","새우"] },
  { key: "lowSalt",    label: "저염 선호", excludeKeywords: ["젓갈","장아찌","찌개","국밥"] },
];
