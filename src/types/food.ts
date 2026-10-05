export interface Food {
  id: number;
  name: string;
  kind: string;
  spice: number;
  fill: number;
  warm: number;
  ease: number;
  comfort: number;
  light: number;
  themes: string[];
  /** 같은 메뉴의 구체적인 종류 (예: 매운탕 → 메기매운탕, 조기매운탕) */
  variants?: string[];
  /** 대중성 0~2 — 2:대중적, 1:보통, 0:희귀. 추천 순위 보정에 쓰입니다. */
  popularity?: number;
  /** 국물 요리 여부 — 찌개·탕·국밥·면류는 true */
  soup?: boolean;
  /** 검색 결과에서 보여줄 세부 메뉴 (검색어에 걸린 것이 앞에 옵니다) */
  matchedVariants?: string[];
  /** 세부 메뉴를 독립 카드로 내보낼 때, 어느 메뉴의 종류인지 */
  parentName?: string;
  match?: number;
  image?: string;
  imageThumb?: string;
  imageCredit?: string;
  filterWarning?: string;
  updatedAt?: string;
  source?: string;
}

export interface AnswerEffect {
  set?: Record<string, number | string>;
  add?: Record<string, number>;
}

export interface Question {
  q: string;
  a: [string, AnswerEffect][];
}

export interface AppState {
  hunger: number;
  energy: number;
  spice: number;
  comfort: number;
  time: number;
  warm: number;
  social: string;
  ageGroup?: string;
  [key: string]: number | string | undefined;
}

export interface Verdict {
  title: string;
  line: string;
}

export interface ThemeItem {
  key: string;
  label: string;
  icon: string;
  desc: string;
}
