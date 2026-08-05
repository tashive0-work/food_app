import React, { useState } from "react";
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
  const [limit, setLimit] = useState(12);
  const currentTheme = themes.find((t) => t.key === currentThemeKey);

  const handleSelectTheme = (key: string) => {
    setLimit(12);
    onSelectTheme(key);
  };

  return (
    <main className="wrap">
      <div className="chips">
        {themes.map((t) => (
          <button
            key={t.key}
            className={currentThemeKey === t.key ? "chip on" : "chip"}
            onClick={() => handleSelectTheme(t.key)}
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
        {themeFoods.slice(0, limit).map((f) => (
          <FoodCard
            key={f.id}
            food={f}
            rank={0}
            isFavorite={favorites.includes(f.id)}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
      {themeFoods.length > limit && (
        <button className="more" onClick={() => setLimit((prev) => prev + 12)}>
          더 보기 <span className="moreCount">({themeFoods.length - limit}개 남음)</span>
        </button>
      )}
    </main>
  );
}
