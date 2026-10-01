import { createClient } from "@supabase/supabase-js";
import { AppState } from "@/types/food";
import { getAnonymousId, getDeviceType } from "./session";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const isConfigured =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  !supabaseUrl.includes("your-supabase") &&
  !supabaseAnonKey.includes("your-supabase");

if (!isConfigured && typeof window !== "undefined") {
  console.warn(
    "⚠️ [Supabase Warning] NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY 환경변수가 설정되지 않아 Supabase 로그 저장이 비활성화되었습니다. .env.local 및 Vercel 환경변수를 확인해 주세요."
  );
}

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Fire-and-forget session creation
export async function logSession(): Promise<string | null> {
  if (!supabase) {
    console.warn("⚠️ [Supabase] Client not initialized. logSession skipped.");
    return null;
  }
  try {
    const anon_id = getAnonymousId();
    const device_type = getDeviceType();

    // 테이블에 직접 쓰지 않고 RPC 를 씁니다.
    // 익명 사용자에게 테이블 접근권을 주지 않고도 기록만 남길 수 있습니다.
    const { data, error } = await supabase.rpc("log_session", {
      p_anon_id: anon_id,
      p_device_type: device_type,
    });

    if (error) {
      console.warn("⚠️ [Supabase] Session log failed:", error.message);
      return null;
    }
    return (data as string) || null;
  } catch (err) {
    console.warn("⚠️ [Supabase] Session log failed:", err);
    return null;
  }
}

// Fire-and-forget diagnosis creation
export async function logDiagnosis(
  sessionId: string | null,
  picks: number[],
  state: AppState,
  verdictTitle: string
): Promise<string | null> {
  if (!supabase) {
    console.warn("⚠️ [Supabase] Client not initialized. logDiagnosis skipped.");
    return null;
  }
  try {
    const { data, error } = await supabase.rpc("log_diagnosis", {
      p_session_id: sessionId ?? "",
      p_answers: picks,
      p_scores: {
        hunger: state.hunger,
        energy: state.energy,
        spice: state.spice,
        comfort: state.comfort,
        time: state.time,
        warm: state.warm,
        social: state.social,
        ageGroup: state.ageGroup,
      },
      p_verdict_title: verdictTitle,
    });

    if (error) {
      console.warn("⚠️ [Supabase] Diagnosis log failed:", error.message);
      return null;
    }
    return (data as string) || null;
  } catch (err) {
    console.warn("⚠️ [Supabase] Diagnosis log failed:", err);
    return null;
  }
}

// Fire-and-forget interaction creation
export async function logInteraction(
  diagnosisId: string | null,
  foodName: string,
  rank: number,
  action: "view" | "recipe_click" | "map_click" | "like" | "dislike" | "favorite" | "unfavorite" | "search" | "ai_re_recommend" | "share"
): Promise<void> {
  if (!supabase) {
    console.warn(`⚠️ [Supabase] Client not initialized. logInteraction('${action}') skipped.`);
    return;
  }
  try {
    const { error } = await supabase.rpc("log_interaction", {
      p_diagnosis_id: diagnosisId ?? "",
      p_food_name: foodName,
      p_rank: rank,
      p_action: action,
    });
    if (error) {
      console.warn("⚠️ [Supabase] Interaction log failed:", error.message);
    }
  } catch (err) {
    console.warn("⚠️ [Supabase] Interaction log failed:", err);
  }
}

/**
 * 사이트에 없는 메뉴를 기록합니다.
 * 검색했는데 결과가 0건일 때, 또는 사용자가 "추가해 주세요" 를 눌렀을 때 부릅니다.
 * 이미 등록된 메뉴면 DB 쪽에서 알아서 무시합니다.
 */
export async function logMenuRequest(
  name: string,
  source: "search" | "user" = "search"
): Promise<void> {
  if (!supabase) return;
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 40) return;
  try {
    const { error } = await supabase.rpc("log_menu_request", {
      p_name: trimmed,
      p_source: source,
    });
    if (error) {
      console.warn("⚠️ [Supabase] Menu request log failed:", error.message);
    }
  } catch (err) {
    console.warn("⚠️ [Supabase] Menu request log failed:", err);
  }
}
