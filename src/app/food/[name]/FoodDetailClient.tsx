"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FOODS } from "@/data/foods";
import { Food } from "@/types/food";
import { getFoodGuide } from "@/data/foodGuides";
import { getRelatedFoods, RelatedFoodItem } from "@/lib/relatedFoods";
import { recipeUrl, mapUrl } from "@/lib/recommend";
import { loadDietSettings } from "@/lib/dietFilter";
import { logInteraction } from "@/lib/supabase";
import { FoodImage } from "@/components/FoodImage";
import { BottomNav } from "@/components/BottomNav";

export function findFood(name: string): Food | null {
  if (!name) return null;
  return (
    FOODS.find((f) => f.name === name) ||
    FOODS.find((f) => f.name.replace(/\s+/g, "") === name.replace(/\s+/g, "")) ||
    null
  );
}

interface PageProps {
  params: {
    name: string;
  };
  initialRelated?: RelatedFoodItem[];
}

export default function FoodDetailClient({ params, initialRelated = [] }: PageProps) {
  const router = useRouter();
  const rawParam = params.name ? decodeURIComponent(params.name) : "";

  // 서버 렌더링 때부터 메뉴를 찾아 두어야 검색엔진이 "찾을 수 없습니다" 대신 실제 내용을 읽습니다.
  const [food, setFood] = useState<Food | null>(() => findFood(rawParam));
  const [relatedList, setRelatedList] = useState<RelatedFoodItem[]>(initialRelated);
  const [favorites, setFavorites] = useState<number[]>([]);

  // 즐겨찾기 로드
  useEffect(() => {
    try {
      const f = localStorage.getItem("food_favorites");
      if (f) setFavorites(JSON.parse(f));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // 메뉴 및 관련 메뉴 탐색
  useEffect(() => {
    if (!rawParam) return;
    const target = findFood(rawParam);

    if (target) {
      setFood(target);
      const dietSettings = loadDietSettings();
      const related = getRelatedFoods(target, { limit: 6, dietSettings });
      setRelatedList(related);

      // 상호작용 로그 (메뉴 상세 조회)
      logInteraction(null, target.name, 1, "map_click");
    }
  }, [rawParam]);

  const toggleFavorite = (foodId: number, foodName: string) => {
    try {
      let next: number[];
      const isFav = favorites.includes(foodId);
      if (isFav) {
        next = favorites.filter((id) => id !== foodId);
        logInteraction(null, foodName, 1, "unfavorite");
      } else {
        next = [...favorites, foodId];
        logInteraction(null, foodName, 1, "favorite");
      }
      setFavorites(next);
      localStorage.setItem("food_favorites", JSON.stringify(next));
    } catch (e) {
      console.error(e);
    }
  };

  if (!food) {
    return (
      <div className="app hasNav">
        <main className="wrap" style={{ padding: "40px 20px", textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🍽️</div>
          <h1 style={{ fontSize: "20px", fontWeight: 800, margin: "0 0 8px" }}>
            메뉴 정보를 찾을 수 없습니다
          </h1>
          <p style={{ color: "var(--dim)", fontSize: "14px", margin: "0 0 24px" }}>
            요청하신 메뉴가 등록되어 있지 않거나 잘못된 접근입니다.
          </p>
          <Link
            href="/"
            className="btn btnMain"
            style={{ display: "inline-block", textDecoration: "none" }}
          >
            홈으로 돌아가기
          </Link>
        </main>
        <BottomNav favCount={favorites.length} />
      </div>
    );
  }

  const guide = getFoodGuide(food.name, food.kind, food.spice, food.warm);
  const isTargetFavorite = favorites.includes(food.id);

  // 소요 시간 라벨
  const timeLabel =
    food.ease >= 4 ? "약 10분 안팎" : food.ease === 3 ? "약 20분 안팎" : "약 30분 이상";

  return (
    <div className="app hasNav">
      <main className="wrap" style={{ paddingBottom: "24px" }}>
        {/* 네비게이션 헤더 */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 0 12px",
            borderBottom: "1px solid var(--border)",
            marginBottom: "18px",
          }}
        >
          <button
            onClick={() => router.back()}
            style={{
              background: "none",
              border: "none",
              padding: "6px",
              cursor: "pointer",
              color: "var(--ink)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "14px",
              fontWeight: 700,
            }}
            aria-label="뒤로가기"
          >
            <span style={{ fontSize: "18px" }}>←</span> 뒤로
          </button>
          <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--ink)" }}>
            메뉴 상세 정보
          </span>
          <Link
            href="/"
            style={{
              fontSize: "18px",
              textDecoration: "none",
              color: "var(--dim)",
              padding: "6px",
            }}
            aria-label="홈으로 가기"
          >
            🏠
          </Link>
        </header>

        {/* =====================================================
            [상단 단] 사용자가 누른 메뉴 — 크게, 단독으로
            이름, 카테고리, 소요시간, 추천 상황, 꿀조합, 찜하기, 레시피/식당 버튼
        ===================================================== */}
        <section
          aria-label="선택한 메뉴 상세 정보"
          style={{
            background: "#FFFFFF",
            borderRadius: "var(--r-xl)",
            padding: "24px 20px",
            border: "1px solid var(--border)",
            boxShadow: "var(--sh1)",
          }}
        >
          {/* 큰 이미지 박스 */}
          <div
            style={{
              width: "100%",
              maxWidth: "260px",
              margin: "0 auto 20px",
              aspectRatio: "1 / 1",
              borderRadius: "16px",
              overflow: "hidden",
              border: "1px solid var(--border)",
              boxShadow: "0 4px 14px rgba(0, 0, 0, 0.04)",
            }}
          >
            <FoodImage
              name={food.name}
              src={food.image}
              variant="main"
              className="detailHeroImg"
              showLabel={false}
            />
          </div>

          {/* 메인 정보 헤더 (메뉴명, 카테고리, 찜하기) */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "12px",
              marginBottom: "12px",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginBottom: "6px",
                }}
              >
                <span
                  style={{
                    background: "var(--primaryBg)",
                    color: "#E8663D",
                    fontWeight: 700,
                    fontSize: "12px",
                    padding: "3px 8px",
                    borderRadius: "6px",
                  }}
                >
                  {food.kind}
                </span>
                <span
                  style={{
                    background: "#F3F4F6",
                    color: "var(--dim)",
                    fontWeight: 600,
                    fontSize: "12px",
                    padding: "3px 8px",
                    borderRadius: "6px",
                  }}
                >
                  ⏱️ {timeLabel}
                </span>
              </div>
              <h1
                style={{
                  fontSize: "24px",
                  fontWeight: 900,
                  margin: 0,
                  letterSpacing: "-0.03em",
                  color: "var(--ink)",
                  lineHeight: 1.25,
                }}
              >
                {food.name}
              </h1>
            </div>

            <button
              onClick={() => toggleFavorite(food.id, food.name)}
              className={isTargetFavorite ? "favBtn on" : "favBtn"}
              style={{ flexShrink: 0, marginTop: "4px" }}
              aria-label={isTargetFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
            >
              {isTargetFavorite ? "찜함" : "찜하기"}
            </button>
          </div>

          {/* 6축 특성 뱃지 목록 */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "6px",
              marginBottom: "18px",
            }}
          >
            {food.spice >= 3 && (
              <span
                style={{
                  background: "#FEE2E2",
                  color: "#DC2626",
                  fontSize: "11.5px",
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: "9999px",
                }}
              >
                🌶️ 얼큰해요
              </span>
            )}
            {food.spice <= 1 && (
              <span
                style={{
                  background: "#F1F5F9",
                  color: "#475569",
                  fontSize: "11.5px",
                  fontWeight: 600,
                  padding: "3px 8px",
                  borderRadius: "9999px",
                }}
              >
                🌱 맵지 않아요
              </span>
            )}
            {food.warm >= 4 && (
              <span
                style={{
                  background: "#FFEDD5",
                  color: "#C2410C",
                  fontSize: "11.5px",
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: "9999px",
                }}
              >
                🍲 뜨끈해요
              </span>
            )}
            {food.warm <= 1 && (
              <span
                style={{
                  background: "#E0F2FE",
                  color: "#0369A1",
                  fontSize: "11.5px",
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: "9999px",
                }}
              >
                🧊 시원해요
              </span>
            )}
            {food.light >= 3 && (
              <span
                style={{
                  background: "#ECFDF5",
                  color: "#047857",
                  fontSize: "11.5px",
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: "9999px",
                }}
              >
                🌿 속이 편해요
              </span>
            )}
            {food.fill >= 4 && (
              <span
                style={{
                  background: "#FEF3C7",
                  color: "#B45309",
                  fontSize: "11.5px",
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: "9999px",
                }}
              >
                🍚 든든해요
              </span>
            )}
          </div>

          {/* 1초 결정 가이드 (추천 상황 & 베스트 꿀조합) */}
          <div
            style={{
              padding: "14px 16px",
              background: "#F8F9FA",
              borderRadius: "12px",
              border: "1px solid var(--border)",
              fontSize: "13px",
              lineHeight: 1.55,
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
              <span style={{ color: "#E8663D", fontWeight: 800, flexShrink: 0 }}>
                💡 추천 상황
              </span>
              <span style={{ color: "var(--ink)", fontWeight: 500 }}>
                {guide.bestWhen}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
              <span style={{ color: "#059669", fontWeight: 800, flexShrink: 0 }}>
                ✨ 꿀조합
              </span>
              <span style={{ color: "var(--ink)", fontWeight: 500 }}>
                {guide.pairing}
              </span>
            </div>
          </div>

          {/* 이 메뉴의 구체적인 종류 */}
          {food.variants && food.variants.length > 0 && (
            <div className="variantBox">
              <p className="variantHead">이런 종류가 있어요</p>
              <div className="variantChips">
                {food.variants.map((v) => (
                  <a
                    key={v}
                    className="variantChip"
                    href={recipeUrl(v)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {v}
                  </a>
                ))}
              </div>
              <p className="variantNote">눌러서 레시피를 찾아볼 수 있어요</p>
            </div>
          )}

          {/* 레시피 / 근처 식당 버튼 */}
          <div style={{ display: "flex", gap: "10px" }}>
            <a
              href={recipeUrl(food.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btnMain"
              style={{
                flex: 1,
                textAlign: "center",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "13px 16px",
                fontSize: "14.5px",
                fontWeight: 800,
                borderRadius: "12px",
              }}
              onClick={() => logInteraction(null, food.name, 1, "recipe_click")}
            >
              <span>🍳</span>
              <span>레시피 보기</span>
            </a>
            <a
              href={mapUrl(food.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btnSub"
              style={{
                flex: 1,
                textAlign: "center",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "13px 16px",
                fontSize: "14.5px",
                fontWeight: 800,
                borderRadius: "12px",
              }}
              onClick={() => logInteraction(null, food.name, 1, "map_click")}
            >
              <span>📍</span>
              <span>주변 식당 검색</span>
            </a>
          </div>

          {/* 메뉴 건의하기 링크 */}
          <div style={{ marginTop: "14px", textAlign: "right" }}>
            <Link
              href={`/feedback?type=new_food&name=${encodeURIComponent(food.name)}`}
              style={{
                fontSize: "12px",
                color: "var(--dim)",
                textDecoration: "none",
              }}
            >
              원하는 메뉴가 없으신가요?{" "}
              <span style={{ textDecoration: "underline", color: "#E8663D", fontWeight: 600 }}>
                메뉴 건의하기
              </span>
            </Link>
          </div>
        </section>

        {/* =====================================================
            [구분선] 두 영역이 한 덩어리로 보이지 않도록 시각적으로 확실히 분리
        ===================================================== */}
        <div
          style={{
            height: "14px",
            background: "#F1F3F5",
            margin: "32px -20px 28px -20px",
            borderTop: "1px solid var(--border)",
            borderBottom: "1px solid var(--border)",
          }}
          aria-hidden="true"
        />

        {/* =====================================================
            [하단 단] "이런 메뉴는 어때요?" 제목 + 관련 음식 카드 목록
            같은 카테고리 우선 및 6축 점수 유사도 순 8~12개 노출
        ===================================================== */}
        <section aria-label="관련 메뉴 추천 목록">
          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                display: "inline-block",
                background: "var(--primaryBg)",
                color: "#E8663D",
                padding: "3px 8px",
                borderRadius: "6px",
                fontSize: "11.5px",
                fontWeight: 700,
                marginBottom: "6px",
              }}
            >
              연관 메뉴 추천
            </div>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 800,
                margin: "0 0 4px",
                letterSpacing: "-0.02em",
                color: "var(--ink)",
              }}
            >
              이런 메뉴는 어때요?
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: "13px",
                color: "var(--dim)",
                lineHeight: 1.45,
                fontWeight: 500,
              }}
            >
              <strong>{food.name}</strong>와 취향과 맛이 가장 가까운 메뉴들을 모았어요
            </p>
          </div>

          {/* 관련 메뉴 리스트 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {relatedList.map((item) => {
              const isFav = favorites.includes(item.food.id);
              const rGuide = getFoodGuide(
                item.food.name,
                item.food.kind,
                item.food.spice,
                item.food.warm
              );

              return (
                <div
                  key={item.food.id}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--r-lg)",
                    padding: "14px 16px",
                    boxShadow: "var(--sh1)",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                >
                  {/* 카드 썸네일 이미지 링크 */}
                  <Link
                    href={`/food/${encodeURIComponent(item.food.name)}`}
                    style={{
                      textDecoration: "none",
                      width: "64px",
                      height: "64px",
                      flexShrink: 0,
                      borderRadius: "12px",
                      overflow: "hidden",
                      border: "1px solid var(--border)",
                      display: "block",
                    }}
                  >
                    <FoodImage
                      name={item.food.name}
                      src={item.food.imageThumb || item.food.image}
                      showLabel={false}
                      className="relatedItemThumb"
                    />
                  </Link>

                  {/* 중앙 상세 정보 링크 */}
                  <Link
                    href={`/food/${encodeURIComponent(item.food.name)}`}
                    style={{
                      textDecoration: "none",
                      flex: 1,
                      minWidth: 0,
                      color: "inherit",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginBottom: "2px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: item.isSameKind ? "#E8663D" : "var(--dim)",
                          background: item.isSameKind ? "var(--primaryBg)" : "#F3F4F6",
                          padding: "2px 6px",
                          borderRadius: "4px",
                        }}
                      >
                        {item.food.kind}
                      </span>
                      {item.matchReasons.length > 0 && (
                        <span
                          style={{
                            fontSize: "11px",
                            color: "var(--dim)",
                            fontWeight: 500,
                          }}
                        >
                          · {item.matchReasons.join(" · ")}
                        </span>
                      )}
                    </div>

                    <h3
                      style={{
                        fontSize: "16px",
                        fontWeight: 800,
                        margin: "0 0 3px",
                        color: "var(--ink)",
                        letterSpacing: "-0.02em",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.food.name}
                    </h3>

                    <p
                      style={{
                        fontSize: "12px",
                        color: "var(--dim)",
                        margin: 0,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {rGuide.bestWhen}
                    </p>
                  </Link>

                  {/* 우측 찜하기 버튼 & 상세 화살표 */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      flexShrink: 0,
                    }}
                  >
                    <button
                      onClick={() => toggleFavorite(item.food.id, item.food.name)}
                      className={isFav ? "favBtn on" : "favBtn"}
                      style={{ padding: "6px 8px", fontSize: "11px" }}
                      aria-label={isFav ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                    >
                      {isFav ? "찜함" : "찜하기"}
                    </button>
                    <Link
                      href={`/food/${encodeURIComponent(item.food.name)}`}
                      style={{
                        textDecoration: "none",
                        color: "var(--dim)",
                        fontSize: "16px",
                        padding: "4px",
                        fontWeight: 700,
                      }}
                      aria-label={`${item.food.name} 상세 보기`}
                    >
                      →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 법적 리스크 관리용 알레르기 안내 문구 유지 */}
        <div
          style={{
            marginTop: "28px",
            padding: "12px 14px",
            background: "#FFFBEB",
            border: "1px solid #FDE68A",
            borderRadius: "10px",
            fontSize: "11.5px",
            color: "#92400E",
            lineHeight: 1.5,
          }}
        >
          <strong>안내사항</strong>: 본 서비스의 알레르기 및 식이 조건 정보는 메뉴명 기반
          참고용 필터입니다. 조리 과정 및 식당에 따라 실제 유발 성분이 포함될 수 있으므로,
          중증 알레르기가 있는 경우 주문 전 식당에 반드시 확인하시기 바랍니다.
        </div>
      </main>

      <BottomNav favCount={favorites.length} />
    </div>
  );
}
