import { supabase } from "./supabase";
import { TrendItem } from "@/types/trend";
import { AppState } from "@/types/food";

/** 활성 트렌드 목록 조회 (rank 순) */
export async function getTrends(limit = 20): Promise<TrendItem[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("trend_items")
      .select("*")
      .eq("active", true)
      .order("rank", { ascending: true })
      .limit(limit);
    if (error) {
      console.warn("[trend] 조회 실패:", error);
      return [];
    }
    if (!data) return [];
    return data as TrendItem[];
  } catch (e) {
    console.warn("[trend] 조회 실패:", e);
    return [];
  }
}

/**
 * 사용자 상태와 트렌드 메뉴의 적합도를 계산합니다.
 * recommend.ts 와 동일한 가중치를 사용하되,
 * 6축 값이 null 인 항목은 매칭에서 제외합니다.
 */
export function matchTrendsToState(
  items: TrendItem[],
  s: AppState
): { item: TrendItem; match: number }[] {
  return items
    .filter((t) =>
      t.spice !== null && t.fill !== null && t.warm !== null &&
      t.ease !== null && t.comfort !== null && t.light !== null
    )
    .map((t) => {
      const easeNeed = [4, 4, 3, 2, 1][s.time];
      const lightNeed = [4, 4, 3, 2, 1][s.energy];
      let p = 0;
      p += 3.2 * Math.abs((t.spice as number) - s.spice);
      p += 2.6 * Math.abs((t.fill as number) - s.hunger);
      p += 2.2 * Math.abs((t.warm as number) - s.warm);
      p += 1.8 * Math.abs((t.comfort as number) - s.comfort);
      p += 3.0 * Math.max(0, easeNeed - (t.ease as number));
      p += 2.4 * Math.max(0, lightNeed - (t.light as number));
      return { item: t, match: Math.max(38, Math.min(99, Math.round(100 - p * 1.35))) };
    })
    .sort((a, b) => b.match - a.match);
}
