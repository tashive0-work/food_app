import React from "react";
import Image from "next/image";

export type MascotExpression = "default" | "thinking" | "happy" | "hungry" | "tired";

export interface MascotProps {
  expression: MascotExpression;
  size: number;
  className?: string;
  priority?: boolean;
  bubble?: string;
  bubblePosition?: "left" | "right" | "top";
  bubbleStyle?: React.CSSProperties;
  style?: React.CSSProperties;
}

export function Mascot({
  expression,
  size,
  className,
  priority,
  bubble,
  bubblePosition = "top",
  bubbleStyle,
  style,
}: MascotProps) {
  const imageElement = (
    <Image
      src={`/mascot/omeok-${expression}.png`}
      alt="오먹이"
      width={size}
      height={size}
      priority={priority}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        objectFit: "contain",
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  );

  if (!bubble) {
    return (
      <div className={className} style={{ display: "inline-block", lineHeight: 0, ...style }}>
        {imageElement}
      </div>
    );
  }

  const bubbleBaseStyle: React.CSSProperties = {
    background: "#FFFFFF",
    borderRadius: "16px",
    padding: "9px 14px",
    fontSize: "15px",
    fontWeight: 600,
    lineHeight: 1.35,
    color: "var(--ink, #191F28)",
    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.08)",
    border: "1px solid var(--border, #E5E8EB)",
    whiteSpace: "nowrap",
    position: "relative",
    zIndex: 3,
    letterSpacing: "-0.02em",
    wordBreak: "keep-all",
  };

  const renderTail = () => {
    if (bubblePosition === "left") {
      return (
        <span
          style={{
            position: "absolute",
            right: "-7px",
            top: "50%",
            transform: "translateY(-50%)",
            width: 0,
            height: 0,
            borderTop: "6px solid transparent",
            borderBottom: "6px solid transparent",
            borderLeft: "8px solid #FFFFFF",
            filter: "drop-shadow(1px 0 0 var(--border, #E5E8EB))",
          }}
          aria-hidden="true"
        />
      );
    }
    if (bubblePosition === "right") {
      return (
        <span
          style={{
            position: "absolute",
            left: "-7px",
            top: "50%",
            transform: "translateY(-50%)",
            width: 0,
            height: 0,
            borderTop: "6px solid transparent",
            borderBottom: "6px solid transparent",
            borderRight: "8px solid #FFFFFF",
            filter: "drop-shadow(-1px 0 0 var(--border, #E5E8EB))",
          }}
          aria-hidden="true"
        />
      );
    }
    // top
    return (
      <span
        style={{
          position: "absolute",
          bottom: "-7px",
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderTop: "8px solid #FFFFFF",
          filter: "drop-shadow(0 1px 0 var(--border, #E5E8EB))",
        }}
        aria-hidden="true"
      />
    );
  };

  const headOffset = Math.max(4, Math.round(size * 0.1));

  if (bubblePosition === "top") {
    return (
      <div
        className={`mascotWrapper ${className || ""}`}
        style={{
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "10px",
          position: "relative",
          ...style,
        }}
      >
        <div style={{ ...bubbleBaseStyle, ...bubbleStyle }}>
          {bubble}
          {renderTail()}
        </div>
        {imageElement}
      </div>
    );
  }

  if (bubblePosition === "left") {
    return (
      <div
        className={`mascotWrapper ${className || ""}`}
        style={{
          display: "inline-flex",
          flexDirection: "row",
          alignItems: "flex-start",
          gap: "10px",
          position: "relative",
          ...style,
        }}
      >
        <div style={{ ...bubbleBaseStyle, marginTop: `${headOffset}px`, ...bubbleStyle }}>
          {bubble}
          {renderTail()}
        </div>
        {imageElement}
      </div>
    );
  }

  // right
  return (
    <div
      className={`mascotWrapper ${className || ""}`}
      style={{
        display: "inline-flex",
        flexDirection: "row",
        alignItems: "flex-start",
        gap: "10px",
        position: "relative",
        ...style,
      }}
    >
      {imageElement}
      <div style={{ ...bubbleBaseStyle, marginTop: `${headOffset}px`, ...bubbleStyle }}>
        {bubble}
        {renderTail()}
      </div>
    </div>
  );
}

export default Mascot;
