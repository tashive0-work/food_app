import { Food } from "@/types/food";

/**
 * 테마 탭의 노출 순서를 결정합니다.
 *
 * 문제: FOODS 배열을 filter 만 하면 foods.ts 등록 순서(한식 먼저)가 그대로 나와서,
 *       다이어트 탭에 계란찜·닭한마리가 먼저 오고 샐러드·포케가 뒤로 밀렸습니다.
 *
 * 해결:
 *  1) 사람이 고른 테마(다이어트·건강검진 후·혼술 안주)는 대표성 순서를 직접 지정합니다.
 *  2) 나머지 테마는 그 테마를 정의하는 축을 기준으로 정렬합니다.
 */

/** 수동 순서 — 배열 앞쪽이 그 테마를 가장 잘 대표하는 메뉴 */
const CURATED_ORDER: Record<string, string[]> = {
  다이어트: [
    "닭가슴살샐러드", "샐러드", "연어샐러드", "포케", "리코타치즈샐러드",
    "그릭요거트볼", "키토김밥", "월남쌈", "회", "샤브샤브",
    "밀푀유나베", "탄두리치킨", "닭한마리", "계란찜", "먹태구이",
    "메밀소바", "제철 과일",
  ],
  "건강검진 후": [
    "전복죽", "호박죽", "계란찜", "콩나물국밥", "황태해장국",
    "단팥죽", "떡국", "만둣국", "잔치국수", "칼국수",
    "수제비", "감자옹심이", "곰탕", "닭곰탕", "설렁탕",
    "소머리국밥", "우동", "나베야끼우동", "단호박스프", "양송이스프",
    "클램차우더", "샤브샤브", "밀푀유나베", "도가니탕", "삼계탕",
    "갈비탕", "영양솥밥", "곤드레밥", "오야코동", "유산슬",
    "소롱포", "딤섬", "콩비지찌개",
  ],
  "혼술 안주": [
    "치킨", "양념치킨", "골뱅이소면", "먹태구이", "닭발",
    "국물닭발", "오돌뼈", "닭똥집튀김", "곱창", "족발",
    "보쌈", "두부김치", "해물파전", "김치전", "어묵탕",
    "모둠튀김", "가라아게", "타코야키", "오코노미야키", "양꼬치",
    "감바스", "순대", "만두", "군만두", "멘보샤",
    "비빔만두", "불닭", "곱도리탕", "닭꼬치", "김치피자탕수육",
    "크림새우", "칠리새우", "꿔바로우", "차돌박이", "대패삼겹살",
    "회", "주꾸미볶음", "낙지볶음", "알탕",
  ],
};

type AxisKey = "spice" | "fill" | "warm" | "ease" | "comfort" | "light";
type Rule = { key: AxisKey; dir: "desc" | "asc" }[];

/** 테마별 관련도 기준 — 그 테마를 정의하는 축이 앞에 온다 */
const RELEVANCE: Record<string, Rule> = {
  혼자: [{ key: "ease", dir: "desc" }, { key: "comfort", dir: "desc" }],
  퇴근: [{ key: "comfort", dir: "desc" }, { key: "warm", dir: "desc" }],
  점심: [{ key: "comfort", dir: "desc" }, { key: "ease", dir: "desc" }],
  가볍게: [{ key: "light", dir: "desc" }, { key: "fill", dir: "asc" }],
  든든하게: [{ key: "fill", dir: "desc" }, { key: "comfort", dir: "desc" }],
  "입맛 없을 때": [{ key: "comfort", dir: "desc" }, { key: "light", dir: "desc" }, { key: "spice", dir: "asc" }],
  해장: [{ key: "warm", dir: "desc" }, { key: "light", dir: "desc" }, { key: "comfort", dir: "desc" }],
  "추운 날": [{ key: "warm", dir: "desc" }, { key: "comfort", dir: "desc" }],
  "더운 날": [{ key: "light", dir: "desc" }, { key: "ease", dir: "desc" }],
  비: [{ key: "warm", dir: "desc" }, { key: "comfort", dir: "desc" }],
  모임: [{ key: "fill", dir: "desc" }, { key: "comfort", dir: "desc" }],
  야식: [{ key: "comfort", dir: "desc" }, { key: "ease", dir: "desc" }],
  주말: [{ key: "comfort", dir: "desc" }, { key: "fill", dir: "desc" }],
};

const DEFAULT_RULE: Rule = [{ key: "comfort", dir: "desc" }, { key: "ease", dir: "desc" }];

/** 사용자가 고를 수 있는 정렬 */
export type SortKey = "relevant" | "fast" | "light" | "hearty";

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "relevant", label: "추천순" },
  { key: "fast", label: "빠른순" },
  { key: "light", label: "가벼운순" },
  { key: "hearty", label: "든든한순" },
];

function byRule(rule: Rule) {
  return (a: Food, b: Food) => {
    for (const { key, dir } of rule) {
      const diff = dir === "desc" ? b[key] - a[key] : a[key] - b[key];
      if (diff !== 0) return diff;
    }
    return a.name.localeCompare(b.name, "ko");
  };
}

export function sortThemeFoods(foods: Food[], theme: string, sort: SortKey = "relevant"): Food[] {
  const list = [...foods];

  if (sort === "fast") {
    return list.sort(byRule([{ key: "ease", dir: "desc" }, { key: "comfort", dir: "desc" }]));
  }
  if (sort === "light") {
    return list.sort(byRule([{ key: "light", dir: "desc" }, { key: "fill", dir: "asc" }]));
  }
  if (sort === "hearty") {
    return list.sort(byRule([{ key: "fill", dir: "desc" }, { key: "warm", dir: "desc" }]));
  }

  // 추천순
  const curated = CURATED_ORDER[theme];
  if (curated) {
    const rank = new Map(curated.map((n, i) => [n, i]));
    return list.sort((a, b) => {
      const ra = rank.get(a.name) ?? 9999;
      const rb = rank.get(b.name) ?? 9999;
      if (ra !== rb) return ra - rb;
      return a.name.localeCompare(b.name, "ko");
    });
  }
  return list.sort(byRule(RELEVANCE[theme] || DEFAULT_RULE));
}
