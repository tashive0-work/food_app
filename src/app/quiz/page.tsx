"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppState } from "@/types/food";
import { QUESTIONS } from "@/data/questions";
import { classify, recommend } from "@/lib/recommend";
import { Quiz } from "@/components/Quiz";
import { BottomNav } from "@/components/BottomNav";
import { saveTodayResult } from "@/lib/todayResult";
import { logSession, logDiagnosis } from "@/lib/supabase";

export default function QuizPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState<number[]>([]);
  const [seed, setSeed] = useState(1);
  const [favorites, setFavorites] = useState<number[]>([]);

  useEffect(() => {
    try {
      const savedFavs = localStorage.getItem("food_favorites");
      if (savedFavs) setFavorites(JSON.parse(savedFavs));
    } catch (e) {
      console.error("Failed to load local storage:", e);
    }
  }, []);

  const state: AppState | null = useMemo(() => {
    if (picks.length < QUESTIONS.length) return null;
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
      const q = QUESTIONS[qidx];
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
    return st;
  }, [picks]);

  const verdict = useMemo(() => (state ? classify(state) : null), [state]);
  const done = picks.length === QUESTIONS.length;

  useEffect(() => {
    if (!done || !state || !verdict) return;

    const list = recommend(state, seed, {}, []);
    const topFoodName = list[0]?.name ?? "";

    saveTodayResult({
      picks,
      state,
      verdict,
      topFoodName,
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
  }, [done, state, verdict, picks, seed, router]);

  const answer = (i: number) => {
    setPicks((p) => [...p, i]);
    if (step < QUESTIONS.length - 1) setStep((s) => s + 1);
  };

  return (
    <div className="app hasNav">
      <header className="pageHead">
        <Link href="/" className="pageBack" aria-label="홈으로">
          ←
        </Link>
        <h1 className="pageTitle">상태 진단</h1>
      </header>

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
      </main>

      <BottomNav favCount={favorites.length} />
    </div>
  );
}
