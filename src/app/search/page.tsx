"use client";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import { searchFoods } from "@/lib/search";
import { FoodCard } from "@/components/FoodCard";
import { BottomNav } from "@/components/BottomNav";
import { loadDietSettings, applyDietFilter } from "@/lib/dietFilter";

const SUGGESTED = ["김치찌개","라면","비빔밥","떡볶이","마라탕","전복죽"];

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [favorites, setFavorites] = useState<number[]>([]);
  const [dietSettings, setDietSettings] = useState(() => loadDietSettings());
  const rawResults = useMemo(() => searchFoods(q), [q]);
  const results = useMemo(() => applyDietFilter(rawResults, dietSettings), [rawResults, dietSettings]);

  React.useEffect(() => {
    try {
      const f = localStorage.getItem("food_favorites");
      if (f) setFavorites(JSON.parse(f));
    } catch (e) { console.error(e); }
  }, []);

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      try { localStorage.setItem("food_favorites", JSON.stringify(next)); } catch (e) { console.error(e); }
      return next;
    });
  };

  return (
    <div className="app hasNav">
      <header className="pageHead">
        <Link href="/" className="pageBack" aria-label="홈으로">←</Link>
        <h1 className="pageTitle">메뉴 검색</h1>
      </header>
      <main className="wrap">
        <div className="searchBox">
          <svg className="searchIcon" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>
          </svg>
          <input
            className="searchInput"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="메뉴 이름, 분류, 상황으로 검색"
            autoComplete="off"
            aria-label="메뉴 검색"
          />
          {q && (
            <button className="searchClear" onClick={() => setQ("")} aria-label="검색어 지우기">×</button>
          )}
        </div>

        {!q && (
          <div className="searchSuggest">
            <p className="searchSuggestLabel">이런 메뉴는 어때요</p>
            <div className="chips">
              {SUGGESTED.map((s) => (
                <button key={s} className="chip" onClick={() => setQ(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {q && results.length === 0 && (
          <div className="emptyState">
            <p className="emptyTitle">검색 결과가 없어요</p>
            <p className="emptyDesc">
              다른 이름으로 찾아보시거나, 진단을 통해 추천받아 보세요
            </p>
            <Link href="/quiz" className="btn btnMain">진단 시작하기</Link>
          </div>
        )}

        {q && results.length > 0 && (
          <>
            <div className="secHead">
              <p className="secSub">{results.length}개 찾았어요</p>
            </div>
            <div className="grid">
              {results.map((f) => (
                <FoodCard
                  key={f.id}
                  food={f}
                  rank={0}
                  isFavorite={favorites.includes(f.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          </>
        )}
      </main>
      <BottomNav favCount={favorites.length} />
    </div>
  );
}
