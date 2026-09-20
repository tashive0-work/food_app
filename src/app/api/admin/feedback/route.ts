import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminServer } from "@/lib/serverAdminAuth";

export async function POST(request: Request) {
  // 1. 서버 사이드 관리자 권한 검증
  const auth = await verifyAdminServer();
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.reason || "Unauthorized" },
      { status: 403 }
    );
  }

  try {
    const { id, status } = await request.json();

    if (!id || typeof id !== "number" || !status || typeof status !== "string") {
      return NextResponse.json(
        { error: "잘못된 파라미터입니다." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Supabase 설정 오류" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { error } = await supabase
      .from("feedback")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("Feedback update DB error:", error);
      return NextResponse.json(
        { error: "DB 업데이트 실패" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id, status });
  } catch (e: any) {
    console.error("Admin feedback API error:", e);
    return NextResponse.json(
      { error: "서버 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
