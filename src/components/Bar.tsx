import React from "react";

export function Bar({ label, value }: { label: string; value: number }) {
  const filled = "■".repeat(value) + "·".repeat(4 - value);
  return (
    <div className="rline">
      <span className="rlabel">{label}</span>
      <span className="rbar">{filled}</span>
      <span className="rval">{value}/4</span>
    </div>
  );
}
