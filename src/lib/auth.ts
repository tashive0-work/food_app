import { supabase } from "./supabase";

export interface UserProfile {
  id: string;
  email?: string;
  nickname?: string;
  avatar_url?: string;
  provider?: string;
}

/** 소셜 로그인 (카카오, 구글 등) 요청 */
export async function signInWithProvider(provider: "kakao" | "google", nextPath?: string) {
  if (!supabase) return { error: new Error("Supabase client가 설정되지 않았습니다.") };
  
  let redirectUrl: string | undefined = undefined;
  if (typeof window !== "undefined") {
    const targetPath = nextPath || (window.location.pathname + window.location.search);
    redirectUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(targetPath)}`;
  }
  
  return await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectUrl,
    },
  });
}

/** 로그아웃 */
export async function signOut() {
  if (!supabase) return;
  return await supabase.auth.signOut();
}

/** 현재 로그인 유저 정보 조회 */
export async function getCurrentUser() {
  if (!supabase) return null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (e) {
    console.error("Failed to get current user:", e);
    return null;
  }
}

/** 로컬스토리지 찜 목록을 Supabase DB `user_favorites`로 동기화 */
export async function syncLocalFavoritesToUser(userId: string): Promise<void> {
  if (!supabase || typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("food_favorites");
    if (!raw) return;
    const localFavIds: number[] = JSON.parse(raw);
    if (!Array.isArray(localFavIds) || localFavIds.length === 0) return;

    for (const foodId of localFavIds) {
      await supabase.from("user_favorites").upsert(
        {
          user_id: userId,
          food_id: foodId,
          food_name: `food_${foodId}`,
        },
        { onConflict: "user_id,food_id" }
      );
    }
  } catch (err) {
    console.error("Failed to sync favorites to user:", err);
  }
}

// Client-side authentication cookie synchronizer for Next.js SSR / Server Components
if (typeof window !== "undefined" && supabase) {
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.access_token) {
      document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=604800; SameSite=Lax`;
    } else {
      document.cookie = `sb-access-token=; path=/; max-age=0; SameSite=Lax`;
    }
  });
}

