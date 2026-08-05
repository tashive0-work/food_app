"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FOODS } from "@/data/foods";
import { FoodCard } from "@/components/FoodCard";
import { BottomNav } from "@/components/BottomNav";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<number[]>([]);

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

  const favoriteFoods = FOODS.filter((f) => favorites.includes(f.id));

  return (
    <div className="app hasNav">
      <header className="pageHead">
        <Link href="/" className="pageBack" aria-label="홈으로">
          ←
        </Link>
        <h1 className="pageTitle">찜한 메뉴</h1>
      </header>

      <main className="wrap">
        <div className="secHead" style={{ marginTop: 0 }}>
          <h2 className="secTitle">내가 찜한 메뉴 목록</h2>
          <p className="secSub">하트 버튼을 눌러 보관해 둔 음식 모음입니다.</p>
        </div>

        {favoriteFoods.length === 0 ? (
          <div className="emptyState">
            <p className="emptyTitle">아직 찜한 메뉴가 없어요</p>
            <p className="emptyDesc">마음에 드는 음식 옆 찜하기 버튼을 눌러보세요.</p>
            <Link href="/theme" className="btn btnMain">
              테마별 추천 둘러보기
            </Link>
          </div>
        ) : (
          <div className="grid">
            {favoriteFoods.map((f) => (
              <FoodCard
                key={f.id}
                food={f}
                rank={0}
                isFavorite={true}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}
      </main>

      <BottomNav favCount={favorites.length} />
    </div>
  );
}
