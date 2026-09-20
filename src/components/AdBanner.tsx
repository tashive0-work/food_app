"use client";

import React, { useEffect } from "react";

interface AdBannerProps {
  unitId?: string;
  format?: "banner" | "rectangle";
  className?: string;
}

export function AdBanner({ unitId, format = "banner", className }: AdBannerProps) {
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && (window as any).adsbygoogle) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch (e) {
      console.error("Ad script error:", e);
    }
  }, []);

  return (
    <aside
      className={`adBanner ${className || ""}`}
      aria-label="광고 영역"
      style={{
        margin: "24px 0",
        padding: "16px",
        borderRadius: "16px",
        backgroundColor: "var(--card-bg, #F9FAF8)",
        border: "1px dashed var(--line, #E4EAE6)",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "11px", color: "var(--dim, #888)", marginBottom: "6px" }}>
        SPONSORED ADVERTISEMENT
      </div>
      {unitId ? (
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-placeholder"}
          data-ad-slot={unitId}
          data-ad-format={format === "rectangle" ? "rectangle" : "auto"}
          data-full-width-responsive="true"
        />
      ) : (
        <div style={{ padding: "12px", fontSize: "13px", color: "var(--dim)" }}>
          <p style={{ margin: "0 0 4px", fontWeight: 600, color: "var(--ink)" }}>오늘 뭐 먹지 제휴 파트너 영역</p>
          <p style={{ margin: 0, fontSize: "11.5px" }}>맞춤 식단 정보 및 파트너 혜택이 제공됩니다.</p>
        </div>
      )}
    </aside>
  );
}
