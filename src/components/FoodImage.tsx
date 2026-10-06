"use client";
import React, { useState } from "react";
import { getFoodImageUrl, getFoodImageThumbUrl, getFoodEmoji } from "@/lib/foodImage";

interface FoodImageProps {
  /** 메뉴명 (필수) */
  name: string;
  /** 직접 지정할 URL. 없으면 name 으로 자동 생성 */
  src?: string;
  /** 컨테이너에 적용할 클래스 (크기·배경 담당) */
  className?: string;
  /** 이모지 아래 텍스트 라벨 표시 여부 (기본값: true) */
  showLabel?: boolean;
  /** 이미지 종류: main (800px 큰 이미지), thumb (400px 썸네일). 기본값: thumb */
  variant?: "main" | "thumb";
}

/**
 * 음식 이미지를 표시합니다.
 *   1) 전달받은 src 또는 수동 등록 URL
 *   2) URL이 없거나 이미지 로딩 실패 시 이모지 + 메뉴명 폴백
 */
export function FoodImage({
  name,
  src,
  className,
  showLabel = true,
  variant = "thumb",
}: FoodImageProps) {
  const [failed, setFailed] = useState(false);
  const defaultUrl = variant === "main" ? getFoodImageUrl(name) : getFoodImageThumbUrl(name);
  const url = src && src.trim() !== "" ? src : defaultUrl;
  const showImage = url !== "" && !failed;

  return (
    <div className={className}>
      {showImage ? (
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
          {showLabel && <span className="imgFallbackName">{name}</span>}
        </span>
      )}
    </div>
  );
}
