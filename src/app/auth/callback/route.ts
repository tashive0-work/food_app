import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const response = NextResponse.redirect(requestUrl.origin);

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

  // URL redirect to origin home page after login
  return response;
}
