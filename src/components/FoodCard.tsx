import React, { useState } from "react";
import Link from "next/link";
import { Food, AppState } from "@/types/food";
import { recipeUrl, mapUrl, matchTags } from "@/lib/recommend";
import { logInteraction } from "@/lib/supabase";
import { DELIVERY_APPS } from "@/lib/affiliate";
import { SHOW_DELIVERY } from "@/lib/features";
import { getFoodGuide } from "@/data/foodGuides";

interface FoodCardProps {
  food: Food;
  rank: number;
  state?: AppState;
  isFavorite?: boolean;
  onToggleFavorite?: (foodId: number) => void;
  diagnosisId?: string | null;
}

export function FoodCard({
  food,
  rank,
  state,
  isFavorite,
  onToggleFavorite,
  diagnosisId,
}: FoodCardProps) {
  const [feedback, setFeedback] = useState<"like" | "dislike" | null>(null);
  const tags = state ? matchTags(food, state) : [];
  const primaryDeliveryApp = DELIVERY_APPS[0];
  const guide = getFoodGuide(food.name, food.kind, food.spice, food.warm);

  const handleFavoriteClick = () => {
    if (onToggleFavorite) {
      onToggleFavorite(food.id);
      logInteraction(
        diagnosisId || null,
        food.name,
        rank,
        isFavorite ? "unfavorite" : "favorite"
      );
    }
  };

  const handleRecipeClick = () => {
    logInteraction(diagnosisId || null, food.name, rank, "recipe_click");
  };

  const handleMapClick = () => {
    logInteraction(diagnosisId || null, food.name, rank, "map_click");
  };

  const handleLike = () => {
    const nextState = feedback === "like" ? null : "like";
    setFeedback(nextState);
    if (nextState === "like") {
      logInteraction(diagnosisId || null, food.name, rank, "like");
    }
  };

  const handleDislike = () => {
    const nextState = feedback === "dislike" ? null : "dislike";
    setFeedback(nextState);
    if (nextState === "dislike") {
      logInteraction(diagnosisId || null, food.name, rank, "dislike");
    }
  };

  return (
    <article className="card">
      <div className="cardTop">
        {rank > 0 && <span className="rank">{rank}</span>}
        <div className="cardName">
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <h3>{food.name}</h3>
            {onToggleFavorite && (
              <button
                className={isFavorite ? "favBtn on" : "favBtn"}
                onClick={handleFavoriteClick}
                title={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
              >
                {isFavorite ? "찜함" : "찜하기"}
              </button>
            )}
          </div>
          <p className="kind">
            <span className="kindMeta">{food.kind}</span>
            {food.ease >= 4 && <span className="kindMeta">· 10분 안팎</span>}
            {food.ease === 3 && <span className="kindMeta">· 20분 안팎</span>}
            {food.match != null && (
              <span className="kindMatch">· {food.match}% 일치</span>
            )}
          </p>
          {tags.length > 0 && (
            <div className="tagRow">
              {tags.map((t) => (
                <span key={t} className="tag">{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 1초 결정 가이드 (추천 상황 & 베스트 꿀조합) */}
      <div
        className="foodGuideBox"
        style={{
          margin: "12px 0 14px",
          padding: "10px 12px",
          background: "var(--bg, #F9FAFB)",
          borderRadius: "8px",
          border: "1px solid var(--border, #E5E7EB)",
          fontSize: "12px",
          lineHeight: "1.5",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
          <span style={{ color: "#E8663D", fontWeight: 700, flexShrink: 0 }}>💡 추천 상황</span>
          <span style={{ color: "var(--ink)", fontWeight: 500 }}>{guide.bestWhen}</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
          <span style={{ color: "#059669", fontWeight: 700, flexShrink: 0 }}>✨ 꿀조합</span>
          <span style={{ color: "var(--ink)", fontWeight: 500 }}>{guide.pairing}</span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <div className="feedbackBtns" style={{ display: "flex", gap: "4px" }}>
          <button
            onClick={handleLike}
            title="좋아요"
            style={{
              background: feedback === "like" ? "#FFF3F2" : "transparent",
              border: feedback === "like" ? "1.5px solid var(--red)" : "1.5px solid var(--line)",
              borderRadius: "2px",
              padding: "5px 8px",
              cursor: "pointer",
              fontSize: "11px",
            }}
          >
            좋아요
          </button>
          <button
            onClick={handleDislike}
            title="별로예요"
            style={{
              background: feedback === "dislike" ? "#F5F5F5" : "transparent",
              border: feedback === "dislike" ? "1.5px solid var(--dim)" : "1.5px solid var(--line)",
              borderRadius: "2px",
              padding: "5px 8px",
              cursor: "pointer",
              fontSize: "11px",
            }}
          >
            별로
          </button>
        </div>

        <div className="cardBtns">
          {SHOW_DELIVERY && (
            <a
              className="btn btnSub"
              href={primaryDeliveryApp.getUrl(food.name)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => logInteraction(diagnosisId || null, food.name, rank, "map_click")}
              title="배달 앱으로 검색"
            >
              배달 주문 🛵
            </a>
          )}
          <a
            className="btn btnMain"
            href={recipeUrl(food.name)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleRecipeClick}
          >
            레시피
          </a>
          <a
            className="btn btnSub"
            href={mapUrl(food.name)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleMapClick}
          >
            근처 식당
          </a>
        </div>
      </div>

      <div style={{ marginTop: "10px", textAlign: "right" }}>
        <Link
          href={`/feedback?type=new_food&name=${encodeURIComponent(food.name)}`}
          style={{ fontSize: "11px", color: "var(--dim)", textDecoration: "none" }}
        >
          원하는 메뉴가 없으신가요? <span style={{ textDecoration: "underline", color: "#E8663D" }}>메뉴 건의하기</span>
        </Link>
      </div>
    </article>
  );
}
