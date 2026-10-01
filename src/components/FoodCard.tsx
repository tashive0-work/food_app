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
  /** 세부 메뉴를 칩으로 보여줄지 (추천 화면 true / 검색 false) */
  showVariants?: boolean;
  state?: AppState;
  isFavorite?: boolean;
  onToggleFavorite?: (foodId: number) => void;
  diagnosisId?: string | null;
}

export function FoodCard({
  food,
  rank,
  showVariants = false,
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

  // 세부 메뉴 칩은 추천 화면에서만 보여 줍니다.
  // 검색에서는 세부 메뉴가 각각 독립된 카드로 나오므로 칩이 중복이 됩니다.
  const allVariants = showVariants ? (food.matchedVariants ?? food.variants ?? []) : [];
  const variantList = allVariants.slice(0, 4);
  const hiddenVariantCount = Math.max(0, allVariants.length - variantList.length);

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
            <span className="kindMeta">
              {food.kind}
              {food.parentName && (
                <span className="parentMeta"> · {food.parentName}의 한 종류</span>
              )}
            </span>
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

      {/* 세부 메뉴 — 매운탕 → 메기매운탕·조기매운탕 처럼 구체적으로 보여 줍니다 */}
      {variantList.length > 0 && (
        <div className="variantRow">
          <span className="variantLabel">이런 종류가 있어요</span>
          <div className="variantChips">
            {variantList.map((v) => (
              <span key={v} className="variantChip">{v}</span>
            ))}
            {hiddenVariantCount > 0 && (
              <span className="variantChip more">외 {hiddenVariantCount}개</span>
            )}
          </div>
        </div>
      )}

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
        <div className="reactBtns">
          <button
            type="button"
            onClick={handleLike}
            className={feedback === "like" ? "reactBtn like on" : "reactBtn like"}
            aria-label="좋아요"
            aria-pressed={feedback === "like"}
            title="좋아요"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 10.5V20H4.5A1.5 1.5 0 0 1 3 18.5v-6.5A1.5 1.5 0 0 1 4.5 10.5H7Z" />
              <path d="M7 10.5 11.3 3.6a1.6 1.6 0 0 1 2.9 1.2l-.9 4.2h5a2 2 0 0 1 1.96 2.4l-1.2 6A2 2 0 0 1 17.1 19H7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleDislike}
            className={feedback === "dislike" ? "reactBtn dislike on" : "reactBtn dislike"}
            aria-label="별로예요"
            aria-pressed={feedback === "dislike"}
            title="별로예요"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17 13.5V4h2.5A1.5 1.5 0 0 1 21 5.5V12a1.5 1.5 0 0 1-1.5 1.5H17Z" />
              <path d="M17 13.5 12.7 20.4a1.6 1.6 0 0 1-2.9-1.2l.9-4.2h-5a2 2 0 0 1-1.96-2.4l1.2-6A2 2 0 0 1 6.9 5H17" />
            </svg>
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
