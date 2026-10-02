"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { searchFoods } from "@/lib/search";
import { FoodCard } from "@/components/FoodCard";
import { BottomNav } from "@/components/BottomNav";
import { loadDietSettings, applyDietFilter } from "@/lib/dietFilter";
import { logInteraction, logMenuRequest } from "@/lib/supabase";
import { nearbyUrl, getCachedLocation, getCurrentLocation } from "@/lib/location";

const SUGGESTED = ["김치찌개","라면","비빔밥","떡볶이","마라탕","전복죽"];

/**
 * 「파는 곳 찾기」 줄의 스타일.
 * globals.css 가 아니라 이 파일 안에 둡니다 —
 * globals.css 는 다른 도구가 덮어쓰는 일이 잦아서, 여기 두면 같이 안 날아갑니다.
 */
const S: Record<string, React.CSSProperties> = {
  row: { margin: "12px 0 4px", display: "flex", flexDirection: "column", gap: 7 },
  btn: {
    display: "flex", alignItems: "center", gap: 11,
    padding: "13px 15px", borderRadius: 14,
    border: "1px solid #E5E8EB", background: "#fff",
    boxShadow: "0 1px 3px rgba(0,0,0,.05)",
    textDecoration: "none", color: "inherit",
  },
  icon: { fontSize: 18, flex: "none" },
  body: { flex: 1, minWidth: 0 },
  title: { display: "block", fontSize: 14, fontWeight: 700, color: "#191F28" },
  sub: { display: "block", fontSize: 12, color: "#8B95A1", marginTop: 2 },
  arrow: { flex: "none", fontSize: 15, fontWeight: 700, color: "#FF6B35" },
  loc: {
    alignSelf: "flex-start",
    padding: "7px 12px", borderRadius: 9999,
    border: "1.5px solid #E5E8EB", background: "#fff",
    fontSize: 12, fontWeight: 700, color: "#8B95A1",
    cursor: "pointer",
  },
};

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

  /**
   * 위치를 한 번 허용해 두면 주변 검색이 내 위치 기준으로 나갑니다.
   * 페이지를 열 때 권한을 묻지 않고, 사용자가 버튼을 눌렀을 때만 묻습니다.
   */
  const [hasLocation, setHasLocation] = useState(false);
  const [locBusy, setLocBusy] = useState(false);
  React.useEffect(() => {
    setHasLocation(!!getCachedLocation());
  }, []);
  const useMyLocation = async () => {
    setLocBusy(true);
    const c = await getCurrentLocation();
    setHasLocation(!!c);
    setLocBusy(false);
  };

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

  const typed = q.trim();

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

        {/* 메뉴 이름만 넣어도 바로 주변 식당을 찾을 수 있게. 검색 결과가 없어도 보입니다. */}
        {typed.length >= 2 && (
          <div style={S.row}>
            <a
              style={S.btn}
              href={nearbyUrl(typed)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => logInteraction(null, typed, 0, "map_click")}
            >
              <span style={S.icon} aria-hidden="true">📍</span>
              <span style={S.body}>
                <b style={S.title}>「{typed}」 파는 곳 찾기</b>
                <small style={S.sub}>
                  {hasLocation ? "내 위치 주변에서 찾아봅니다" : "네이버 지도에서 바로 찾아봅니다"}
                </small>
              </span>
              <span style={S.arrow} aria-hidden="true">→</span>
            </a>
            {!hasLocation && (
              <button
                type="button"
                style={{ ...S.loc, opacity: locBusy ? 0.6 : 1 }}
                onClick={useMyLocation}
                disabled={locBusy}
              >
                {locBusy ? "위치 확인 중…" : "📍 내 위치 기준으로 보기"}
              </button>
            )}
          </div>
        )}

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
