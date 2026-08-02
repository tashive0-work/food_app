import { createClient } from "@supabase/supabase-js";
import { AppState } from "@/types/food";
import { getAnonymousId, getDeviceType } from "./session";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase =
  supabaseUrl && supabaseAnonKey && !supabaseUrl.includes("your-supabase")
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Fire-and-forget session creation
export async function logSession(): Promise<string | null> {
  if (!supabase) return null;
  try {
    const anon_id = getAnonymousId();
    const device_type = getDeviceType();

    const { data, error } = await supabase
      .from("sessions")
      .insert({ anon_id, device_type })
      .select("id")
      .single();

    if (error) {
      console.warn("Supabase session log skipped:", error.message);
      return null;
    }
    return data?.id || null;
  } catch (err) {
    console.warn("Supabase session log failed:", err);
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
  if (!supabase) return null;
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
        },
        verdict_title: verdictTitle,
      })
      .select("id")
      .single();

    if (error) {
      console.warn("Supabase diagnosis log skipped:", error.message);
      return null;
    }
    return data?.id || null;
  } catch (err) {
    console.warn("Supabase diagnosis log failed:", err);
    return null;
  }
}

// Fire-and-forget interaction creation
export async function logInteraction(
  diagnosisId: string | null,
  foodName: string,
  rank: number,
  action: "view" | "recipe_click" | "map_click" | "like" | "dislike"
): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from("interactions").insert({
      diagnosis_id: diagnosisId,
      food_name: foodName,
      rank: rank,
      action: action,
    });
  } catch (err) {
    console.warn("Supabase interaction log failed:", err);
  }
}
