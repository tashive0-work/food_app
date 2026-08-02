import React from "react";
import { Food, ThemeItem } from "@/types/food";
import { FoodCard } from "./FoodCard";

interface ThemeTabProps {
  themes: ThemeItem[];
  currentThemeKey: string;
  onSelectTheme: (key: string) => void;
  themeFoods: Food[];
  favorites: number[];
  onToggleFavorite?: (foodId: number) => void;
}

export function ThemeTab({
  themes,
  currentThemeKey,
  onSelectTheme,
  themeFoods,
  favorites,
  onToggleFavorite,
}: ThemeTabProps) {
  const currentTheme = themes.find((t) => t.key === currentThemeKey);

  return (
    <main className="wrap">
      <div className="chips">
        {themes.map((t) => (
          <button
            key={t.key}
            className={currentThemeKey === t.key ? "chip on" : "chip"}
            onClick={() => onSelectTheme(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="secHead">
        <h2 className="secTitle">{currentTheme?.label}</h2>
        <p className="secSub">{currentTheme?.desc}</p>
      </div>
      <div className="grid">
        {themeFoods.map((f, i) => (
          <FoodCard
            key={f.id}
            food={f}
            rank={i + 1}
            isFavorite={favorites.includes(f.id)}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    </main>
  );
}
