"use client";

import React, { useState } from "react";
import Link from "next/link";

/**
 * 베타 안내 배너.
 * 닫기는 "이번 화면에서만" 유효합니다. 새로고침하면 다시 나타납니다.
 * (저장하지 않으므로 localStorage 를 쓰지 않습니다)
 */
export function BetaBanner() {
  const [show, setShow] = useState(true);

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
      <button
        type="button"
        className="betaClose"
        onClick={() => setShow(false)}
        aria-label="베타 안내 닫기"
      >
        ✕
      </button>
    </div>
  );
}
