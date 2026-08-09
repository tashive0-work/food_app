"use client";
import React, { useState } from "react";
import { getFoodImageUrl, getFoodEmoji } from "@/lib/foodImage";

interface FoodImageProps {
  /** 메뉴명 (필수) */
  name: string;
  /** 직접 지정할 URL. 없으면 name 으로 자동 생성 */
  src?: string;
  /** 컨테이너에 적용할 클래스 (크기·배경 담당) */
  className?: string;
  /** 요청할 이미지 크기 */
  width?: number;
  height?: number;
  children?: React.ReactNode;
}

/**
 * 음식 이미지를 3단 폴백으로 표시합니다.
 *   1) 전달받은 src 또는 수동 등록 URL
 *   2) Unsplash Source API 자동 조회
 *   3) 이모지 + 메뉴명 (로딩 실패 시)
 */
export function FoodImage({
  name,
  src,
  className,
  width = 400,
  height = 300,
  children,
}: FoodImageProps) {
  const [failed, setFailed] = useState(false);
  const url = src && src.trim() !== "" ? src : getFoodImageUrl(name, width, height);

  return (
    <div className={className}>
      {!failed ? (
        <img
          src={url}
          alt={name}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="imgFallback">
          <span className="imgFallbackEmoji" aria-hidden="true">
            {getFoodEmoji(name)}
          </span>
          <span className="imgFallbackName">{name}</span>
        </span>
      )}
      {children}
    </div>
  );
}
