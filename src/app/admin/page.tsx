import React from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminServer } from "@/lib/serverAdminAuth";
import { AdminDashboardClient } from "@/components/AdminDashboardClient";
import { UserAuthWidget } from "@/components/UserAuthWidget";
import { BottomNav } from "@/components/BottomNav";
import { getTrends } from "@/lib/trend";
import { TrendItem } from "@/types/trend";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // 1. 서버 사이드 인증 및 이메일 화이트리스트 접근 제어 검증 (Fail-Closed)
  const auth = await verifyAdminServer();

  // 미인증 또는 허용되지 않은 계정은 대시보드 데이터를 쿼리/렌더링하지 않고 안내 화면만 렌더링 (데이터 누출 0%)
  if (!auth.authorized) {
    return (
      <div className="app hasNav">
        <main className="wrap">
          <header className="pageHead">
            <Link href="/" className="pageBack" aria-label="홈으로">
              ←
            </Link>
            <h1 className="pageTitle">운영 어드민 대시보드</h1>
          </header>

          <div className="emptyState" style={{ margin: "32px 0", padding: "40px 20px" }}>
            <p className="emptyTitle" style={{ color: "var(--danger)", fontSize: "18px", marginBottom: "8px" }}>
              🔒 관리자 접근 제한
            </p>
            <p className="emptyDesc" style={{ color: "var(--dim)", fontSize: "14px", lineHeight: 1.6, maxWidth: "420px", margin: "0 auto 24px" }}>
              {auth.reason || "이 페이지는 허용된 이메일 계정만 접근할 수 있습니다. 관리자 계정으로 로그인해 주세요."}
            </p>
            <div style={{ maxWidth: "400px", margin: "0 auto", textAlign: "left" }}>
              <UserAuthWidget />
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  // 2. 관리자 인증 성공 시에만 서버 사이드 KPI 통계 및 고객 문의/피드백 데이터 쿼리 수행
  let stats = {
    diagnosesCount: 0,
    interactionsCount: 0,
    feedbackCount: 0,
    pendingFeedbackCount: 0,
  };
  let feedbacks: any[] = [];
  let trends: TrendItem[] = [];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // 1. Diagnoses count
      const { count: diagCount } = await supabase
        .from("diagnoses")
        .select("*", { count: "exact", head: true });

      // 2. Interactions count
      const { count: interCount } = await supabase
        .from("interactions")
        .select("*", { count: "exact", head: true });

      // 3. Feedbacks list & count
      const { data: fbData, count: fbCount } = await supabase
        .from("feedback")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(30);

      const pendingCount = fbData
        ? fbData.filter((f) => f.status === "pending" || !f.status).length
        : 0;

      stats = {
        diagnosesCount: diagCount || 0,
        interactionsCount: interCount || 0,
        feedbackCount: fbCount || 0,
        pendingFeedbackCount: pendingCount,
      };

      if (fbData) feedbacks = fbData;
    } catch (e) {
      console.error("Server admin data query error:", e);
    }
  }

  try {
    trends = await getTrends(30);
  } catch (e) {
    console.error("Server admin trend query error:", e);
  }

  return (
    <div className="app hasNav">
      <main className="wrap">
        <header className="pageHead">
          <Link href="/" className="pageBack" aria-label="홈으로">
            ←
          </Link>
          <h1 className="pageTitle">운영 어드민 대시보드</h1>
        </header>

        <AdminDashboardClient
          initialStats={stats}
          initialFeedbacks={feedbacks}
          initialTrends={trends}
          adminEmail={auth.email || "관리자"}
        />
      </main>
      <BottomNav />
    </div>
  );
}
