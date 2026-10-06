"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { FOODS } from "@/data/foods";
import { THEMES } from "@/data/themes";
import { BetaModal } from "@/components/BetaModal";
import { BetaBanner } from "@/components/BetaBanner";
import { BottomNav } from "@/components/BottomNav";
import { FoodImage } from "@/components/FoodImage";
import { loadTodayResult, TodayResult } from "@/lib/todayResult";
import { getTrends } from "@/lib/trend";
import { TrendItem } from "@/types/trend";
import { Mascot } from "@/components/Mascot";
import { getRotatedFoods, RotationResult } from "@/lib/rotation";
import { loadDietSettings } from "@/lib/dietFilter";

export default function Home() {
  const [favorites, setFavorites] = useState<number[]>([]);
  const [today, setToday] = useState<TodayResult | null>(null);
  const [greeting, setGreeting] = useState("");
  const [dateLabel, setDateLabel] = useState("");
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [rotatedData, setRotatedData] = useState<RotationResult>(() => getRotatedFoods());

  // 가로 스크롤 영역 제어
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const hasOverflow = scrollWidth > clientWidth + 2;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(hasOverflow && scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  const handleScroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    // 카드 약 2~3개 분량 스크롤
    const scrollAmount = 300;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollButtons();
    const rafId = requestAnimationFrame(() => updateScrollButtons());
    const timer = setTimeout(() => updateScrollButtons(), 150);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => updateScrollButtons());
      ro.observe(el);
    }

    window.addEventListener("resize", updateScrollButtons);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
      if (ro) ro.disconnect();
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [updateScrollButtons, rotatedData.foods]);

  useEffect(() => {
    try {
      const f = localStorage.getItem("food_favorites");
      if (f) setFavorites(JSON.parse(f));
    } catch (e) {
      console.error(e);
    }
    setToday(loadTodayResult());

    const dietSettings = loadDietSettings();
    setRotatedData(getRotatedFoods({ dietSettings }));

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
              <span className="brandMarkImg" aria-hidden="true">
                <img src="/mascot/omeok-default.png" alt="" width={34} height={34} />
              </span>
              <h1 className="brandName" style={{margin:0,lineHeight:0}}>
                <img src="/brand/logo-wordmark.svg" alt="오늘의 잇템 — 점심·저녁 메뉴 추천" width={124} height={23} style={{height:23,width:"auto",display:"block"}} />
              </h1>
            </Link>
            <Link href="/settings" className="settingsEntry" aria-label="내 정보 및 설정">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>내 정보</span>
            </Link>
          </div>
          <p className="homeDate" style={{ margin: "0 0 4px", fontSize: "13px", color: "var(--dim)", fontWeight: 600 }}>{dateLabel}</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            <p className="homeGreet" style={{ fontSize: "24px", fontWeight: 800, margin: 0, letterSpacing: "-0.03em" }}>{greeting}</p>
          </div>
        </header>

        <BetaModal />
        <BetaBanner />

        {/* 고객의 소리함 배너 카드 */}
        <section className="homeSec" style={{ marginTop: "14px", marginBottom: "6px" }}>
          <Link
            href="/feedback"
            style={{
              display: "block",
              background: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)",
              border: "1px solid #FED7AA",
              borderRadius: "16px",
              padding: "18px 20px",
              textDecoration: "none",
              boxShadow: "var(--sh1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                  <span style={{ fontSize: "16px" }}>💌</span>
                  <span style={{ fontSize: "15px", fontWeight: 800, color: "#9A3412" }}>
                    고객의 소리함
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      background: "#E8663D",
                      color: "#FFFFFF",
                      padding: "2px 6px",
                      borderRadius: "6px",
                    }}
                  >
                    메뉴 제안
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "13px", color: "#C2410C", lineHeight: 1.5, fontWeight: 500 }}>
                  찾으시는 메뉴가 없거나 앱에 바라는 점이 있나요?
                  <br />
                  언제든 편하게 알려주시면 빠르게 반영할게요!
                </p>
              </div>
              <div
                style={{
                  background: "#FFFFFF",
                  color: "#E8663D",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  fontWeight: 700,
                  boxShadow: "0 2px 6px rgba(232, 102, 61, 0.15)",
                  flexShrink: 0,
                }}
              >
                →
              </div>
            </div>
          </Link>
        </section>


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
          <svg viewBox="0 0 24 24" fill="none" stroke="#E8663D" strokeWidth="2.5" strokeLinecap="round" style={{ width: "19px", height: "19px", flex: "none" }}>
            <circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>
          </svg>
          <span style={{ fontSize: "14.5px", color: "var(--dim)", fontWeight: 500 }}>어떤 메뉴가 당기시나요? 검색해 보세요</span>
        </Link>

        {/* 정갈한 프리미엄 화이트 히어로 카운터 카드 */}
        {/* 진단 카드.
            진단 기록이 있으면 카드 전체를 링크로 묶지 않습니다 —
            전에는 어디를 눌러도 /quiz 로 가서, 결과를 다시 보려던 사람이
            진단을 처음부터 다시 하게 됐습니다. */}
        {(() => {
          const diagCardStyle: React.CSSProperties = {
          display: "block",
          textDecoration: "none",
          background: "#FFFFFF",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-xl)",
          padding: "22px 20px 20px",
          color: "var(--ink)",
          boxShadow: "var(--sh1)",
          marginBottom: "24px",
          position: "relative",
          overflow: "hidden"
        };
          const inner = (
            <>
          {/* 말풍선: 캐릭터 왼쪽 위 (상단 빈 영역에 배치) */}
          <div
            style={{
              position: "absolute",
              top: "14px",
              right: "68px",
              zIndex: 3,
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: "16px",
                padding: "7px 12px",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--ink)",
                boxShadow: "0 4px 14px rgba(0, 0, 0, 0.08)",
                border: "1px solid var(--border)",
                whiteSpace: "nowrap",
                position: "relative",
                letterSpacing: "-0.02em",
              }}
            >
              오먹 오먹~ 오늘 뭐 먹지?
              <span
                style={{
                  position: "absolute",
                  bottom: "-6px",
                  right: "16px",
                  width: 0,
                  height: 0,
                  borderLeft: "6px solid transparent",
                  borderRight: "6px solid transparent",
                  borderTop: "7px solid #FFFFFF",
                  filter: "drop-shadow(0 1px 0 var(--border))",
                }}
                aria-hidden="true"
              />
            </div>
          </div>

          {/* 오먹이 default 180px: 카드 하단 경계선에 딱 걸쳐 앉음 */}
          <div
            style={{
              position: "absolute",
              right: "-12px",
              bottom: "-6px",
              zIndex: 1,
              pointerEvents: "none",
            }}
          >
            <Mascot
              expression="default"
              size={180}
              priority
            />
          </div>

          {/* 좌측 텍스트 콘텐츠 */}
          <div style={{ position: "relative", zIndex: 2, maxWidth: "56%" }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "var(--primaryBg)",
              color: "#E8663D",
              padding: "4px 10px",
              borderRadius: "9999px",
              fontSize: "12px",
              fontWeight: 800,
              marginBottom: "12px"
            }}>
              <span>맞춤 진단</span>
            </div>

            <h2 style={{
              fontSize: "20px",
              fontWeight: 800,
              margin: "0 0 6px",
              letterSpacing: "-0.03em",
              color: "var(--ink)",
              lineHeight: 1.3,
              wordBreak: "keep-all"
            }}>
              {today ? `오늘의 결론: ${today.topFoodName}` : "지금 내 상태에 딱 맞는\n오늘의 메뉴 진단받기"}
            </h2>

            <p style={{
              fontSize: "12.5px",
              margin: "0 0 16px",
              color: "var(--dim)",
              lineHeight: 1.45,
              fontWeight: 500
            }}>
              {today ? today.verdict.title : "기분, 소화 상태, 식사 취향에 맞춘 스마트 추천"}
            </p>

            {today ? (
              /* 진단 기록이 있으면 — 결과를 다시 보는 것과 새로 진단하는 것을 나눕니다 */
              <div className="diagBtns">
                <Link href="/result" className="diagBtn primary">
                  결과 다시 보기 <span aria-hidden="true">→</span>
                </Link>
                <Link href="/quiz" className="diagBtn ghost">
                  다시 진단해 보기
                </Link>
              </div>
            ) : (
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#191F28",
                color: "#FFFFFF",
                padding: "9px 15px",
                borderRadius: "9999px",
                fontSize: "12.5px",
                fontWeight: 800
              }}>
                <span>추천 시작하기</span>
                <span aria-hidden="true">→</span>
              </span>
            )}
          </div>            </>
          );
          return today ? (
            <div style={diagCardStyle}>{inner}</div>
          ) : (
            <Link href="/quiz" style={diagCardStyle}>{inner}</Link>
          );
        })()}

        {/* 2x2 정돈된 화이트 벤토 그리드 */}
        <section className="bentoGrid">
          <Link href="/trend" className="bentoCard">
            <span className="bentoIcon">🔥</span>
            <div>
              <h3 className="bentoTitle">요즘 뜨는 메뉴</h3>
              <p className="bentoDesc">요즘 많이 찾는 메뉴</p>
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

        {/* 둘러보는 입구 두 개를 한 줄에.
            흰 카드로 두니 흰 배경에 묻혀서 색을 넣었습니다. 홈이 길어지지는 않습니다. */}
        {(() => {
          const card = (bg: string, line: string): React.CSSProperties => ({
            flex: 1,
            minWidth: 0,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: "9px",
            textDecoration: "none",
            background: bg,
            border: `1px solid ${line}`,
            borderRadius: "var(--r-lg, 16px)",
            padding: "16px 14px 15px",
            color: "var(--ink)",
          });
          const badge = (bg: string): React.CSSProperties => ({
            width: "38px",
            height: "38px",
            borderRadius: "11px",
            background: bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
          });
          const title: React.CSSProperties = {
            fontSize: "15px",
            fontWeight: 800,
            lineHeight: 1.3,
            letterSpacing: "-0.01em",
          };
          const desc: React.CSSProperties = {
            fontSize: "12px",
            color: "var(--dim)",
            lineHeight: 1.45,
            wordBreak: "keep-all",
          };
          const arrow = (c: string): React.CSSProperties => ({
            position: "absolute",
            top: "16px",
            right: "14px",
            fontSize: "15px",
            fontWeight: 700,
            color: c,
          });
          return (
            <div style={{ display: "flex", gap: "10px", margin: "0 0 24px" }}>
              <Link href="/food" style={card("#FFF3ED", "#FFD9C6")}>
                <span aria-hidden="true" style={badge("#FFE2D3")}>🍚</span>
                <span style={title}>종류별로 보기</span>
                <span style={desc}>한식·일식·중식·디저트까지 {FOODS.length.toLocaleString()}가지</span>
                <span aria-hidden="true" style={arrow("#E8663D")}>→</span>
              </Link>
              <Link href="/region" style={card("#EEF3FF", "#D6E2FB")}>
                <span aria-hidden="true" style={badge("#DEE8FF")}>🧭</span>
                <span style={title}>여행 중이신가요?</span>
                <span style={desc}>그 지역 대표 음식과 파는 곳</span>
                <span aria-hidden="true" style={arrow("#4C7DF0")}>→</span>
              </Link>
            </div>
          );
        })()}

        {/* 시간대별 로테이션 메뉴 카드 섹션 */}
        <section className="homeSec" style={{ marginBottom: "28px" }}>
          <div className="homeSecHead" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <h2 style={{ fontSize: "19px", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
              {rotatedData.title}
            </h2>
          </div>
          <div className="hScrollContainer">
            {canScrollLeft && (
              <button
                type="button"
                className="scrollArrowBtn left"
                onClick={() => handleScroll("left")}
                aria-label="이전 메뉴 보기"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            )}

            <div className="hScroll" ref={scrollRef} onScroll={updateScrollButtons}>
              {rotatedData.foods.map((f) => (
                <Link key={f.id} href={`/food/${encodeURIComponent(f.name)}`} className="miniCard" style={{
                  background: "#FFFFFF",
                  borderRadius: "var(--r-lg)",
                  padding: "12px",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--sh1)",
                  textDecoration: "none",
                  overflow: "hidden",
                  boxSizing: "border-box"
                }}>
                  <FoodImage name={f.name} className="miniCardImg" showLabel={false} />
                  <p className="miniCardName" style={{ marginTop: "8px", fontWeight: 700, fontSize: "14px", color: "var(--ink)" }}>{f.name}</p>
                  <p className="miniCardKind" style={{ margin: "2px 0 0", fontSize: "11.5px", color: "var(--dim)" }}>{f.kind}</p>
                </Link>
              ))}
            </div>

            {canScrollRight && (
              <button
                type="button"
                className="scrollArrowBtn right"
                onClick={() => handleScroll("right")}
                aria-label="다음 메뉴 보기"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            )}
          </div>
        </section>

        {/* 테마 타일 섹션 */}
        <section className="homeSec">
          <div className="homeSecHead">
            <h2 style={{ fontSize: "19px", fontWeight: 800, letterSpacing: "-0.02em" }}>어떤 상황이신가요?</h2>
            <Link href="/theme" className="homeSecMore">전체 보기</Link>
          </div>
          <div className="themeGrid">
            {THEMES.slice(0, 12).map((t) => (
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
          <Link href="/food">전체 메뉴</Link>
          <Link href="/terms">이용약관</Link>
          <Link href="/privacy">개인정보 처리방침</Link>
          <Link href="/feedback">고객의 소리함</Link>
        </div>
        <p className="footCopy">© 2026 NTD. All rights reserved. · v2.0.0</p>
      </footer>

      <BottomNav favCount={favorites.length} />
    </div>
  );
}
