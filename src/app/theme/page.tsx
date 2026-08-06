"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FOODS } from "@/data/foods";
import { THEMES } from "@/data/themes";
import { ThemeTab } from "@/components/ThemeTab";
import { BottomNav } from "@/components/BottomNav";

import { loadDietSettings, applyDietFilter } from "@/lib/dietFilter";

function ThemeContent() {
  const searchParams = useSearchParams();
  const initialKey = searchParams.get("k") || "혼자";

  const [theme, setTheme] = useState(initialKey);
  const [favorites, setFavorites] = useState<number[]>([]);

  useEffect(() => {
    const k = searchParams.get("k");
    if (k) setTheme(k);
  }, [searchParams]);

  useEffect(() => {
    try {
      const savedFavs = localStorage.getItem("food_favorites");
      if (savedFavs) setFavorites(JSON.parse(savedFavs));
    } catch (e) {
      console.error(e);
    }
  }, []);

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

  const rawThemeFoods = FOODS.filter((f) => f.themes.includes(theme));
  const themeFoods = applyDietFilter(rawThemeFoods, loadDietSettings());

  return (
    <div className="app hasNav">
      <header className="pageHead">
        <Link href="/" className="pageBack" aria-label="홈으로">
          ←
        </Link>
        <h1 className="pageTitle">테마별 추천</h1>
      </header>

      <ThemeTab
        themes={THEMES}
        currentThemeKey={theme}
        onSelectTheme={setTheme}
        themeFoods={themeFoods}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
      />

      <BottomNav favCount={favorites.length} />
    </div>
  );
}

export default function ThemePage() {
  return (
    <Suspense fallback={<div className="app hasNav" />}>
      <ThemeContent />
    </Suspense>
  );
}
