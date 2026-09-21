import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * next 경로 보안 검증 함수 (Open Redirect 방지)
 * - "/" 로 시작하는 상대 경로만 허용
 * - "//" 로 시작하거나 "http" 가 포함된 값은 거부하고 "/" 로 보낸다
 */
function getValidatedNextPath(rawNext: string | null): string {
  if (!rawNext) return "/";

  if (
    rawNext.startsWith("/") &&
    !rawNext.startsWith("//") &&
    !rawNext.toLowerCase().includes("http")
  ) {
    return rawNext;
  }

  return "/";
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const rawNext = requestUrl.searchParams.get("next");

  const safeNextPath = getValidatedNextPath(rawNext);
  const redirectTarget = new URL(safeNextPath, requestUrl.origin);
  const response = NextResponse.redirect(redirectTarget);

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data } = await supabase.auth.exchangeCodeForSession(code);
      if (data?.session?.access_token) {
        response.cookies.set("sb-access-token", data.session.access_token, {
          path: "/",
          sameSite: "lax",
          maxAge: 604800,
        });
      }
    }
  }

  return response;
}
