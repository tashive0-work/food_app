"use client";

import React, { useState, useEffect } from "react";
import { signInWithProvider, signOut, getCurrentUser, syncLocalFavoritesToUser } from "@/lib/auth";

export function UserAuthWidget() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        if (currentUser) {
          await syncLocalFavoritesToUser(currentUser.id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLogin = async (provider: "kakao" | "google") => {
    setLoading(true);
    const { error } = await signInWithProvider(provider);
    if (error) {
      console.error("Login failed:", error.message);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await signOut();
    setUser(null);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: "16px", justifyContent: "center" }}>
        <p style={{ margin: 0, fontSize: "13px", color: "var(--dim)" }}>로그인 상태 확인 중...</p>
      </div>
    );
  }

  if (user) {
    const email = user.email || user.user_metadata?.email || "소셜 계정 회원";
    const name = user.user_metadata?.name || user.user_metadata?.full_name || "회원";

    return (
      <div className="card" style={{ flexDirection: "column", alignItems: "flex-start", gap: "10px", padding: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
          <div>
            <span className="liveBadge" style={{ background: "var(--primary)", color: "#fff", marginBottom: "4px" }}>
              로그인됨
            </span>
            <p style={{ margin: "4px 0 0", fontWeight: 700, fontSize: "15px" }}>{name} 님</p>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--dim)" }}>{email}</p>
          </div>
          <button onClick={handleLogout} className="btnSub sm" style={{ cursor: "pointer" }}>
            로그아웃
          </button>
        </div>
        <p style={{ margin: 0, fontSize: "11.5px", color: "var(--dim)", lineHeight: 1.4 }}>
          ✓ 찜 목록 및 선호 설정이 계정에 동기화되었습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ flexDirection: "column", alignItems: "flex-start", gap: "12px", padding: "16px" }}>
      <div>
        <p style={{ margin: 0, fontWeight: 700, fontSize: "14.5px" }}>소셜 계정 동기화</p>
        <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "var(--dim)", lineHeight: 1.5 }}>
          로그인하시면 찜한 메뉴와 식이 설정을 모든 기기에서 동기화할 수 있습니다.
        </p>
      </div>
      <div style={{ display: "flex", gap: "8px", width: "100%" }}>
        <button
          onClick={() => handleLogin("kakao")}
          className="btn"
          style={{
            flex: 1,
            backgroundColor: "#FEE500",
            color: "#000000",
            border: "none",
            fontSize: "13px",
            fontWeight: 700,
            padding: "10px",
            cursor: "pointer",
          }}
        >
          카카오 로그인
        </button>
        <button
          onClick={() => handleLogin("google")}
          className="btn btnSub"
          style={{
            flex: 1,
            fontSize: "13px",
            padding: "10px",
            cursor: "pointer",
          }}
        >
          구글 로그인
        </button>
      </div>
    </div>
  );
}
