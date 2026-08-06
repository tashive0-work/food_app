"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FOODS } from "@/data/foods";
import { THEMES } from "@/data/themes";
import { FOOD_IMAGES } from "@/data/foodImages";
import { BottomNav } from "@/components/BottomNav";
import { FoodImage } from "@/components/FoodImage";
import { loadTodayResult, TodayResult } from "@/lib/todayResult";
import { getPopularFoods, PopularResult } from "@/lib/popular";
import { getTrends } from "@/lib/trend";
import { TrendItem } from "@/types/trend";

export default function Home() {
  const [favorites, setFavorites] = useState<number[]>([]);
  const [today, setToday] = useState<TodayResult | null>(null);
  const [greeting, setGreeting] = useState("");
  const [dateLabel, setDateLabel] = useState("");
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [popularData, setPopularData] = useState<PopularResult>({
    foods: [...FOODS].sort((a,b)=>(b.ease+b.light)-(a.ease+a.light)).slice(0,8),
    isRealData: false,
    label: "간편하게 먹기 좋은 메뉴",
  });

  useEffect(() => {
    try {
      const f = localStorage.getItem("food_favorites");
      if (f) setFavorites(JSON.parse(f));
    } catch (e) {
      console.error(e);
    }
    setToday(loadTodayResult());

    getPopularFoods().then((res) => setPopularData(res));
    getTrends(8).then((res) => setTrends(res));

    const now = new Date();
    const h = now.getHours();
    setGreeting(
      h < 11 ? "좋은 아침이에요" : h < 17 ? "점심 드셨어요?" : "오늘 하루 어땠어요?"
    );
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    setDateLabel(
      `${now.getMonth() + 1}월 ${now.getDate()}일 ${days[now.getDay()]}요일`
    );
  }, []);

  const favoriteFoods = FOODS.filter((f) => favorites.includes(f.id)).slice(0, 6);

  return (
    <div className="app hasNav">
      <main className="wrap">
        <header className="homeHead">
          <div className="homeHeadRow">
            <Link href="/" className="brandRow" style={{ marginBottom: 0 }}>
              <span className="brandMark" aria-hidden="true">오늘</span>
              <span className="brandName">오늘 뭐 먹지?</span>
            </Link>
            <Link href="/settings" className="settingsBtn" aria-label="설정">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </Link>
          </div>
          <p className="homeDate">{dateLabel}</p>
          <h1 className="homeGreet">{greeting}</h1>
        </header>

        {/* 메뉴 검색 진입점 */}
        <Link href="/search" className="searchEntry">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>
          </svg>
          <span>먹고 싶은 메뉴가 있나요?</span>
        </Link>

        {/* 오늘의 결론 (진단 완료 시) */}
        {today && (
          <Link href="/result" className="todayCard">
            <span className="todayCardLabel">오늘의 결론</span>
            <span className="todayCardFood">{today.topFoodName}</span>
            <span className="todayCardVerdict">{today.verdict.title}</span>
            <span className="todayCardMore">결과 다시 보기 →</span>
          </Link>
        )}

        {/* 진단 시작 CTA */}
        <Link href="/quiz" className={today ? "startCard sub" : "startCard"}>
          <div className="startCardText">
            <p className="startCardTitle">
              {today ? "다시 진단해 볼까요?" : "오늘 뭐 먹지?"}
            </p>
            <p className="startCardDesc">
              여덟 번만 답하면 지금 상태에 맞는 메뉴를 골라 드려요
            </p>
          </div>
          <span className="startCardArrow" aria-hidden="true">→</span>
        </Link>

        {/* 요즘 뜨는 메뉴 트렌드 섹션 */}
        {trends.length > 0 && (
          <section className="homeSec">
            <div className="homeSecHead">
              <h2>요즘 뜨는 메뉴</h2>
              <Link href="/trend" className="homeSecMore">
                전체 보기
              </Link>
            </div>
            <div className="hScroll">
              {trends.map((t) => (
                <Link key={t.id} href="/trend" className="miniCard">
                  <div className="miniCardImg">
                    <FoodImage
                      src={t.image_url ?? undefined}
                      name={t.name}
                    />
                    {t.rise_pct != null && t.rise_pct > 0 && (
                      <span className="trendRise">+{Math.round(t.rise_pct)}%</span>
                    )}
                  </div>
                  <p className="miniCardName">{t.name}</p>
                  <p className="miniCardKind">{t.kind}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 인기 메뉴 가로 스크롤 */}
        <section className="homeSec">
          <div className="homeSecHead">
            <h2>
              {popularData.label}
              {popularData.isRealData && <span className="liveBadge">실시간</span>}
            </h2>
          </div>
          <div className="hScroll">
            {popularData.foods.map((f) => {
              return (
                <Link key={f.id} href="/theme" className="miniCard">
                  <FoodImage
                    src={FOOD_IMAGES[f.name]?.url}
                    name={f.name}
                    className="miniCardImg"
                  />
                  <p className="miniCardName">{f.name}</p>
                  <p className="miniCardKind">{f.kind}</p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* 테마 바로가기 */}
        <section className="homeSec">
          <div className="homeSecHead">
            <h2>이럴 땐 이런 메뉴</h2>
            <Link href="/theme" className="homeSecMore">
              전체 보기
            </Link>
          </div>
          <div className="themeGrid">
            {THEMES.map((t) => (
              <Link key={t.key} href={`/theme?k=${t.key}`} className="themeTile">
                <span className="themeTileIcon" aria-hidden="true">
                  {t.icon}
                </span>
                <span className="themeTileLabel">{t.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* 편의도 랭킹 CTA */}
        <section className="homeSec">
          <Link href="/trend" className="startCard sub">
            <div className="startCardText">
              <p className="startCardTitle">편의도 랭킹 🏆</p>
              <p className="startCardDesc">
                조리·소화·포만·자극 축별로 메뉴 순위를 비교해 보세요
              </p>
            </div>
            <span className="startCardArrow" aria-hidden="true">→</span>
          </Link>
        </section>

        {/* 최근 찜 */}
        {favoriteFoods.length > 0 && (
          <section className="homeSec">
            <div className="homeSecHead">
              <h2>내가 찜한 메뉴</h2>
              <Link href="/favorites" className="homeSecMore">
                전체 보기
              </Link>
            </div>
            <div className="hScroll">
              {favoriteFoods.map((f) => (
                <Link key={f.id} href="/favorites" className="miniCard sm">
                  <p className="miniCardName">{f.name}</p>
                  <p className="miniCardKind">{f.kind}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="foot">
        <div className="footBrand">
          <span className="footMark">NTD</span>
          <span className="footCorp">NTD <em>Need of The Day</em></span>
        </div>
        <p className="footDesc">
          바쁜 현대인들이 '오늘 당장 필요한' 편리함을 한발 앞서 찾아내는
          라이프스타일 테크 기업입니다.
        </p>
        <div className="footLinks">
          <Link href="/terms">이용약관</Link>
          <Link href="/privacy">개인정보 처리방침</Link>
          <Link href="/feedback">문의</Link>
        </div>
        <p className="footDim">호스팅 서비스 제공: Vercel Inc.</p>
        <p className="footDim">레시피는 만개의레시피, 식당은 네이버 지도로 연결됩니다.</p>
        <p className="footDim">
          추천 결과는 참고용 정보이며 의학적·영양학적 조언이 아닙니다.
        </p>
        <p className="footDim">
          일부 음식 사진은 Unsplash, Pexels, Pixabay 의 이미지를 사용합니다.
        </p>
        <p className="footCopy">© 2026 NTD. All rights reserved. · v1.0.0</p>
      </footer>

      <BottomNav favCount={favorites.length} />
    </div>
  );
}
