"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

/**
 * 가로 스크롤 줄.
 * 모바일은 손가락으로 밀면 되지만 데스크톱은 밀 방법이 없어서
 * 마우스를 쓰는 화면에서만 좌/우 화살표 버튼과 스크롤바를 보여줍니다.
 */
export function HScroll({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const sync = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < max - 4);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    // 카드가 나중에 그려지는 경우 대비
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      ro.disconnect();
    };
  }, [sync]);

  const nudge = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const step = Math.max(240, Math.round(el.clientWidth * 0.8));
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <div className="hScrollWrap">
      <div className={`hScroll ${className}`.trim()} ref={ref}>
        {children}
      </div>

      <button
        type="button"
        className="hScrollArrow hScrollArrowL"
        onClick={() => nudge(-1)}
        disabled={!canLeft}
        aria-label="왼쪽으로"
        tabIndex={-1}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <button
        type="button"
        className="hScrollArrow hScrollArrowR"
        onClick={() => nudge(1)}
        disabled={!canRight}
        aria-label="오른쪽으로"
        tabIndex={-1}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
