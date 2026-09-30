"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppState } from "@/types/food";
import { QUESTIONS, FAST_QUESTIONS, FAST_SKIP_AXES } from "@/data/questions";
import { classify, recommend, estimateWarm } from "@/lib/recommend";
import { Quiz } from "@/components/Quiz";
import { BottomNav } from "@/components/BottomNav";
import { Mascot } from "@/components/Mascot";
import { saveTodayResult } from "@/lib/todayResult";
import { logSession, logDiagnosis } from "@/lib/supabase";

export default function QuizPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState<number[]>([]);
  // 진단할 때마다 새로 뽑습니다. 이 값이 고정이면 같은 답을 한 사람은 늘 같은 결과를 받습니다.
  const [seed] = useState(() => Math.floor(Math.random() * 1_000_000));
  const [fastMode, setFastMode] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);

  const activeQuestions = fastMode ? FAST_QUESTIONS : QUESTIONS;

  useEffect(() => {
    try {
      const savedFavs = localStorage.getItem("food_favorites");
      if (savedFavs) setFavorites(JSON.parse(savedFavs));
    } catch (e) {
      console.error("Failed to load local storage:", e);
    }
  }, []);

  const state: AppState | null = useMemo(() => {
    if (picks.length < activeQuestions.length) return null;
    let st: AppState = {
      hunger: 2,
      energy: 2,
      spice: 2,
      comfort: 2,
      time: 2,
      warm: 2,
      social: "미정",
    };
    picks.forEach((idx, qidx) => {
      const q = activeQuestions[qidx];
      const eff = q?.a[idx]?.[1];
      if (!eff) return;
      if (eff.set) {
        Object.entries(eff.set).forEach(([k, v]) => {
          st[k] = v;
        });
      }
      if (eff.add) {
        Object.entries(eff.add).forEach(([k, v]) => {
          const prev = typeof st[k] === "number" ? (st[k] as number) : 0;
          st[k] = Math.max(0, Math.min(4, prev + (v as number)));
        });
      }
    });
    // 빠른 모드에서는 온기를 묻지 않으므로 계절·시각으로 계산합니다.
    if (fastMode) st.warm = estimateWarm();
    return st;
  }, [picks, activeQuestions, fastMode]);

  const verdict = useMemo(() => (state ? classify(state) : null), [state]);
  const done = picks.length === activeQuestions.length;

  useEffect(() => {
    if (!done || !state || !verdict) return;

    const list = recommend(state, seed, {}, [], fastMode ? FAST_SKIP_AXES : []);
    const topFoodName = list[0]?.name ?? "";

    saveTodayResult({
      picks,
      state,
      verdict,
      topFoodName,
      seed,
      fast: fastMode,
    });

    (async () => {
      try {
        const sessId = await logSession();
        const diagId = await logDiagnosis(sessId, picks, state, verdict.title);
        if (diagId) localStorage.setItem("food_last_diagnosis_id", diagId);
      } catch (e) {
        console.error("Log error:", e);
      }
    })();

    router.push("/result");
  }, [done, state, verdict, picks, seed, fastMode, router]);

  const answer = (i: number) => {
    setPicks((p) => [...p, i]);
    if (step < activeQuestions.length - 1) setStep((s) => s + 1);
  };

  return (
    <div className="app hasNav">
      <main className="wrap">
        <header className="pageHead" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Link href="/" className="pageBack" aria-label="홈으로">
              ←
            </Link>
            <h1 className="pageTitle">상태 진단</h1>
          </div>
        </header>

        {!done && (
          <Quiz
            questions={activeQuestions}
            step={step}
            fastMode={fastMode}
            onSwitchFast={step === 0 && picks.length === 0 ? () => setFastMode(true) : undefined}
            onAnswer={answer}
            onBack={() => {
              setPicks((p) => p.slice(0, -1));
              setStep((s) => s - 1);
            }}
          />
        )}
      </main>

      <BottomNav favCount={favorites.length} />
    </div>
  );
}
