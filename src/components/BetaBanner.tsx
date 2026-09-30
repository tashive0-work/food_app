"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

const KEY = "beta_banner_dismissed_v1";

export function BetaBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) !== "1") setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  const close = () => {
    setShow(false);
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* 사생활 보호 모드 등에서는 저장이 막힐 수 있습니다 */
    }
  };

  if (!show) return null;

  return (
    <div className="betaBanner" role="status">
      <span className="betaTag">BETA</span>
      <div className="betaBody">
        <p className="betaTitle">지금은 시범 운영 중이에요</p>
        <p className="betaDesc">
          메뉴를 계속 늘리고 추천도 다듬는 중입니다. 찾는 메뉴가 없거나 추천이 어긋나면{" "}
          <Link href="/feedback" className="betaLink">
            알려주세요
          </Link>
          . 그대로 반영됩니다.
        </p>
      </div>
      <button type="button" className="betaClose" onClick={close} aria-label="베타 안내 닫기">
        ✕
      </button>
    </div>
  );
}
