"use client";
import React, { useState } from "react";

interface FoodImageProps {
  src?: string;
  name: string;
  className?: string;
}

/**
 * 음식 이미지를 표시하고, 없거나 로딩 실패 시
 * 이름 타이포 폴백으로 자동 전환합니다.
 */
export function FoodImage({ src, name, className }: FoodImageProps) {
  const [failed, setFailed] = useState(false);
  const show = src && src.trim() !== "" && !failed;

  return (
    <div className={className}>
      {show ? (
        <img
          src={src}
          alt={name}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="imgFallback">{name}</span>
      )}
    </div>
  );
}
