"use client";

import React from "react";
import { Food, AppState } from "@/types/food";
import { recipeUrl, mapUrl, matchTags } from "@/lib/recommend";
import { logInteraction } from "@/lib/supabase";
import { FoodImage } from "@/components/FoodImage";

interface HeroCardProps {
  food: Food;
  state: AppState;
  isFavorite: boolean;
  onToggleFavorite: (id: number) => void;
  diagnosisId?: string | null;
}

export function HeroCard({
  food,
  state,
  isFavorite,
  onToggleFavorite,
  diagnosisId,
}: HeroCardProps) {
  const tags = matchTags(food, state);

  return (
    <article className="heroCard">
      {/* 이미지 영역 — 없으면 폴백 */}
      <div className="heroCardImg">
        <FoodImage
          src={food.image}
          name={food.name}
          className="heroCardImgInner"
        />
        <span className="heroCardBadge">오늘의 추천</span>
      </div>

      <div className="heroCardBody">
        <div className="heroCardHead">
          <div>
            <h3>{food.name}</h3>
            <p className="heroCardKind">
              {food.kind}
              {food.match != null && (
                <> · <strong>{food.match}%</strong> 일치</>
              )}
            </p>
          </div>
          <button
            className={isFavorite ? "favBtn on" : "favBtn"}
            onClick={() => {
              onToggleFavorite(food.id);
              logInteraction(
                diagnosisId || null,
                food.name,
                1,
                isFavorite ? "unfavorite" : "favorite"
              );
            }}
            aria-label={isFavorite ? "찜 해제" : "찜하기"}
          >
            {isFavorite ? "찜함" : "찜하기"}
          </button>
        </div>

        {tags.length > 0 && (
          <div className="tagRow">
            {tags.map((t) => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="heroCardBtns">
          <a
            className="btn btnMain"
            href={recipeUrl(food.name)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              logInteraction(diagnosisId || null, food.name, 1, "recipe_click")
            }
          >
            레시피 보기
          </a>
          <a
            className="btn btnSub"
            href={mapUrl(food.name)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              logInteraction(diagnosisId || null, food.name, 1, "map_click")
            }
          >
            근처 식당
          </a>
        </div>

        {food.imageCredit && (
          <p className="imgCredit">사진: {food.imageCredit}</p>
        )}
      </div>
    </article>
  );
}
