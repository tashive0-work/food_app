"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FOODS } from "@/data/foods";
import { THEMES } from "@/data/themes";
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
      h < 11 ? "좋은 아침이에요! ☀️" : h < 17 ? "맛있는 점심 드셨나요? 🍱" : "오늘 하루 고생 많았어요! 🌙"
    );
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    setDateLabel(
      `${now.getMonth() + 1}월 ${now.getDate()}일 ${days[now.getDay()]}요일`
    );
  }, []);

  return (
    <div className="app hasNav">
      <main className="wrap">
        {/* 상단 브랜딩 & 인사말 */}
        <header className="homeHead" style={{ padding: "16px 0 12px" }}>
          <div className="homeHeadRow">
            <Link href="/" className="brandRow" style={{ marginBottom: 0, gap: "6px" }}>
              <span className="brandMark" style={{ background: "#FF5000", color: "#FFFFFF", fontWeight: 900, borderRadius: "10px" }} aria-hidden="true">오늘</span>
              <span className="brandName" style={{ fontSize: "19px", fontWeight: 900, letterSpacing: "-0.03em" }}>오늘 뭐 먹지?</span>
            </Link>
            <Link href="/settings" className="settingsBtn" aria-label="설정" style={{ background: "#FFFFFF", border: "1px solid var(--border)", width: "36px", height: "36px" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </Link>
          </div>
          <p className="homeDate" style={{ margin: "0 0 4px", fontSize: "13px", color: "var(--dim)", fontWeight: 600 }}>{dateLabel}</p>
          <h1 className="homeGreet" style={{ fontSize: "24px", fontWeight: 800, margin: 0, letterSpacing: "-0.03em" }}>{greeting}</h1>
        </header>

        {/* 캡슐 검색 진입점 */}
        <Link href="/search" className="searchEntry" style={{
          borderRadius: "9999px",
          background: "#FFFFFF",
          boxShadow: "var(--sh1)",
          border: "1px solid var(--border)",
          padding: "14px 20px",
          margin: "12px 0 20px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          textDecoration: "none"
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#FF5000" strokeWidth="2.5" strokeLinecap="round" style={{ width: "19px", height: "19px", flex: "none" }}>
            <circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>
          </svg>
          <span style={{ fontSize: "14.5px", color: "var(--dim)", fontWeight: 500 }}>어떤 메뉴가 당기시나요? 검색해 보세요</span>
        </Link>

        {/* 정갈한 프리미엄 화이트 히어로 카운터 카드 */}
        <Link href="/quiz" style={{
          display: "block",
          textDecoration: "none",
          background: "#FFFFFF",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-xl)",
          padding: "24px 22px",
          color: "var(--ink)",
          boxShadow: "var(--sh1)",
          marginBottom: "24px",
          position: "relative"
        }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "var(--primaryBg)",
            color: "#FF5000",
            padding: "4px 10px",
            borderRadius: "9999px",
            fontSize: "12px",
            fontWeight: 800,
            marginBottom: "12px"
          }}>
            <span>맞춤 진단</span>
          </div>

          <h2 style={{
            fontSize: "22px",
            fontWeight: 800,
            margin: "0 0 6px",
            letterSpacing: "-0.03em",
            color: "var(--ink)",
            lineHeight: 1.3
          }}>
            {today ? `오늘의 결론: ${today.topFoodName}` : "지금 내 상태에 딱 맞는\n오늘의 메뉴 진단받기"}
          </h2>

          <p style={{
            fontSize: "13.5px",
            margin: "0 0 20px",
            color: "var(--dim)",
            lineHeight: 1.5,
            fontWeight: 500
          }}>
            {today ? today.verdict.title : "기분, 소화 상태, 건강 조건에 맞춘 스마트 추천"}
          </p>

          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "#191F28",
            color: "#FFFFFF",
            padding: "11px 18px",
            borderRadius: "9999px",
            fontSize: "13.5px",
            fontWeight: 800
          }}>
            <span>{today ? "다시 진단해 보기" : "추천 시작하기"}</span>
            <span>→</span>
          </div>
        </Link>

        {/* 2x2 정돈된 화이트 벤토 그리드 */}
        <section className="bentoGrid">
          <Link href="/trend" className="bentoCard">
            <span className="bentoIcon">🔥</span>
            <div>
              <h3 className="bentoTitle">요즘 뜨는 메뉴</h3>
              <p className="bentoDesc">성수/강남 이번 주 트렌드</p>
            </div>
          </Link>

          <Link href="/theme" className="bentoCard">
            <span className="bentoIcon">🎯</span>
            <div>
              <h3 className="bentoTitle">이럴 땐 이 메뉴</h3>
              <p className="bentoDesc">야식, 해장, 다이어트 특화</p>
            </div>
          </Link>

          <Link href="/quiz" className="bentoCard">
            <span className="bentoIcon">🤖</span>
            <div>
              <h3 className="bentoTitle">AI 재추천</h3>
              <p className="bentoDesc">원하는 조건 직접 입력</p>
            </div>
          </Link>

          <Link href="/favorites" className="bentoCard">
            <span className="bentoIcon">❤️</span>
            <div>
              <h3 className="bentoTitle">내 찜한 메뉴</h3>
              <p className="bentoDesc">{favorites.length}개 메뉴 보관 중</p>
            </div>
          </Link>
        </section>

        {/* 인기 메뉴 카드 섹션 */}
        <section className="homeSec" style={{ marginBottom: "28px" }}>
          <div className="homeSecHead" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <h2 style={{ fontSize: "19px", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
              {popularData.label}
              {popularData.isRealData && <span className="liveBadge" style={{ marginLeft: "8px" }}>실시간 Live</span>}
            </h2>
          </div>
          <div className="hScroll">
            {popularData.foods.map((f) => (
              <Link key={f.id} href="/theme" className="miniCard" style={{
                background: "#FFFFFF",
                borderRadius: "var(--r-lg)",
                padding: "12px",
                border: "1px solid var(--border)",
                boxShadow: "var(--sh1)",
                textDecoration: "none",
                display: "inline-block",
                minWidth: "124px"
              }}>
                <FoodImage name={f.name} className="miniCardImg" />
                <p className="miniCardName" style={{ marginTop: "8px", fontWeight: 700, fontSize: "14px", color: "var(--ink)" }}>{f.name}</p>
                <p className="miniCardKind" style={{ margin: "2px 0 0", fontSize: "11.5px", color: "var(--dim)" }}>{f.kind}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* 테마 타일 섹션 */}
        <section className="homeSec">
          <div className="homeSecHead">
            <h2 style={{ fontSize: "19px", fontWeight: 800, letterSpacing: "-0.02em" }}>어떤 상황이신가요?</h2>
            <Link href="/theme" className="homeSecMore">전체 보기</Link>
          </div>
          <div className="themeGrid">
            {THEMES.map((t) => (
              <Link key={t.key} href={`/theme?k=${t.key}`} className="themeTile" style={{
                borderRadius: "var(--r-md)",
                background: "#FFFFFF",
                border: "1px solid var(--border)",
                boxShadow: "var(--sh1)"
              }}>
                <span className="themeTileIcon" aria-hidden="true">{t.icon}</span>
                <span className="themeTileLabel" style={{ fontWeight: 700 }}>{t.label}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="footBrand">
          <span className="footMark" style={{ background: "var(--primary)", color: "#191F28" }}>NTD</span>
          <span className="footCorp">NTD <em>Need of The Day</em></span>
        </div>
        <p className="footDesc">
          오늘 당장 필요한 최적의 메뉴를 스마트하게 결정해 주는 라이프스타일 큐레이션 서비스입니다.
        </p>
        <div className="footLinks">
          <Link href="/terms">이용약관</Link>
          <Link href="/privacy">개인정보 처리방침</Link>
          <Link href="/feedback">문의하기</Link>
        </div>
        <p className="footCopy">© 2026 NTD. All rights reserved. · v2.0.0 (Toss/Baemin 3D Capsule)</p>
      </footer>

      <BottomNav favCount={favorites.length} />
    </div>
  );
}
