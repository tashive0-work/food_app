"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { FOODS } from "@/data/foods";
import { Food } from "@/types/food";
import { mapUrl } from "@/lib/recommend";
import { logInteraction } from "@/lib/supabase";
import { MEAL_SLOTS, detectMeal, mealPenalty, type MealSlot } from "@/lib/mealTime";

/**
 * 음식 랜덤 룰렛.
 *
 * 왜 그냥 2,016개에서 뽑지 않는가: 그중 400개가 음료·디저트라서, 저녁에 돌렸는데
 * 「양배추즙」이 나오면 재미가 아니라 고장으로 보입니다. 끼니와 종류로 먼저 좁힙니다.
 *
 * 왜 진단으로 유도하는가: 룰렛이 더 쉬워서 진단을 안 하게 되면,
 * 쌓이는 건 「누가 룰렛을 돌렸다」뿐입니다. 룰렛은 입구이고 진단이 본체입니다.
 */

const SLICES = 8;
const SPIN_MS = 4200;

/** 룰렛 칸 색 — 브랜드 테라코타의 진하기만 바꿔 씁니다 */
const SLICE_FILL = ["#FFF3ED", "#FFE2D3"];
const SLICE_LINE = "#FFD9C6";

const KINDS = ["전체", "한식", "중식", "일식", "양식", "분식", "아시안", "간편", "야식", "디저트·카페"];

/** 끼니에 맞는 정도 — mealTime 의 벌점을 뒤집어 가중치로 씁니다 (0.3 ~ 2.2) */
function mealFit(food: Food, meal: MealSlot | null): number {
  if (!meal) return 1;
  const p = mealPenalty(food.themes, meal);
  return Math.max(0.3, Math.min(2.2, 1 - p));
}

/** 대중적인 메뉴가 더 자주 나오게 — 희귀 메뉴만 계속 나오면 룰렛이 재미없습니다 */
function weightOf(food: Food, meal: MealSlot | null): number {
  return ((food.popularity ?? 1) + 1) * mealFit(food, meal);
}

function pickWeighted(pool: Food[], weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return pool.length - 1;
}

/** 서로 다른 메뉴 8개를 뽑습니다 */
function pickCandidates(pool: Food[], meal: MealSlot | null): Food[] {
  if (pool.length <= SLICES) return [...pool];
  const rest = [...pool];
  const weights = rest.map((f) => weightOf(f, meal));
  const out: Food[] = [];
  for (let n = 0; n < SLICES && rest.length > 0; n++) {
    const i = pickWeighted(rest, weights);
    out.push(rest[i]);
    rest.splice(i, 1);
    weights.splice(i, 1);
  }
  return out;
}

/** 룰렛 칸에 들어갈 짧은 이름 */
function shortName(name: string): string {
  return name.length > 5 ? `${name.slice(0, 5)}…` : name;
}

function sector(cx: number, cy: number, r: number, from: number, to: number): string {
  const rad = (d: number) => ((d - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(rad(from));
  const y1 = cy + r * Math.sin(rad(from));
  const x2 = cx + r * Math.cos(rad(to));
  const y2 = cy + r * Math.sin(rad(to));
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
}

export function RouletteClient() {
  const [meal, setMeal] = useState<MealSlot | null>(() => detectMeal());
  const [kind, setKind] = useState("전체");
  const [candidates, setCandidates] = useState<Food[]>([]);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<Food | null>(null);
  const timer = useRef<number | null>(null);

  // 디저트·카페를 고르면 끼니는 의미가 없습니다 (커피에 아침·저녁이 없으니까요)
  const mealActive = kind !== "디저트·카페" ? meal : null;

  const pool = useMemo(() => {
    return FOODS.filter((f) => {
      if (kind === "전체") return f.kind !== "디저트·카페";
      return f.kind === kind;
    });
  }, [kind]);

  const reshuffle = useCallback(() => pickCandidates(pool, mealActive), [pool, mealActive]);

  // 조건이 바뀌면 룰렛 판을 새로 짭니다
  useEffect(() => {
    setCandidates(reshuffle());
    setWinner(null);
  }, [reshuffle]);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const spin = () => {
    if (spinning || pool.length === 0) return;
    const next = reshuffle();
    const win = Math.floor(Math.random() * Math.min(SLICES, next.length));

    // 당첨 칸이 위쪽 화살표 아래로 오도록 각도를 맞춥니다
    const seg = 360 / SLICES;
    const target = (360 - (win * seg + seg / 2)) % 360;
    const current = ((rotation % 360) + 360) % 360;
    const delta = (target - current + 360) % 360;

    setCandidates(next);
    setWinner(null);
    setSpinning(true);
    setRotation((r) => r + 360 * 5 + delta);

    timer.current = window.setTimeout(() => {
      setSpinning(false);
      setWinner(next[win]);
      logInteraction(null, next[win].name, 0, "roulette_spin");
    }, SPIN_MS);
  };

  const seg = 360 / SLICES;
  const R = 150;

  return (
    <>
      {/* 끼니 */}
      <div style={S.rowHead}>언제 드세요?</div>
      <div style={S.chips}>
        {MEAL_SLOTS.map((m) => {
          const on = mealActive === m.key;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => setMeal(m.key)}
              disabled={kind === "디저트·카페"}
              style={{ ...S.chip, ...(on ? S.chipOn : null), ...(kind === "디저트·카페" ? S.chipOff : null) }}
            >
              <span aria-hidden="true">{m.icon}</span> {m.label}
            </button>
          );
        })}
      </div>
      {kind === "디저트·카페" && (
        <p style={S.note}>디저트·카페는 끼니와 상관없이 돌립니다.</p>
      )}

      {/* 종류 */}
      <div style={S.rowHead}>어떤 종류로?</div>
      <div style={S.chips}>
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            style={{ ...S.chip, ...(kind === k ? S.chipOn : null) }}
          >
            {k}
          </button>
        ))}
      </div>
      <p style={S.note}>
        고른 조건에 맞는 메뉴 {pool.length.toLocaleString()}가지 중에서 8개를 올려 돌립니다.
      </p>

      {/* 룰렛 */}
      <div style={S.stage}>
        <div style={S.pointer} aria-hidden="true" />
        <div
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.16, 0.84, 0.22, 1)` : "none",
            willChange: "transform",
          }}
        >
          <svg width="100%" viewBox="0 0 320 320" role="img" aria-label="음식 룰렛">
            <circle cx="160" cy="160" r={R + 6} fill="#FFFFFF" stroke={SLICE_LINE} strokeWidth="2" />
            {candidates.map((f, i) => (
              <path
                key={`${f.id}-s`}
                d={sector(160, 160, R, i * seg, (i + 1) * seg)}
                fill={SLICE_FILL[i % 2]}
                stroke={SLICE_LINE}
                strokeWidth="1.5"
              />
            ))}
            {candidates.map((f, i) => {
              const mid = i * seg + seg / 2 - 90;
              const flip = mid > 90 || mid < -90 ? 180 : 0;
              return (
                <text
                  key={`${f.id}-t`}
                  transform={`rotate(${mid} 160 160) translate(${160 + R * 0.6} 160) rotate(${flip})`}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="15"
                  fontWeight={700}
                  fill="#5A3A2C"
                >
                  {shortName(f.name)}
                </text>
              );
            })}
            <circle cx="160" cy="160" r="26" fill="#FFFFFF" stroke={SLICE_LINE} strokeWidth="2" />
            <text x="160" y="160" textAnchor="middle" dominantBaseline="central" fontSize="20" aria-hidden="true">
              🍽️
            </text>
          </svg>
        </div>
      </div>

      <button type="button" className="btn btnMain" style={S.spinBtn} onClick={spin} disabled={spinning}>
        {spinning ? "돌리는 중…" : winner ? "다시 돌리기" : "돌리기"}
      </button>

      {/* 결과 */}
      {winner && !spinning && (
        <div style={S.result}>
          <p style={S.resultHead}>오늘은 이거!</p>
          <div style={S.resultCard}>
            {(winner.imageThumb || winner.image) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={winner.imageThumb || winner.image}
                alt={winner.name}
                width={84}
                height={84}
                style={S.resultImg}
              />
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={S.resultName}>{winner.name}</p>
              <p style={S.resultKind}>{winner.kind}</p>
            </div>
          </div>
          <div style={S.resultBtns}>
            <Link
              href={`/food/${encodeURIComponent(winner.name)}`}
              style={{ ...S.smallBtn, ...S.smallBtnGhost }}
              onClick={() => logInteraction(null, winner.name, 0, "roulette_pick")}
            >
              메뉴 보기
            </Link>
            <a
              href={mapUrl(winner.name)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...S.smallBtn, ...S.smallBtnMain }}
              onClick={() => logInteraction(null, winner.name, 0, "roulette_pick")}
            >
              파는 곳 찾기
            </a>
          </div>
        </div>
      )}

      {/* 진단으로 유도 — 룰렛은 입구이고 진단이 본체입니다 */}
      <div style={S.quizBox}>
        <p style={S.quizTitle}>운에 맡기기 아쉽다면</p>
        <p style={S.quizDesc}>
          8문항만 답하면 지금 배고픈 정도, 기분, 남은 시간까지 따져서 골라드려요.
        </p>
        <Link href="/quiz" style={S.quizBtn}>
          진단으로 골라보기 →
        </Link>
      </div>
    </>
  );
}

const S: Record<string, React.CSSProperties> = {
  rowHead: { fontSize: 13.5, fontWeight: 800, color: "var(--ink)", margin: "18px 0 9px" },
  chips: { display: "flex", flexWrap: "wrap", gap: 7 },
  chip: {
    padding: "8px 13px",
    borderRadius: 999,
    border: "1px solid var(--border)",
    background: "#FFFFFF",
    fontSize: 13,
    fontWeight: 600,
    color: "var(--dim)",
    cursor: "pointer",
  },
  chipOn: { background: "#191F28", borderColor: "#191F28", color: "#FFFFFF", fontWeight: 700 },
  chipOff: { opacity: 0.4, cursor: "not-allowed" },
  note: { fontSize: 12, color: "var(--faint)", margin: "9px 0 0", lineHeight: 1.6 },
  stage: { position: "relative", margin: "20px auto 0", maxWidth: 340, padding: "14px 10px 0" },
  pointer: {
    position: "absolute",
    top: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: 0,
    height: 0,
    borderLeft: "11px solid transparent",
    borderRight: "11px solid transparent",
    borderTop: "18px solid #E8663D",
    zIndex: 2,
  },
  spinBtn: { display: "block", width: "100%", marginTop: 16, textAlign: "center" },
  result: { marginTop: 18 },
  resultHead: { fontSize: 13, fontWeight: 800, color: "#E8663D", margin: "0 0 8px" },
  resultCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: "var(--r-lg, 16px)",
    border: "1px solid var(--border)",
    background: "#FFFFFF",
    boxShadow: "var(--sh1)",
  },
  resultImg: { width: 84, height: 84, borderRadius: 12, objectFit: "cover", display: "block", flexShrink: 0 },
  resultName: { fontSize: 19, fontWeight: 800, color: "var(--ink)", margin: 0, wordBreak: "keep-all" },
  resultKind: { fontSize: 12.5, color: "var(--dim)", margin: "4px 0 0" },
  resultBtns: { display: "flex", gap: 8, marginTop: 10 },
  smallBtn: {
    flex: 1,
    padding: "13px 12px",
    borderRadius: 13,
    fontSize: 13.5,
    fontWeight: 800,
    textAlign: "center",
    textDecoration: "none",
  },
  smallBtnGhost: { border: "1.5px solid var(--border)", background: "#FFFFFF", color: "var(--ink)" },
  smallBtnMain: { border: "none", background: "#191F28", color: "#FFFFFF" },
  quizBox: {
    marginTop: 26,
    padding: "18px 16px",
    borderRadius: "var(--r-lg, 16px)",
    background: "#F2F4F6",
  },
  quizTitle: { fontSize: 14.5, fontWeight: 800, color: "var(--ink)", margin: "0 0 5px" },
  quizDesc: { fontSize: 12.5, color: "var(--dim)", lineHeight: 1.6, margin: "0 0 12px", wordBreak: "keep-all" },
  quizBtn: {
    display: "block",
    padding: "12px",
    borderRadius: 12,
    background: "#FFFFFF",
    border: "1px solid var(--border)",
    textAlign: "center",
    fontSize: 13.5,
    fontWeight: 800,
    color: "var(--ink)",
    textDecoration: "none",
  },
};
