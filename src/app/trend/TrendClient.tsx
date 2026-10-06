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
import { logInteraction } from "@/lib/supabase";

const AXES = [
  {
    key: "ease", label: "빨리 되는", desc: "조리·대기 시간이 짧은 메뉴",
    tiers: { 4: "바로 되는", 3: "금방 되는", 2: "조금 걸리는" },
    tie: ["light", "comfort"],
  },
  {
    key: "light", label: "속 편한", desc: "소화 부담이 적은 메뉴",
    tiers: { 4: "아주 가벼운", 3: "가벼운 편", 2: "보통" },
    tie: ["ease", "comfort"],
  },
  {
    key: "fill", label: "든든한", desc: "포만감이 큰 메뉴",
    tiers: { 4: "아주 든든한", 3: "든든한 편", 2: "적당한" },
    tie: ["warm", "comfort"],
  },
  {
    key: "spice", label: "얼큰한", desc: "자극이 강한 메뉴",
    tiers: { 4: "아주 얼큰한", 3: "얼큰한 편", 2: "살짝 매운" },
    tie: ["warm", "fill"],
  },
] as const;

export default function TrendClient() {
  const [tab, setTab] = useState<"trend" | "ranking">("trend");
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [today, setToday] = useState<TodayResult | null>(null);
  const [axis, setAxis] = useState<string>("ease");
  const [favorites, setFavorites] = useState<number[]>([]);

  useEffect(() => {
    getTrends(20).then(setTrends);
    setToday(loadTodayResult());

    try {
      const saved = localStorage.getItem("food_favorites");
      if (saved) setFavorites(JSON.parse(saved));
    } catch {}
  }, []);

  const toggleFavByFoodName = (name: string) => {
    const target = FOODS.find((f) => f.name === name);
    if (!target) return;
    const isFav = favorites.includes(target.id);
    const next = isFav
      ? favorites.filter((id) => id !== target.id)
      : [...favorites, target.id];
    setFavorites(next);
    try {
      localStorage.setItem("food_favorites", JSON.stringify(next));
    } catch {}

    logInteraction(null, target.name, 0, isFav ? "unfavorite" : "favorite");
  };

  const matchedTrends = today ? matchTrendsToState(trends, today.state) : [];
  const topMatch = matchedTrends.length > 0 ? matchedTrends[0] : null;

  const currentAxis = AXES.find((a) => a.key === axis)!;
  const axisKey = currentAxis.key as "ease" | "light" | "fill" | "spice";

  const sorted = [...FOODS].sort((a, b) => {
    const diff = (b[axisKey] as number) - (a[axisKey] as number);
    if (diff !== 0) return diff;
    for (const t of currentAxis.tie) {
      const d = (b[t as keyof typeof b] as number) - (a[t as keyof typeof a] as number);
      if (d !== 0) return d;
    }
    return a.name.localeCompare(b.name, "ko");
  });
  const filtered = applyDietFilter(sorted, loadDietSettings());

  const tierGroups = ([4, 3, 2] as const)
    .map((score) => ({
      score,
      label: (currentAxis.tiers as Record<number, string>)[score],
      items: filtered.filter((f) => (f[axisKey] as number) === score).slice(0, 12),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="app hasNav">
      <main className="wrap">
        <header className="pageHead">
          <Link href="/" className="pageBack" aria-label="홈으로">
            ←
          </Link>
          <h1 className="pageTitle">트렌드 & 랭킹</h1>
        </header>

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

            <div className="trendList">
              {trends.map((t) => {
                const matchedFood = t.matched_food_name
                  ? FOODS.find((f) => f.name === t.matched_food_name)
                  : null;
                const isFav = matchedFood ? favorites.includes(matchedFood.id) : false;

                return (
                  <div key={t.id} className="trendCard">
                    <FoodImage
                      src={(matchedFood?.imageThumb || matchedFood?.image || t.image_url) ?? undefined}
                      name={t.name}
                      className="trendCardImg"
                      showLabel={false}
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
                          const SRC: Record<string, { cls: string; label: string }> = {
                            naver: { cls: "n", label: "네이버" },
                            youtube: { cls: "y", label: "유튜브" },
                            google: { cls: "g", label: "구글" },
                            curated: { cls: "g", label: "큐레이션" },
                          };
                          const meta = SRC[s];
                          if (!meta) return null;
                          return (
                            <span key={s} className={`srcBadge ${meta.cls}`}>
                              {meta.label}
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
                            className="btn btnSub sm"
                          >
                            레시피 보기
                          </a>
                          <a
                            href={mapUrl(t.matched_food_name)}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btnSub sm"
                          >
                            근처 식당
                          </a>
                          <button
                            onClick={() => toggleFavByFoodName(t.matched_food_name!)}
                            className={isFav ? "btn btnSub sm fav on" : "btn btnSub sm fav"}
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
                              className="btn btnSub sm"
                            >
                              레시피 검색
                            </a>
                            <a
                              href={mapUrl(t.name)}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btnSub sm"
                            >
                              근처 식당
                            </a>
                          </div>
                          <p className="trendNotInDb">메뉴 추가 예정</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
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
              <h2 className="secTitle">{currentAxis.label} 메뉴</h2>
              <p className="secSub">{currentAxis.desc}</p>
            </div>

            {tierGroups.length === 0 ? (
              <p className="rankEmpty">조건에 맞는 메뉴가 없어요</p>
            ) : (
              tierGroups.map((g) => (
                <section key={g.score} className="tierBlock">
                  <div className="tierHead">
                    <span className="tierLabel">{g.label}</span>
                    <span className="tierCount">{g.items.length}개</span>
                  </div>
                  <div className="rankList">
                    {g.items.map((f) => (
                      <Link
                        key={f.id}
                        href={`/food/${encodeURIComponent(f.name)}`}
                        className="rankItem"
                      >
                        <div className="rankItemMain">
                          <p className="rankItemName">{f.name}</p>
                          <p className="rankItemKind">{f.kind}</p>
                        </div>
                        <span className="rankItemGo" aria-hidden="true">›</span>
                      </Link>
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        )}
      </main>

      <BottomNav favCount={favorites.length} />
    </div>
  );
}
