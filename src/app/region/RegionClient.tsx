"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { FOODS } from "@/data/foods";
import { REGIONS, guessRegion, type Region } from "@/data/regions";
import { nearbyUrl, getCachedLocation, getCurrentLocation } from "@/lib/location";
import { logInteraction } from "@/lib/supabase";

/**
 * 스타일을 globals.css 가 아니라 이 파일에 둡니다.
 * globals.css 는 다른 도구가 덮어쓰는 일이 잦아서, 여기 두면 같이 안 날아갑니다.
 */
const S: Record<string, React.CSSProperties> = {
  lead: { fontSize: 13.5, lineHeight: 1.65, color: "#6B7684", margin: "2px 0 14px" },
  locBox: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "12px 14px", marginBottom: 16,
    border: "1px solid #E5E8EB", borderRadius: 14, background: "#FAFBFC",
  },
  locText: { flex: 1, minWidth: 0, fontSize: 12.5, color: "#6B7684", lineHeight: 1.5 },
  locBtn: {
    flex: "none", padding: "8px 13px", borderRadius: 9999,
    border: "none", background: "#191F28", color: "#fff",
    fontSize: 12, fontWeight: 800, cursor: "pointer",
  },
  chips: { display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 18 },
  chip: {
    padding: "9px 14px", borderRadius: 9999,
    border: "1.5px solid #E5E8EB", background: "#fff",
    fontSize: 13.5, fontWeight: 700, color: "#6B7684", cursor: "pointer",
  },
  chipOn: {
    padding: "9px 14px", borderRadius: 9999,
    border: "1.5px solid #191F28", background: "#191F28",
    fontSize: 13.5, fontWeight: 800, color: "#fff", cursor: "pointer",
  },
  intro: {
    padding: "14px 16px", marginBottom: 14,
    borderRadius: 14, background: "#FFF6F1",
    fontSize: 13.5, lineHeight: 1.65, color: "#4E5968",
  },
  list: { display: "flex", flexDirection: "column", gap: 8 },
  row: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "12px 14px",
    border: "1px solid #E5E8EB", borderRadius: 14, background: "#fff",
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 15, fontWeight: 700, color: "#191F28", textDecoration: "none" },
  rowMeta: { display: "block", fontSize: 11.5, color: "#8B95A1", marginTop: 3 },
  mapBtn: {
    flex: "none", padding: "9px 12px", borderRadius: 10,
    border: "1.5px solid #FFE1D4", background: "#FFF6F1",
    fontSize: 12, fontWeight: 800, color: "#FF6B35", textDecoration: "none",
    whiteSpace: "nowrap",
  },
  note: { fontSize: 11.5, lineHeight: 1.7, color: "#8B95A1", margin: "18px 0 4px" },
};

export default function RegionClient() {
  const [picked, setPicked] = useState<Region | null>(null);
  const [guessed, setGuessed] = useState<Region | null>(null);
  const [locBusy, setLocBusy] = useState(false);
  const [locDenied, setLocDenied] = useState(false);

  /** 메뉴로 등록돼 있는 이름만 모아둡니다 (상세 페이지 연결 여부 판단용). */
  const menuByName = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of FOODS) m.set(f.name, f.kind);
    return m;
  }, []);

  // 이미 위치를 허용한 적이 있으면 물어보지 않고 지역을 미리 골라둡니다.
  React.useEffect(() => {
    const c = getCachedLocation();
    if (!c) return;
    const r = guessRegion(c.lat, c.lng);
    setGuessed(r);
    setPicked((prev) => prev ?? r);
  }, []);

  const findMyRegion = async () => {
    setLocBusy(true);
    const c = await getCurrentLocation();
    setLocBusy(false);
    if (!c) { setLocDenied(true); return; }
    const r = guessRegion(c.lat, c.lng);
    setGuessed(r);
    setPicked(r);
  };

  return (
    <div className="app hasNav">
      <main className="wrap">
        <header className="pageHead">
          <Link href="/" className="pageBack" aria-label="홈으로">←</Link>
          <h1 className="pageTitle">지역 음식</h1>
        </header>

        <p style={S.lead}>
          여행 중이거나 낯선 동네에 있을 때.
          <br />
          지역을 고르면 그 지역에서 먼저 떠올리는 음식과, 그 음식을 파는 곳을 찾아드립니다.
        </p>

        <div style={S.locBox}>
          <span aria-hidden="true" style={{ fontSize: 18 }}>📍</span>
          <span style={S.locText}>
            {guessed ? (
              <>
                지금 위치로는 <b style={{ color: "#191F28" }}>{guessed.label}</b> 같습니다.
                다르면 아래에서 직접 골라 주세요.
              </>
            ) : locDenied ? (
              <>위치를 못 받았습니다. 아래에서 지역을 직접 골라 주세요.</>
            ) : (
              <>어느 지역에 계신지 찾아볼 수 있습니다. 직접 고르셔도 됩니다.</>
            )}
          </span>
          {!guessed && !locDenied && (
            <button
              type="button"
              style={{ ...S.locBtn, opacity: locBusy ? 0.6 : 1 }}
              onClick={findMyRegion}
              disabled={locBusy}
            >
              {locBusy ? "찾는 중…" : "내 위치로 찾기"}
            </button>
          )}
        </div>

        <div style={S.chips} role="group" aria-label="지역 고르기">
          {REGIONS.map((r) => {
            const on = picked?.key === r.key;
            return (
              <button
                key={r.key}
                type="button"
                style={on ? S.chipOn : S.chip}
                aria-pressed={on}
                onClick={() => setPicked(r)}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        {!picked ? (
          <p style={S.note}>지역을 하나 눌러 주세요.</p>
        ) : (
          <>
            <div style={S.intro}>
              <b style={{ color: "#191F28" }}>{picked.label}</b> — {picked.intro}
            </div>

            <div style={S.list}>
              {picked.foods.map((name) => {
                const kind = menuByName.get(name);
                return (
                  <div key={name} style={S.row}>
                    <div style={S.rowBody}>
                      {kind ? (
                        <Link href={`/food/${encodeURIComponent(name)}`} style={S.rowName}>
                          {name}
                        </Link>
                      ) : (
                        <span style={S.rowName}>{name}</span>
                      )}
                      <span style={S.rowMeta}>
                        {kind ? `${kind} · 눌러서 자세히 보기` : `${picked.label} 별미`}
                      </span>
                    </div>
                    <a
                      style={S.mapBtn}
                      href={nearbyUrl(name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => logInteraction(null, name, 0, "map_click")}
                    >
                      파는 곳
                    </a>
                  </div>
                );
              })}
            </div>

            <p style={S.note}>
              「파는 곳」은 네이버 지도로 넘어갑니다. 위치를 허용해 두면 내 주변에서 찾습니다.
              <br />
              빠진 음식이 있으면 알려주세요 — 채워 넣겠습니다.
            </p>
          </>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
