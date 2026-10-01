import { AppState, Verdict } from "@/types/food";

export interface TodayResult {
  date: string;        // "2026-08-05"
  picks: number[];
  state: AppState;
  verdict: Verdict;
  topFoodName: string;
  savedAt: number;
  /** 진단마다 다른 값. 같은 답을 한 다른 사람에게 같은 결과가 나오지 않게 합니다. */
  seed?: number;
  /** 빠른 모드(3문항)로 진단했는지 */
  fast?: boolean;
  diagnosisId?: string | null;
  aiDelta?: Record<string, number>;
  excludeFoods?: string[];
  aiReason?: string;
}

const KEY = "food_today_result";

/** 오늘 날짜 문자열 (YYYY-MM-DD) */
export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/** 진단 결과 저장 */
export function saveTodayResult(r: Omit<TodayResult, "date" | "savedAt">): void {
  try {
    const payload: TodayResult = { ...r, date: todayKey(), savedAt: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch (e) {
    console.error("Failed to save today result:", e);
  }
}

/** 오늘 날짜의 결과만 반환. 날짜가 다르면 null */
export function loadTodayResult(): TodayResult | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TodayResult;
    if (parsed.date !== todayKey()) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** 결과 삭제 */
export function clearTodayResult(): void {
  try {
    localStorage.removeItem(KEY);
  } catch (e) {
    console.error(e);
  }
}
