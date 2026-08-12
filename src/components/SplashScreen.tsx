"use client";

import React, { useEffect, useState } from "react";

const SPLASH_MIN_MS = 1800;
const SPLASH_MAX_MS = 2200;
const FADE_IN_MS = 500;
const FADE_OUT_MS = 400;

export function SplashScreen() {
  const [mounted, setMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    setMounted(true);

    try {
      const shown = sessionStorage.getItem("food_app_splash_shown");
      if (shown) {
        return;
      }
    } catch (e) {
      console.error(e);
    }

    setShouldRender(true);
    const startTime = Date.now();
    let fadeTimer: NodeJS.Timeout;
    let removeTimer: NodeJS.Timeout;
    let maxSafetyTimer: NodeJS.Timeout;
    let isExiting = false;

    const startExit = () => {
      if (isExiting) return;
      isExiting = true;
      setIsFadingOut(true);

      try {
        sessionStorage.setItem("food_app_splash_shown", "true");
      } catch (e) {
        console.error(e);
      }

      removeTimer = setTimeout(() => {
        setShouldRender(false);
      }, FADE_OUT_MS);
    };

    const handleLoadOrMinTime = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, SPLASH_MIN_MS - elapsed);

      fadeTimer = setTimeout(() => {
        startExit();
      }, remaining);
    };

    if (document.readyState === "complete") {
      handleLoadOrMinTime();
    } else {
      window.addEventListener("load", handleLoadOrMinTime);
    }

    // 최대 표시 시간(SPLASH_MAX_MS)을 초과하지 않도록 보장
    maxSafetyTimer = setTimeout(() => {
      startExit();
    }, SPLASH_MAX_MS);

    return () => {
      window.removeEventListener("load", handleLoadOrMinTime);
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
      clearTimeout(maxSafetyTimer);
    };
  }, []);

  if (!mounted || !shouldRender) {
    return null;
  }

  return (
    <div
      className={`splashOverlay ${isFadingOut ? "fadeOut" : ""}`}
      aria-hidden="true"
    >
      <div className="splashCenter">
        <div className="splashLogoBadge">오늘</div>
        <div className="splashAppName">오늘 뭐 먹지?</div>
        <div className="splashSubCopy">오늘 뭐 먹을지 대신 정해드려요</div>
      </div>
      <div className="splashBottom">
        <div className="splashNtd">NTD</div>
        <div className="splashNeedText">Need of The Day</div>
      </div>
    </div>
  );
}
