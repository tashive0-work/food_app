"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { searchFoods } from "@/lib/search";
import { FoodCard } from "@/components/FoodCard";
import { BottomNav } from "@/components/BottomNav";
import { loadDietSettings, applyDietFilter } from "@/lib/dietFilter";
import { logInteraction, logMenuRequest } from "@/lib/supabase";

const SUGGESTED = ["김치찌개","라면","비빔밥","떡볶이","마라탕","전복죽"];

export default function SearchClient() {
  const [q, setQ] = useState("");
  const [favorites, setFavorites] = useState<number[]>([]);
  const [dietSettings] = useState(() => loadDietSettings());
  const rawResults = useMemo(() => searchFoods(q), [q]);
  const results = useMemo(() => applyDietFilter(rawResults, dietSettings), [rawResults, dietSettings]);

  React.useEffect(() => {
    try {
      const f = localStorage.getItem("food_favorites");
      if (f) setFavorites(JSON.parse(f));
    } catch (e) { console.error(e); }
  }, []);

  React.useEffect(() => {
    const trimmed = q.trim();
    if (trimmed.length < 2) return;
    const timer = setTimeout(() => {
      logInteraction(null, trimmed, 0, "search");
      if (rawResults.length === 0) logMenuRequest(trimmed, "search");
    }, 800);
    return () => clearTimeout(timer);
  }, [q, rawResults.length]);

  const [requested, setRequested] = useState<string[]>([]);
  const requestMenu = () => {
    const trimmed = q.trim();
    if (!trimmed || requested.includes(trimmed)) return;
    logMenuRequest(trimmed, "user");
    setRequested((prev) => [...prev, trimmed]);
  };

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      try { localStorage.setItem("food_favorites", JSON.stringify(next)); } catch (e) { console.error(e); }
      return next;
    });
  };

  return (
    <div className="app hasNav">
      <main className="wrap">
        <header className="pageHead">
          <Link href="/" className="pageBack" aria-label="홈으로">←</Link>
          <h1 className="pageTitle">메뉴 검색</h1>
        </header>

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
              아직 못 담은 메뉴일 수 있어요. 알려주시면 채워 넣겠습니다.
            </p>
            {requested.includes(q.trim()) ? (
              <p className="reqDone">
                「{q.trim()}」 알려주셔서 고맙습니다. 곧 넣어둘게요.
              </p>
            ) : (
              <button type="button" className="btn btnMain" onClick={requestMenu}>
                「{q.trim()}」 추가해 주세요
              </button>
            )}
            <Link href="/quiz" className="btn btnGhostLink">진단으로 추천받기</Link>
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
