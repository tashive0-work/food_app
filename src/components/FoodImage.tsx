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
}: FoodImageProps) {
  const [failed, setFailed] = useState(false);
  const url = src && src.trim() !== "" ? src : getFoodImageUrl(name);
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
          <span className="imgFallbackName">{name}</span>
        </span>
      )}
    </div>
  );
}
