"use client";

import React from "react";
import { logInteraction } from "@/lib/supabase";

interface SponsoredCardProps {
  storeName: string;
  foodName: string;
  description: string;
  locationLabel: string;
  linkUrl: string;
  badgeText?: string;
}

export function SponsoredCard({
  storeName,
  foodName,
  description,
  locationLabel,
  linkUrl,
  badgeText = "지역 추천 맛집",
}: SponsoredCardProps) {
  const handleClick = () => {
    logInteraction(null, storeName, 0, "map_click");
  };

  return (
    <article
      className="sponsoredCard"
      style={{
        backgroundColor: "#FFFBF2",
        border: "1.5px solid #F5E6C8",
        borderRadius: "16px",
        padding: "16px",
        margin: "20px 0",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <span
          style={{
            fontSize: "11.5px",
            fontWeight: 700,
            color: "#D97706",
            backgroundColor: "#FEF3C7",
            padding: "3px 8px",
            borderRadius: "6px",
          }}
        >
          {badgeText}
        </span>
        <span style={{ fontSize: "11px", color: "var(--dim)" }}>AD</span>
      </div>

      <h3 style={{ margin: "0 0 4px", fontSize: "16.5px", fontWeight: 700, color: "var(--ink)" }}>
        {storeName} <span style={{ fontSize: "13.5px", fontWeight: 500, color: "var(--dim)" }}>({foodName})</span>
      </h3>
      <p style={{ margin: "0 0 10px", fontSize: "13px", color: "var(--dim)", lineHeight: 1.4 }}>
        {description}
      </p>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "12px", color: "var(--dim)" }}>📍 {locationLabel}</span>
        <a
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className="btn btnMain sm"
          style={{ fontSize: "12.5px", padding: "6px 14px", cursor: "pointer" }}
        >
          매장 정보 보기 →
        </a>
      </div>
    </article>
  );
}
