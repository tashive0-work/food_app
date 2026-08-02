import { AppState, Verdict, Food } from "@/types/food";
import { FOODS } from "@/data/foods";

export function classify(s: AppState): Verdict {
  const { hunger, energy, spice, comfort, time } = s;
  if (time <= 1 && hunger >= 3)
    return { title: "당장 채워야 하는 상태", line: "고민할 여유가 없어요. 빨리 나오고 확실히 배부른 쪽으로 골랐어요." };
  if (comfort >= 3 && spice >= 3)
    return { title: "매콤한 위로가 필요한 상태", line: "오늘 좀 힘드셨네요. 얼큰하게 한번 풀어내는 메뉴로 모았어요." };
  if (energy <= 2 && spice <= 1)
    return { title: "속을 달래야 하는 상태", line: "몸이 자극을 원하지 않아요. 부담 없이 넘어가는 것들만 추렸어요." };
  if (comfort >= 3)
    return { title: "따뜻한 게 필요한 상태", line: "맛보다 위로가 먼저인 날이에요. 익숙하고 포근한 메뉴 위주예요." };
  if (hunger >= 3 && energy >= 3)
    return { title: "제대로 먹어야 하는 상태", line: "몸도 입도 준비됐네요. 든든하게 채우는 쪽으로 골랐어요." };
  if (hunger <= 1)
    return { title: "가볍게 끝내고 싶은 상태", line: "많이는 안 당기시죠. 가볍게 마무리하기 좋은 것들이에요." };
  if (time >= 3 && energy >= 3)
    return { title: "천천히 즐기고 싶은 상태", line: "시간도 기력도 있어요. 손이 조금 가도 아깝지 않은 메뉴예요." };
  return { title: "무난하게 잘 먹고 싶은 상태", line: "특별히 튀는 곳 없이 균형 잡힌 하루네요. 실패 없는 쪽으로 모았어요." };
}

export function recommend(
  s: AppState,
  seed: number,
  delta?: Record<string, number>,
  excludeFoods: string[] = []
): Food[] {
  const adjustedState: AppState = {
    ...s,
    hunger: Math.max(0, Math.min(4, s.hunger + (delta?.hunger || 0))),
    energy: Math.max(0, Math.min(4, s.energy + (delta?.energy || 0))),
    spice: Math.max(0, Math.min(4, s.spice + (delta?.spice || 0))),
    comfort: Math.max(0, Math.min(4, s.comfort + (delta?.comfort || 0))),
    time: Math.max(0, Math.min(4, s.time + (delta?.time || 0))),
    warm: Math.max(0, Math.min(4, s.warm + (delta?.warm || 0))),
  };

  const easeNeed = [0, 4, 3, 2, 1][adjustedState.time];
  const lightNeed = [0, 4, 3, 2, 1][adjustedState.energy];
  const rnd = (i: number) => (Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453) % 1;

  const excludedLower = excludeFoods.map((name) => name.trim().toLowerCase());

  return FOODS.filter((f) => !excludedLower.some((ex) => f.name.toLowerCase().includes(ex)))
    .map((f) => {
      let p = 0;
      p += 3.2 * Math.abs(f.spice - adjustedState.spice);
      p += 2.6 * Math.abs(f.fill - adjustedState.hunger);
      p += 2.2 * Math.abs(f.warm - adjustedState.warm);
      p += 1.8 * Math.abs(f.comfort - adjustedState.comfort);
      p += 3.0 * Math.max(0, easeNeed - f.ease);
      p += 2.4 * Math.max(0, lightNeed - f.light);
      if (adjustedState.social === "모임" && f.themes.includes("모임")) p -= 5;
      if (adjustedState.social === "혼자" && f.themes.includes("혼자")) p -= 4;
      if (adjustedState.social === "혼자" && f.themes.includes("모임")) p += 3;
      p += Math.abs(rnd(f.id)) * 2.5;
      return { ...f, match: Math.max(38, Math.min(99, Math.round(100 - p * 1.35))) };
    })
    .sort((a, b) => (b.match ?? 0) - (a.match ?? 0))
    .slice(0, 30);
}

export const recipeUrl = (n: string) =>
  `https://www.10000recipe.com/recipe/list.html?q=${encodeURIComponent(n)}`;

export const mapUrl = (n: string) =>
  `https://map.naver.com/p/search/${encodeURIComponent(n)}`;
