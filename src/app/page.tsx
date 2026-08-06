"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FOODS } from "@/data/foods";
import { THEMES } from "@/data/themes";
import { FOOD_IMAGES } from "@/data/foodImages";
import { BottomNav } from "@/components/BottomNav";
import { loadTodayResult, TodayResult } from "@/lib/todayResult";
import { getPopularFoods, PopularResult } from "@/lib/popular";

export default function Home() {
  const [favorites, setFavorites] = useState<number[]>([]);
  const [today, setToday] = useState<TodayResult | null>(null);
  const [greeting, setGreeting] = useState("");
  const [dateLabel, setDateLabel] = useState("");
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
      <header className="homeHead">
        <Link href="/" className="brandRow">
          <span className="brandMark" aria-hidden="true">오늘</span>
          <span className="brandName">오늘 뭐 먹지?</span>
        </Link>
        <p className="homeDate">{dateLabel}</p>
        <h1 className="homeGreet">{greeting}</h1>
      </header>

      <main className="wrap">
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
              const img = FOOD_IMAGES[f.name]?.url;
              return (
                <Link key={f.id} href="/theme" className="miniCard">
                  <div className="miniCardImg">
                    {img ? (
                      <img src={img} alt={f.name} loading="lazy" />
                    ) : (
                      <span className="miniCardFallback">{f.name}</span>
                    )}
                  </div>
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
          <Link href="/ranking" className="startCard sub">
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
          <a href="mailto:tashive0@gmail.com">문의</a>
        </div>
        <p className="footDim">호스팅 서비스 제공: Vercel Inc.</p>
        <p className="footDim">레시피는 만개의레시피, 식당은 네이버 지도로 연결됩니다.</p>
        <p className="footDim">
          추천 결과는 참고용 정보이며 의학적·영양학적 조언이 아닙니다.
        </p>
        <p className="footCopy">© 2026 NTD. All rights reserved.</p>
      </footer>

      <BottomNav favCount={favorites.length} />
    </div>
  );
}
