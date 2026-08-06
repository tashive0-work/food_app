import { supabase } from "./supabase";
import { FOODS } from "@/data/foods";
import { Food } from "@/types/food";

export interface PopularResult {
  foods: Food[];
  isRealData: boolean;
  label: string;
}

const MIN_INTERACTIONS = 100;

/**
 * 최근 7일 상호작용이 충분히 쌓였으면 실제 인기 메뉴를,
 * 부족하면 조리·소화 편의도 기준 폴백 목록을 반환합니다.
 */
export async function getPopularFoods(limit = 8): Promise<PopularResult> {
  const fallback = {
    foods: [...FOODS].sort((a,b)=>(b.ease+b.light)-(a.ease+a.light)).slice(0,limit),
    isRealData: false,
    label: "간편하게 먹기 좋은 메뉴",
  };

  if (!supabase) return fallback;

  try {
    const since = new Date(Date.now() - 7*864e5).toISOString();
    const { data, error } = await supabase
      .from("interactions")
      .select("food_name")
      .gte("created_at", since)
      .in("action", ["favorite","like","recipe_click","map_click"]);

    if (error || !data || data.length < MIN_INTERACTIONS) return fallback;

    const counts = new Map<string, number>();
    data.forEach(r => counts.set(r.food_name, (counts.get(r.food_name) ?? 0) + 1));

    const ranked = FOODS
      .filter(f => counts.has(f.name))
      .sort((a,b) => (counts.get(b.name) ?? 0) - (counts.get(a.name) ?? 0))
      .slice(0, limit);

    if (ranked.length < limit) return fallback;

    return { foods: ranked, isRealData: true, label: "지금 많이 찾는 메뉴" };
  } catch {
    return fallback;
  }
}
