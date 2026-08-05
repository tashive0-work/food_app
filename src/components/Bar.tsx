import React from "react";

export function Bar({ label, value }: { label: string; value: number }) {
  const pct = (value / 4) * 100;
  return (
    <div className="statRow">
      <span className="statLabel">{label}</span>
      <div className="statTrack">
        <div className="statFill" style={{ width: `${pct}%` }} />
      </div>
      <span className="statVal">{value}</span>
    </div>
  );
}
