/**
 * 메뉴별 이미지 검색 키워드 및 폴백 이모지
 *
 * keywords: Unsplash Source API 에 전달할 영문 키워드 (쉼표 구분)
 *   - 2~3개가 적당합니다. 너무 많으면 결과가 없습니다
 *   - 한식은 영문 인지도가 낮으므로 재료·조리법 위주로 작성
 *     예) 김치찌개 → "kimchi,stew" (kimchijjigae 는 결과 없음)
 * emoji: 이미지 로딩 실패 시 표시할 이모지
 *
 * 새 메뉴 추가 시 이 파일에도 반드시 항목을 추가하세요.
 * 누락되면 기본 키워드(korean,food)로 조회됩니다.
 */
export interface FoodKeyword {
  keywords: string;
  emoji: string;
}

export const FOOD_KEYWORDS: Record<string, FoodKeyword> = {
  "김치찌개": { keywords: "kimchi,stew", emoji: "🍲" },
  "된장찌개": { keywords: "doenjang,stew", emoji: "🍲" },
  "부대찌개": { keywords: "sausage,stew", emoji: "🍲" },
  "순두부찌개": { keywords: "tofu,stew", emoji: "🍲" },
  "육개장": { keywords: "beef,soup,spicy", emoji: "🍲" },
  "삼계탕": { keywords: "chicken,soup,ginseng", emoji: "🍲" },
  "설렁탕": { keywords: "beef,soup", emoji: "🍲" },
  "갈비탕": { keywords: "beef,rib,soup", emoji: "🍲" },
  "뼈해장국": { keywords: "pork,bone,soup", emoji: "🍲" },
  "콩나물국밥": { keywords: "bean,sprout,soup", emoji: "🍲" },
  "김치볶음밥": { keywords: "kimchi,fried,rice", emoji: "🍚" },
  "제육볶음": { keywords: "pork,stirfry,spicy", emoji: "🍖" },
  "불고기": { keywords: "bulgogi,beef,bbq", emoji: "🍖" },
  "삼겹살": { keywords: "pork,belly,grill", emoji: "🍖" },
  "곱창": { keywords: "grilled,tripe,meat", emoji: "🍖" },
  "족발": { keywords: "pork,trotters,meat", emoji: "🍖" },
  "보쌈": { keywords: "pork,wrap", emoji: "🍖" },
  "닭갈비": { keywords: "chicken,stirfry,spicy", emoji: "🍖" },
  "찜닭": { keywords: "braised,chicken,soy", emoji: "🍖" },
  "아구찜": { keywords: "spicy,fish,stew", emoji: "🍲" },
  "낙지볶음": { keywords: "spicy,octopus", emoji: "🐙" },
  "비빔밥": { keywords: "bibimbap,rice", emoji: "🍚" },
  "칼국수": { keywords: "noodle,soup", emoji: "🍜" },
  "수제비": { keywords: "dough,soup", emoji: "🍲" },
  "잔치국수": { keywords: "noodle,soup,light", emoji: "🍜" },
  "비빔국수": { keywords: "spicy,noodle", emoji: "🍜" },
  "냉면": { keywords: "cold,noodle", emoji: "🍜" },
  "콩국수": { keywords: "soy,noodle,cold", emoji: "🍜" },
  "전복죽": { keywords: "porridge,rice", emoji: "🍲" },
  "계란찜": { keywords: "steamed,egg", emoji: "🍳" },
  "두부김치": { keywords: "tofu,kimchi", emoji: "🥗" },
  "골뱅이소면": { keywords: "spicy,noodle", emoji: "🍜" },
  "어묵탕": { keywords: "fishcake,soup", emoji: "🍲" },
  "해물파전": { keywords: "pancake,seafood", emoji: "🥞" },
  "김치전": { keywords: "kimchi,pancake", emoji: "🥞" },
  "떡볶이": { keywords: "rice,cake,spicy", emoji: "🍡" },
  "로제떡볶이": { keywords: "creamy,spicy,ricecake", emoji: "🍡" },
  "순대": { keywords: "blood,sausage", emoji: "🍢" },
  "김밥": { keywords: "gimbap,rice,roll", emoji: "🍙" },
  "참치김밥": { keywords: "tuna,gimbap,roll", emoji: "🍙" },
  "라면": { keywords: "ramen,noodle", emoji: "🍜" },
  "짜파구리": { keywords: "ramen,noodle", emoji: "🍜" },
  "만두": { keywords: "dumplings,dimsum", emoji: "🥟" },
  "토스트": { keywords: "toast,sandwich", emoji: "🍞" },
  "짜장면": { keywords: "black,bean,noodle", emoji: "🍜" },
  "짬뽕": { keywords: "spicy,noodle,seafood", emoji: "🍜" },
  "탕수육": { keywords: "sweet,sour,pork", emoji: "🍗" },
  "마라탕": { keywords: "malatang,soup", emoji: "🍲" },
  "마라샹궈": { keywords: "spicy,stirfry", emoji: "🥘" },
  "양꼬치": { keywords: "lamb,skewers", emoji: "🍢" },
  "초밥": { keywords: "sushi,japanese", emoji: "🍣" },
  "회": { keywords: "sashimi,raw,fish", emoji: "🐟" },
  "연어덮밥": { keywords: "salmon,rice,donburi", emoji: "🍱" },
  "규동": { keywords: "gyudon,beef,rice", emoji: "🍚" },
  "우동": { keywords: "udon,noodle", emoji: "🍜" },
  "메밀소바": { keywords: "soba,noodle", emoji: "🍜" },
  "돈까스": { keywords: "tonkatsu,pork,cutlet", emoji: "🥩" },
  "라멘": { keywords: "ramen,japanese", emoji: "🍜" },
  "오므라이스": { keywords: "omurice,omelet,rice", emoji: "🍳" },
  "치킨": { keywords: "fried,chicken", emoji: "🍗" },
  "양념치킨": { keywords: "spicy,fried,chicken", emoji: "🍗" },
  "피자": { keywords: "pizza,cheese", emoji: "🍕" },
  "햄버거": { keywords: "burger,hamburger", emoji: "🍔" },
  "토마토 파스타": { keywords: "pasta,italian,tomato", emoji: "🍝" },
  "크림 파스타": { keywords: "pasta,cream,carbonara", emoji: "🍝" },
  "알리오올리오": { keywords: "aglio,olio,pasta", emoji: "🍝" },
  "리조또": { keywords: "risotto,rice", emoji: "🍚" },
  "스테이크": { keywords: "steak,beef", emoji: "🥩" },
  "감바스": { keywords: "gambas,shrimp,oil", emoji: "🍤" },
  "샌드위치": { keywords: "sandwich,bread", emoji: "🥪" },
  "샐러드": { keywords: "salad,fresh", emoji: "🥗" },
  "포케": { keywords: "poke,bowl", emoji: "🥗" },
  "부리토": { keywords: "burrito,mexican", emoji: "🌯" },
  "타코": { keywords: "taco,mexican", emoji: "🌮" },
  "팬케이크": { keywords: "pancake,syrup", emoji: "🥞" },
  "쌀국수": { keywords: "pho,noodle", emoji: "🍜" },
  "팟타이": { keywords: "padthai,noodle", emoji: "🍜" },
  "카레라이스": { keywords: "curry,rice", emoji: "🍛" },
  "편의점 도시락": { keywords: "bento,lunchbox", emoji: "🍱" },
  "그릭요거트볼": { keywords: "yogurt,bowl,fruit", emoji: "🥣" },
  "제철 과일": { keywords: "fresh,fruits", emoji: "🍎" },
  "아이스크림": { keywords: "icecream,dessert", emoji: "🍨" },
  "호떡": { keywords: "hotteok,sweet,pancake", emoji: "🥞" },
};

/** 매핑에 없는 메뉴의 기본값 */
export const DEFAULT_KEYWORD: FoodKeyword = {
  keywords: "korean,food",
  emoji: "🍽️",
};
