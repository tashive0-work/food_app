"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { AppState } from "@/types/food";
import { FOODS } from "@/data/foods";
import { QUESTIONS } from "@/data/questions";
import { THEMES } from "@/data/themes";
import { classify, recommend } from "@/lib/recommend";
import { FoodCard } from "@/components/FoodCard";
import { Receipt } from "@/components/Receipt";
import { Quiz } from "@/components/Quiz";
import { ThemeTab } from "@/components/ThemeTab";
import { AiReRecommendInput } from "@/components/AiReRecommendInput";
import { logSession, logDiagnosis } from "@/lib/supabase";

// Recharts 동적 임포트 (SSR hydration 방지 및 초기 번들 최적화)
const StateRadarChart = dynamic(() => import("@/components/StateRadarChart"), {
  ssr: false,
  loading: () => <div style={{ height: "260px" }} />,
});

export default function App() {
  const [tab, setTab] = useState<"check" | "theme" | "favorites">("check");
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState<number[]>([]);
  const [shown, setShown] = useState(10);
  const [seed, setSeed] = useState(1);
  const [theme, setTheme] = useState("혼자");
  const [stamp, setStamp] = useState("");
  const [favorites, setFavorites] = useState<number[]>([]);
  const [aiDelta, setAiDelta] = useState<Record<string, number>>({});
  const [excludeFoods, setExcludeFoods] = useState<string[]>([]);
  const [diagnosisId, setDiagnosisId] = useState<string | null>(null);

  const resultRef = useRef<HTMLDivElement>(null);

  // 로컬 스토리지에서 즐겨찾기 로드 (재방문 복원은 해제)
  useEffect(() => {
    try {
      const savedFavs = localStorage.getItem("food_favorites");
      if (savedFavs) setFavorites(JSON.parse(savedFavs));
    } catch (e) {
      console.error("Failed to load local storage:", e);
    }
  }, []);

  useEffect(() => {
    const now = new Date();
    setStamp(
      `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(
        now.getDate()
      ).padStart(2, "0")}  ${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}`
    );
  }, []);

  const toggleFavorite = (foodId: number) => {
    setFavorites((prev) => {
      const next = prev.includes(foodId) ? prev.filter((id) => id !== foodId) : [...prev, foodId];
      try {
        localStorage.setItem("food_favorites", JSON.stringify(next));
      } catch (e) {
        console.error("Failed to save favorites:", e);
      }
      return next;
    });
  };

  const done = picks.length === QUESTIONS.length;

  const state = useMemo(() => {
    if (!done) return null;
    const s: AppState = {
      hunger: 2,
      energy: 2,
      spice: 2,
      comfort: 2,
      time: 2,
      warm: 2,
      social: "미정",
      ageGroup: "unknown",
    };
    const effects = picks.map((p, i) => QUESTIONS[i].a[p][1]);
    effects.forEach((e) => {
      Object.assign(s, e.set || {});
      Object.entries(e.add || {}).forEach(([k, v]) => {
        if (typeof s[k] === "number") {
          (s[k] as number) += v;
        }
      });
    });
    ["hunger", "energy", "spice", "comfort", "time", "warm"].forEach((k) => {
      s[k] = Math.max(0, Math.min(4, Math.round(s[k] as number)));
    });
    return s;
  }, [picks, done]);

  const verdict = useMemo(() => (state ? classify(state) : null), [state]);
  const list = useMemo(
    () => (state ? recommend(state, seed, aiDelta, excludeFoods) : []),
    [state, seed, aiDelta, excludeFoods]
  );

  // Fire-and-forget Supabase logging when diagnosis completes
  useEffect(() => {
    if (done && state && verdict) {
      if (resultRef.current) {
        resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      // Fire and forget logging
      (async () => {
        const sessId = await logSession();
        const diagId = await logDiagnosis(sessId, picks, state, verdict.title);
        setDiagnosisId(diagId);
      })();
    }
  }, [done, state, verdict, picks]);

  const answer = (i: number) => {
    const nextPicks = [...picks, i];
    setPicks(nextPicks);
    setStep((s) => s + 1);
  };

  const restart = () => {
    setPicks([]);
    setStep(0);
    setShown(10);
    setSeed((s) => s + 1);
    setAiDelta({});
    setExcludeFoods([]);
    setDiagnosisId(null);
  };

  const handleApplyAiDelta = (delta: Record<string, number>, excludes: string[]) => {
    setAiDelta(delta);
    setExcludeFoods(excludes);
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

  const themeFoods = FOODS.filter((f) => f.themes.includes(theme));
  const favoriteFoods = FOODS.filter((f) => favorites.includes(f.id));

  return (
    <div className="app">
      <header className="hero">
        <div className="heroInner">
          <p className="eyebrow">매일 하는 그 고민</p>
          <h1>
            오늘<br />
            뭐 먹지
          </h1>
          <p className="sub">지금 상태를 일곱 번만 답해주세요. 나머지는 저희가 정할게요.</p>
        </div>
      </header>

      <div className="tabsBg">
        <nav className="tabs" role="tablist">
          <button
            role="tab"
            aria-selected={tab === "check"}
            className={tab === "check" ? "tab on" : "tab"}
            onClick={() => setTab("check")}
          >
            상태 진단
          </button>
          <button
            role="tab"
            aria-selected={tab === "theme"}
            className={tab === "theme" ? "tab on" : "tab"}
            onClick={() => setTab("theme")}
          >
            테마별 추천
          </button>
          <button
            role="tab"
            aria-selected={tab === "favorites"}
            className={tab === "favorites" ? "tab on" : "tab"}
            onClick={() => setTab("favorites")}
          >
            찜한 메뉴 ({favorites.length})
          </button>
        </nav>
      </div>

      {tab === "check" && (
        <main className="wrap">
          {!done && (
            <Quiz
              questions={QUESTIONS}
              step={step}
              onAnswer={answer}
              onBack={() => {
                setPicks((p) => p.slice(0, -1));
                setStep((s) => s - 1);
              }}
            />
          )}

          {done && state && verdict && (
            <div ref={resultRef} aria-live="polite" aria-atomic="true">
              <Receipt state={state} verdict={verdict} stamp={stamp} />

              <section className="chartBox">
                <h2 className="secTitle">상태 그래프</h2>
                <div className="chart">
                  <StateRadarChart data={chartData} />
                </div>
              </section>

              <section>
                <div className="secHead">
                  <h2 className="secTitle">이런 분들께는 이런 음식</h2>
                  <p className="secSub">잘 맞는 순서대로 30가지를 골랐어요.</p>
                </div>
                <div className="grid">
                  {list.slice(0, shown).map((f, i) => (
                    <FoodCard
                      key={f.id}
                      food={f}
                      rank={i + 1}
                      isFavorite={favorites.includes(f.id)}
                      onToggleFavorite={toggleFavorite}
                      diagnosisId={diagnosisId}
                    />
                  ))}
                </div>
                {shown < 30 ? (
                  <button className="more" onClick={() => setShown((s) => Math.min(30, s + 10))}>
                    10개 더 보기 <span className="moreCount">({shown}/30)</span>
                  </button>
                ) : (
                  <p className="endNote">30가지를 다 봤어요.</p>
                )}

                <AiReRecommendInput currentScores={state} onApplyDelta={handleApplyAiDelta} />

                <button className="restart" onClick={restart}>
                  다시 진단하기
                </button>
              </section>
            </div>
          )}
        </main>
      )}

      {tab === "theme" && (
        <ThemeTab
          themes={THEMES}
          currentThemeKey={theme}
          onSelectTheme={setTheme}
          themeFoods={themeFoods}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
        />
      )}

      {tab === "favorites" && (
        <main className="wrap">
          <div className="secHead" style={{ marginTop: 0 }}>
            <h2 className="secTitle">내가 찜한 메뉴 목록</h2>
            <p className="secSub">하트 버튼을 눌러 보관해 둔 음식 모음입니다.</p>
          </div>
          {favoriteFoods.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--dim)" }}>
              아직 찜한 메뉴가 없어요. 마음에 드는 음식 옆 하트를 눌러보세요.
            </div>
          ) : (
            <div className="grid">
              {favoriteFoods.map((f, i) => (
                <FoodCard
                  key={f.id}
                  food={f}
                  rank={i + 1}
                  isFavorite={true}
                  onToggleFavorite={toggleFavorite}
                  diagnosisId={diagnosisId}
                />
              ))}
            </div>
          )}
        </main>
      )}

      <footer className="foot">
        <div className="footLinks">
          <Link href="/terms">이용약관</Link>
          <Link href="/privacy">개인정보 처리방침</Link>
        </div>
        <p>레시피는 만개의레시피, 식당은 네이버 지도로 연결됩니다.</p>
        <p className="footDim">
          추천 로직은 규칙 기반 점수 모델입니다. 사용 기록이 쌓이면 개인화 학습으로 넘어갑니다.
        </p>
        <p className="footDim">
          추천 결과는 참고용 정보이며 의학적·영양학적 조언이 아닙니다.
        </p>
      </footer>
    </div>
  );
}
