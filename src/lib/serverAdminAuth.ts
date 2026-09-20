import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export interface AdminAuthResult {
  authorized: boolean;
  email?: string;
  reason?: string;
}

/**
 * 서버 사이드에서 /admin 접근 권한을 검증합니다.
 * - ADMIN_EMAILS 환경변수가 없거나 비어있으면 Fail-Closed (모두 차단)
 * - 쿠키의 sb-access-token 토큰을 Supabase Auth로 검증
 * - 허용된 이메일 화이트리스트에 해당 이메일이 포함되어 있는지 검증
 */
export async function verifyAdminServer(): Promise<AdminAuthResult> {
  const adminEmailsRaw = process.env.ADMIN_EMAILS;

  // 1. 환경변수가 미설정 또는 빈 값인 경우 Fail-Closed (모두 차단)
  if (!adminEmailsRaw || !adminEmailsRaw.trim()) {
    return {
      authorized: false,
      reason: "관리자 이메일 목록(ADMIN_EMAILS) 환경변수가 설정되지 않았거나 비어있습니다. (Fail-Closed)",
    };
  }

  const allowedEmails = adminEmailsRaw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (allowedEmails.length === 0) {
    return {
      authorized: false,
      reason: "허용된 관리자 이메일 화이트리스트 목록이 존재하지 않습니다.",
    };
  }

  // 2. HTTP 요청 쿠키에서 Supabase access token 추출
  const cookieStore = cookies();
  const token = cookieStore.get("sb-access-token")?.value;

  if (!token) {
    return {
      authorized: false,
      reason: "인증 세션이 없습니다. 관리자 계정으로 로그인해 주세요.",
    };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      authorized: false,
      reason: "Supabase 설정 정보가 유효하지 않습니다.",
    };
  }

  // 3. Supabase Auth를 통한 토큰 세션 검증
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user || !user.email) {
      return {
        authorized: false,
        reason: "유효하지 않거나 만료된 로그인 세션입니다. 다시 로그인해 주세요.",
      };
    }

    const userEmail = user.email.toLowerCase();
    const isAllowed = allowedEmails.includes(userEmail);

    if (!isAllowed) {
      return {
        authorized: false,
        email: user.email,
        reason: `현재 로그인한 계정(${user.email})은 관리자 권한이 없습니다.`,
      };
    }

    return {
      authorized: true,
      email: user.email,
    };
  } catch (err) {
    console.error("verifyAdminServer error:", err);
    return {
      authorized: false,
      reason: "서버 인증 검증 중 오류가 발생했습니다.",
    };
  }
}
