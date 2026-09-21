import React from "react";
import Image from "next/image";

export type MascotExpression = "default" | "thinking" | "happy" | "hungry" | "tired";

export interface MascotProps {
  expression: MascotExpression;
  size: number;
  className?: string;
  priority?: boolean;
}

export function Mascot({ expression, size, className, priority }: MascotProps) {
  return (
    <Image
      src={`/mascot/omeok-${expression}.png`}
      alt="오먹이"
      width={size}
      height={size}
      className={className}
      priority={priority}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        objectFit: "contain",
        display: "inline-block",
      }}
    />
  );
}

export default Mascot;
