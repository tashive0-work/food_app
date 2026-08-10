"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FOODS } from "@/data/foods";
import { BottomNav } from "@/components/BottomNav";
import { FoodImage } from "@/components/FoodImage";
import { loadDietSettings, applyDietFilter } from "@/lib/dietFilter";
import { loadTodayResult, TodayResult } from "@/lib/todayResult";
import { getTrends, matchTrendsToState } from "@/lib/trend";
import { recipeUrl, mapUrl } from "@/lib/recommend";
import { TrendItem } from "@/types/trend";

const AXES = [
  { key: "ease",  label: "빨리 되는 순", desc: "조리·대기 시간이 짧은 메뉴" },
  { key: "light", label: "속 편한 순",   desc: "소화 부담이 적은 메뉴" },
  { key: "fill",  label: "든든한 순",    desc: "포만감이 큰 메뉴" },
  { key: "spice", label: "얼큰한 순",    desc: "자극이 강한 메뉴" },
] as const;

export default function TrendPage() {
  const [tab, setTab] = useState<"trend" | "ranking">("trend");
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [today, setToday] = useState<TodayResult | null>(null);
  const [axis, setAxis] = useState<string>("ease");
  const [favorites, setFavorites] = useState<number[]>([]);

  useEffect(() => {
    getTrends(20).then(setTrends);
    setToday(loadTodayResult());

    try {
      const saved = localStorage.getItem("food_app_favorites");
      if (saved) setFavorites(JSON.parse(saved));
    } catch {}
  }, []);

  const toggleFavByFoodName = (name: string) => {
    const target = FOODS.find((f) => f.name === name);
    if (!target) return;
    let next: number[];
    if (favorites.includes(target.id)) {
      next = favorites.filter((id) => id !== target.id);
    } else {
      next = [...favorites, target.id];
    }
    setFavorites(next);
    try {
      localStorage.setItem("food_app_favorites", JSON.stringify(next));
    } catch {}
  };

  // 트렌드 매칭 1위
  const matchedTrends = today ? matchTrendsToState(trends, today.state) : [];
  const topMatch = matchedTrends.length > 0 ? matchedTrends[0] : null;

  // 랭킹 탭 데이터
  const currentAxis = AXES.find((a) => a.key === axis)!;
  const rawRankList = [...FOODS].sort(
    (a, b) => (b[axis as keyof typeof b] as number) - (a[axis as keyof typeof a] as number)
  );
  const rankList = applyDietFilter(rawRankList, loadDietSettings()).slice(0, 20);

  return (
    <div className="app hasNav">
      <main className="wrap">
        <header className="pageHead">
          <Link href="/" className="pageBack" aria-label="홈으로">
            ←
          </Link>
          <h1 className="pageTitle">트렌드 & 랭킹</h1>
        </header>

        {/* 상단 탭 2개 */}
        <div className="subTabs">
          <button
            className={tab === "trend" ? "subTab on" : "subTab"}
            onClick={() => setTab("trend")}
          >
            요즘 뜨는 메뉴
          </button>
          <button
            className={tab === "ranking" ? "subTab on" : "subTab"}
            onClick={() => setTab("ranking")}
          >
            편의도 랭킹
          </button>
        </div>

        {tab === "trend" ? (
          <div>
            {/* 진단 연동 카드 */}
            {today && topMatch ? (
              <div className="trendPick">
                <p className="trendPickLabel">오늘 상태에 맞는 트렌드</p>
                <p className="trendPickName">{topMatch.item.name}</p>
                <p className="trendPickMatch">
                  {topMatch.match}% 일치 · {today.verdict.title}
                </p>
                <p className="trendPickDesc">{topMatch.item.description}</p>
              </div>
            ) : (
              <div className="trendPick empty">
                <p className="trendPickLabel">오늘 상태를 알려주세요</p>
                <p className="trendPickDesc">
                  여덟 번만 답하면 지금 뜨는 메뉴 중에 오늘 상태에 맞는 것을 골라 드려요
                </p>
                <Link href="/quiz" className="btn btnMain">
                  진단 시작하기
                </Link>
              </div>
            )}

            {/* 트렌드 전체 리스트 */}
            <div className="trendList">
              {trends.map((t) => {
                const matchedFood = t.matched_food_name
                  ? FOODS.find((f) => f.name === t.matched_food_name)
                  : null;
                const isFav = matchedFood ? favorites.includes(matchedFood.id) : false;

                return (
                  <div key={t.id} className="trendCard">
                    <FoodImage
                      src={t.image_url ?? undefined}
                      name={t.name}
                      className="trendCardImg"
                    />
                    <div className="trendCardBody">
                      <div className="trendCardTop">
                        <h3 className="trendCardName">{t.name}</h3>
                        {t.kind && <span className="trendCardKind">{t.kind}</span>}
                      </div>
                      {t.description && (
                        <p className="trendCardDesc">{t.description}</p>
                      )}

                      <div className="trendCardMeta">
                        {t.rise_pct != null && (
                          <span className={t.rise_pct > 0 ? "trendUp" : "trendDown"}>
                            {t.rise_pct > 0 ? `+${Math.round(t.rise_pct)}%` : `${Math.round(t.rise_pct)}%`}
                          </span>
                        )}
                        {t.sources?.map((s) => {
                          const cls = s === "naver" ? "n" : s === "youtube" ? "y" : "g";
                          const label = s === "naver" ? "네이버" : s === "youtube" ? "유튜브" : "구글";
                          return (
                            <span key={s} className={`srcBadge ${cls}`}>
                              {label}
                            </span>
                          );
                        })}
                      </div>

                      {t.matched_food_name ? (
                        <div className="trendCardBtns">
                          <a
                            href={recipeUrl(t.matched_food_name)}
                            target="_blank"
                            rel="noreferrer"
                            className="btnSub sm"
                          >
                            레시피 보기
                          </a>
                          <a
                            href={mapUrl(t.matched_food_name)}
                            target="_blank"
                            rel="noreferrer"
                            className="btnSub sm"
                          >
                            근처 식당
                          </a>
                          <button
                            onClick={() => toggleFavByFoodName(t.matched_food_name!)}
                            className={isFav ? "btnSub sm fav on" : "btnSub sm fav"}
                          >
                            {isFav ? "♥ 찜함" : "♡ 찜하기"}
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="trendCardBtns">
                            <a
                              href={recipeUrl(t.name)}
                              target="_blank"
                              rel="noreferrer"
                              className="btnSub sm"
                            >
                              레시피 검색
                            </a>
                            <a
                              href={mapUrl(t.name)}
                              target="_blank"
                              rel="noreferrer"
                              className="btnSub sm"
                            >
                              근처 식당
                            </a>
                          </div>
                          <p className="trendNotInDb">아직 추천 메뉴에는 없어요</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* 편의도 랭킹 탭 */
          <div>
            <div className="chips" style={{ marginBottom: "20px" }}>
              {AXES.map((a) => (
                <button
                  key={a.key}
                  className={axis === a.key ? "chip on" : "chip"}
                  onClick={() => setAxis(a.key)}
                >
                  {a.label}
                </button>
              ))}
            </div>

            <div className="secHead">
              <h2 className="secTitle">{currentAxis.label}</h2>
              <p className="secSub">{currentAxis.desc}</p>
            </div>

            <div className="rankList">
              {rankList.map((f, i) => {
                const v = f[axis as keyof typeof f] as number;
                return (
                  <div key={f.id} className="rankItem">
                    <span className="rankItemNo">{i + 1}</span>
                    <div className="rankItemMain">
                      <p className="rankItemName">{f.name}</p>
                      <p className="rankItemKind">{f.kind}</p>
                    </div>
                    <div className="rankItemBar">
                      <div
                        className="rankItemFill"
                        style={{ width: `${(v / 4) * 100}%` }}
                      />
                    </div>
                    <span className="rankItemVal">{v}/4</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <BottomNav favCount={favorites.length} />
    </div>
  );
}
