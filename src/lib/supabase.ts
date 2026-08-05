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

    const { data, error } = await supabase
      .from("sessions")
      .insert({ anon_id, device_type })
      .select("id")
      .single();

    if (error) {
      console.warn("⚠️ [Supabase] Session log skipped:", error.message);
      return null;
    }
    return data?.id || null;
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
    const { data, error } = await supabase
      .from("diagnoses")
      .insert({
        session_id: sessionId,
        answers: picks,
        scores: {
          hunger: state.hunger,
          energy: state.energy,
          spice: state.spice,
          comfort: state.comfort,
          time: state.time,
          warm: state.warm,
          social: state.social,
          ageGroup: state.ageGroup,
        },
        verdict_title: verdictTitle,
      })
      .select("id")
      .single();

    if (error) {
      console.warn("⚠️ [Supabase] Diagnosis log skipped:", error.message);
      return null;
    }
    return data?.id || null;
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
  action: "view" | "recipe_click" | "map_click" | "like" | "dislike" | "favorite" | "unfavorite"
): Promise<void> {
  if (!supabase) {
    console.warn(`⚠️ [Supabase] Client not initialized. logInteraction('${action}') skipped.`);
    return;
  }
  try {
    const { error } = await supabase.from("interactions").insert({
      diagnosis_id: diagnosisId,
      food_name: foodName,
      rank: rank,
      action: action,
    });
    if (error) {
      console.warn("⚠️ [Supabase] Interaction log skipped:", error.message);
    }
  } catch (err) {
    console.warn("⚠️ [Supabase] Interaction log failed:", err);
  }
}
