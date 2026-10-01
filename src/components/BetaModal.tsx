"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

/**
 * 시범 운영 안내 팝업.
 * 화면을 열 때마다 0.6초 뒤 표시. 닫으면 그 화면에서만 닫힘.
 */
export function BetaModal() {
  const [open, setOpen] = useState(false);

  const dismiss = () => {
    setOpen(false);
  };

  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(t);
  }, []);

  // 열려 있는 동안 뒤 배경이 스크롤되지 않게
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ESC 로 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="betaModalBack"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <div
        className="betaModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="betaModalTitle"
      >
        <button
          type="button"
          className="betaModalClose"
          onClick={dismiss}
          aria-label="닫기"
        >
          ✕
        </button>

        <img
          className="betaModalMascot"
          src="/mascot/omeok-default.png"
          alt=""
          width={92}
          height={92}
        />

        <span className="betaModalTag">BETA</span>
        <h2 className="betaModalTitle" id="betaModalTitle">
          시범 운영 중이에요
        </h2>

        <p className="betaModalBody">
          &lsquo;오늘 뭐 먹지?&rsquo;는 아직 만들어 가는 중입니다.
          메뉴를 계속 늘리고 추천도 매일 다듬고 있어요.
        </p>

        <ul className="betaModalList">
          <li>찾으시는 메뉴가 없을 수 있어요</li>
          <li>추천이 취향과 어긋날 수 있어요</li>
          <li>알려주시면 그대로 반영합니다</li>
        </ul>

        <div className="betaModalBtns">
          <Link href="/feedback" className="betaModalPrimary" onClick={dismiss}>
            의견 남기기
          </Link>
          <button type="button" className="betaModalGhost" onClick={dismiss}>
            둘러볼게요
          </button>
        </div>
      </div>
    </div>
  );
}
