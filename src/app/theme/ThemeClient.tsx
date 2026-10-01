"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FOODS } from "@/data/foods";
import { THEMES } from "@/data/themes";
import { ThemeTab } from "@/components/ThemeTab";
import { BottomNav } from "@/components/BottomNav";
import { loadDietSettings, applyDietFilter } from "@/lib/dietFilter";
import { sortThemeFoods, SortKey } from "@/lib/themeSort";

interface ThemeClientProps {
  initialKey: string;
}

function ThemeContent({ initialKey }: ThemeClientProps) {
  const searchParams = useSearchParams();
  const currentParam = searchParams.get("k") || initialKey || "혼자";

  const [theme, setTheme] = useState(currentParam);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [sort, setSort] = useState<SortKey>("relevant");

  useEffect(() => {
    const k = searchParams.get("k");
    if (k) {
      setTheme(k);
      setSort("relevant");
    }
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
  const themeFoods = sortThemeFoods(
    applyDietFilter(rawThemeFoods, loadDietSettings()),
    theme,
    sort
  );
  const curTheme = THEMES.find((t) => t.key === theme);

  return (
    <div className="app hasNav">
      <main className="wrap">
        <header className="pageHead">
          <Link href="/" className="pageBack" aria-label="홈으로">
            ←
          </Link>
          <h1 className="pageTitle">
            {curTheme ? `${curTheme.icon} ${curTheme.label} 메뉴 추천` : `${theme} 메뉴 추천`}
          </h1>
        </header>

        <ThemeTab
          themes={THEMES}
          currentThemeKey={theme}
          onSelectTheme={setTheme}
          themeFoods={themeFoods}
          sort={sort}
          onSelectSort={setSort}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
        />
      </main>

      <BottomNav favCount={favorites.length} />
    </div>
  );
}

export default function ThemeClient({ initialKey }: ThemeClientProps) {
  return (
    <Suspense fallback={<div className="app hasNav" />}>
      <ThemeContent initialKey={initialKey} />
    </Suspense>
  );
}
