import React, { useState } from "react";
import { Food } from "@/types/food";
import { recipeUrl, mapUrl } from "@/lib/recommend";
import { logInteraction } from "@/lib/supabase";

interface FoodCardProps {
  food: Food;
  rank: number;
  isFavorite?: boolean;
  onToggleFavorite?: (foodId: number) => void;
  diagnosisId?: string | null;
}

export function FoodCard({
  food,
  rank,
  isFavorite,
  onToggleFavorite,
  diagnosisId,
}: FoodCardProps) {
  const [feedback, setFeedback] = useState<"like" | "dislike" | null>(null);

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
        <span className="rank">{rank}</span>
        <div className="cardName">
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <h3>{food.name}</h3>
            {onToggleFavorite && (
              <button
                onClick={handleFavoriteClick}
                title={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "15px",
                  padding: "0 2px",
                }}
              >
                {isFavorite ? "❤️" : "🤍"}
              </button>
            )}
          </div>
          <p className="kind">
            {food.kind}
            {food.match != null && <> · 잘 맞아요 {food.match}%</>}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
              fontSize: "13px",
            }}
          >
            👍
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
              fontSize: "13px",
            }}
          >
            👎
          </button>
        </div>

        <div className="cardBtns">
          <a
            className="btn btnMain"
            href={recipeUrl(food.name)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleRecipeClick}
          >
            레시피 보기
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
    </article>
  );
}
