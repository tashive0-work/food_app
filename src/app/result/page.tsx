"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { AppState } from "@/types/food";
import { classify, recommend } from "@/lib/recommend";
import { FoodCard } from "@/components/FoodCard";
import { HeroCard } from "@/components/HeroCard";
import { Receipt } from "@/components/Receipt";
import { BottomNav } from "@/components/BottomNav";
import { AiReRecommendInput } from "@/components/AiReRecommendInput";
import { loadTodayResult, clearTodayResult, TodayResult } from "@/lib/todayResult";
import { loadDietSettings, DietSettings } from "@/lib/dietFilter";

const StateRadarChart = dynamic(() => import("@/components/StateRadarChart"), {
  ssr: false,
  loading: () => <div style={{ height: "260px" }} />,
});

export default function ResultPage() {
  const router = useRouter();
  const [todayResult, setTodayResult] = useState<TodayResult | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [seed, setSeed] = useState(1);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [aiDelta, setAiDelta] = useState<Record<string, number>>({});
  const [excludeFoods, setExcludeFoods] = useState<string[]>([]);
  const [diagnosisId, setDiagnosisId] = useState<string | null>(null);
  const [dietSettings, setDietSettings] = useState<DietSettings>({ allergens: [], diets: [] });

  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDietSettings(loadDietSettings());
    try {
      const savedFavs = localStorage.getItem("food_favorites");
      if (savedFavs) setFavorites(JSON.parse(savedFavs));

      const lastDiagId = localStorage.getItem("food_last_diagnosis_id");
      if (lastDiagId) setDiagnosisId(lastDiagId);
    } catch (e) {
      console.error(e);
    }

    const res = loadTodayResult();
    setTodayResult(res);
    setIsLoaded(true);
  }, []);

  const activeCount = dietSettings.allergens.length + dietSettings.diets.length;

  const toggleFavorite = (foodId: number) => {
    setFavorites((prev) => {
      const next = prev.includes(foodId) ? prev.filter((id) => id !== foodId) : [...prev, foodId];
      try {
        localStorage.setItem("food_favorites", JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const state: AppState | null = todayResult?.state ?? null;
  const verdict = todayResult?.verdict ?? (state ? classify(state) : null);

  const list = useMemo(
    () => (state ? recommend(state, seed, aiDelta, excludeFoods) : []),
    [state, seed, aiDelta, excludeFoods]
  );

  const now = new Date();
  const stamp = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(
    now.getDate()
  ).padStart(2, "0")}  ${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;

  const handleApplyAiDelta = (delta: Record<string, number>, excludes: string[]) => {
    setAiDelta(delta);
    setExcludeFoods(excludes);
  };

  const restart = () => {
    clearTodayResult();
    router.push("/quiz");
  };

  const chartData = state
    ? [
        { axis: "허기", v: state.hunger },
        { axis: "기력", v: state.energy },
        { axis: "자극", v: state.spice },
        { axis: "위로", v: state.comfort },
        { axis: "여유", v: state.time },
        { axis: "온기", v: state.warm },
      ]
    : [];

  if (!isLoaded) {
    return <div className="app hasNav" />;
  }

  return (
    <div className="app hasNav">
      <header className="pageHead">
        <Link href="/" className="pageBack" aria-label="홈으로">
          ←
        </Link>
        <h1 className="pageTitle">진단 결과</h1>
      </header>

      <main className="wrap">
        {!todayResult || !state || !verdict ? (
          <div className="emptyState">
            <p className="emptyTitle">아직 오늘 진단을 하지 않았어요</p>
            <p className="emptyDesc">여덟 번만 답하면 지금 상태에 맞는 메뉴를 골라 드려요</p>
            <Link href="/quiz" className="btn btnMain">
              진단 시작하기
            </Link>
          </div>
        ) : (
          <div ref={resultRef} aria-live="polite" aria-atomic="true">
            {activeCount > 0 && (
              <Link href="/settings" className="dietBadge">
                제외 조건 {activeCount}개 적용 중
              </Link>
            )}

            {list[0]?.filterWarning && (
              <div className="legalNotice" style={{ marginBottom: "16px" }}>
                <p>{list[0].filterWarning}</p>
              </div>
            )}

            {list[0] && (
              <div className="verdictBanner">
                <p className="verdictBannerLabel">오늘의 결론</p>
                <p className="verdictBannerFood">{list[0].name}</p>
                <p className="verdictBannerLine">{verdict.line}</p>
              </div>
            )}

            <Receipt state={state} verdict={verdict} stamp={stamp} />

            <section className="chartBox">
              <h2 className="secTitle">상태 그래프</h2>
              <div className="chart">
                <StateRadarChart data={chartData} />
              </div>
            </section>

            <section>
              <div className="secHead">
                <h2 className="secTitle">오늘은 이걸 추천해요</h2>
                <p className="secSub">지금 상태에 가장 잘 맞는 메뉴예요.</p>
              </div>

              {/* 1위 — 큰 카드 */}
              {list[0] && (
                <HeroCard
                  food={list[0]}
                  state={state}
                  isFavorite={favorites.includes(list[0].id)}
                  onToggleFavorite={toggleFavorite}
                  diagnosisId={diagnosisId}
                />
              )}

              {/* 2·3위 — 중간 카드 */}
              {list.length > 1 && (
                <>
                  <div className="secHead secHeadSm">
                    <h3 className="secTitleSm">다른 선택지</h3>
                  </div>
                  <div className="subGrid">
                    {list.slice(1, 3).map((f, i) => (
                      <FoodCard
                        key={f.id}
                        food={f}
                        rank={i + 2}
                        state={state}
                        isFavorite={favorites.includes(f.id)}
                        onToggleFavorite={toggleFavorite}
                        diagnosisId={diagnosisId}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* 나머지 — 접힘 */}
              {!expanded ? (
                <button className="more" onClick={() => setExpanded(true)}>
                  나머지 {Math.max(0, list.length - 3)}개 더 보기
                </button>
              ) : (
                <>
                  <div className="secHead secHeadSm">
                    <h3 className="secTitleSm">전체 목록</h3>
                  </div>
                  <div className="grid">
                    {list.slice(3).map((f, i) => (
                      <FoodCard
                        key={f.id}
                        food={f}
                        rank={i + 4}
                        state={state}
                        isFavorite={favorites.includes(f.id)}
                        onToggleFavorite={toggleFavorite}
                        diagnosisId={diagnosisId}
                      />
                    ))}
                  </div>
                  <button className="more" onClick={() => setExpanded(false)}>
                    접기
                  </button>
                </>
              )}

              <AiReRecommendInput currentScores={state} onApplyDelta={handleApplyAiDelta} />

              <button className="restart" onClick={restart}>
                다시 진단하기
              </button>
            </section>
          </div>
        )}
      </main>

      <BottomNav favCount={favorites.length} />
    </div>
  );
}
