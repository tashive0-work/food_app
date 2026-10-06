/**
 * 끼니(아침·점심·저녁·야식) 판정과 추천 보정.
 *
 * 왜 필요한가: 진단이 끼니를 묻지 않아서 점심에 두부김치·안주가 1위로 나왔습니다.
 * 메뉴에는 이미 `점심`·`야식`·`혼술 안주` 같은 테마가 붙어 있는데 추천이 그걸 안 썼습니다.
 *
 * 왜 문항으로 안 묻는가: 「문항이 많다」가 사용자 피드백 1순위였습니다.
 * 시각은 추측이 아니라 실제 정보라서 물어볼 필요가 없습니다.
 * 대신 결과 화면에서 한 번 눌러 바꿀 수 있게 둡니다.
 */
export type MealSlot = "아침" | "점심" | "저녁" | "야식";

export const MEAL_SLOTS: { key: MealSlot; label: string; icon: string }[] = [
  { key: "아침", label: "아침", icon: "🌅" },
  { key: "점심", label: "점심", icon: "🍱" },
  { key: "저녁", label: "저녁", icon: "🌆" },
  { key: "야식", label: "야식", icon: "🌙" },
];

/** 지금 시각으로 끼니를 고릅니다. 애매한 시간대는 가까운 끼니로 붙입니다. */
export function detectMeal(now: Date = new Date()): MealSlot {
  const h = now.getHours();
  if (h >= 5 && h < 11) return "아침";
  if (h >= 11 && h < 16) return "점심";   // 15~16시 오후 간식 시간대는 점심 쪽으로
  if (h >= 16 && h < 21) return "저녁";
  return "야식";                            // 21시~새벽 5시
}

/**
 * 끼니별 가점·감점.
 *
 * 값은 벌점(penalty)에 더해지므로 **음수가 밀어주는 것**이고 양수가 끌어내리는 것입니다.
 * 6축 가중치가 1.8~3.2 이므로, 끼니 보정은 그보다 작게 잡아
 * 「끼니에 맞지만 상태에 안 맞는 메뉴」가 1위로 올라오지 않게 했습니다.
 */
const BONUS: Record<MealSlot, Record<string, number>> = {
  아침: {
    "가볍게": -2.0,
    "입맛 없을 때": -1.5,
    "건강검진 후": -1.5,
    "해장": -1.0,
    "혼술 안주": 6.0,   // 아침에 안주는 아니다
    "야식": 4.0,
    "모임": 2.5,
    "든든하게": 1.0,
  },
  점심: {
    "점심": -2.5,
    "든든하게": -1.0,
    "혼술 안주": 5.0,   // 「점심으로 두부김치는 좀 아니지 않냐」
    "야식": 3.0,
  },
  저녁: {
    "퇴근": -2.0,
    "모임": -1.0,
    "든든하게": -1.0,
    "혼술 안주": 2.5,  // 저녁에 안주가 아주 안 맞는 건 아니지만, 1위를 독식하면 안 됩니다
    "야식": 1.5,
  },
  야식: {
    "야식": -2.5,
    "혼술 안주": -1.5,
    "점심": 1.5,
    "건강검진 후": 1.5,
  },
};

/** 메뉴 테마에 대한 끼니 보정값. recommend() 의 벌점에 더해 씁니다. */
export function mealPenalty(themes: string[] | undefined, meal: MealSlot | undefined): number {
  if (!meal || !themes || themes.length === 0) return 0;
  const table = BONUS[meal];
  let p = 0;
  for (const t of themes) {
    const v = table[t];
    if (v) p += v;
  }
  return p;
}

/** 화면에 쓰는 한 줄 설명 */
export function mealLine(meal: MealSlot): string {
  switch (meal) {
    case "아침": return "속에 부담 적은 쪽으로 골랐어요";
    case "점심": return "오후를 버틸 끼니로 골랐어요";
    case "저녁": return "하루 끝에 먹기 좋은 쪽으로 골랐어요";
    case "야식": return "이 시간에 먹기 좋은 쪽으로 골랐어요";
  }
}
