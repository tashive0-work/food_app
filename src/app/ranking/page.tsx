"use client";
import React, { useState } from "react";
import Link from "next/link";
import { FOODS } from "@/data/foods";
import { BottomNav } from "@/components/BottomNav";

import { loadDietSettings, applyDietFilter } from "@/lib/dietFilter";

const AXES = [
  { key: "ease",  label: "빨리 되는 순", desc: "조리·대기 시간이 짧은 메뉴" },
  { key: "light", label: "속 편한 순",   desc: "소화 부담이 적은 메뉴" },
  { key: "fill",  label: "든든한 순",    desc: "포만감이 큰 메뉴" },
  { key: "spice", label: "얼큰한 순",    desc: "자극이 강한 메뉴" },
] as const;

export default function RankingPage() {
  const [axis, setAxis] = useState<string>("ease");
  const current = AXES.find(a => a.key === axis)!;
  const rawList = [...FOODS]
    .sort((a,b) => (b[axis as keyof typeof b] as number) - (a[axis as keyof typeof a] as number));
  const list = applyDietFilter(rawList, loadDietSettings()).slice(0, 20);

  return (
    <div className="app hasNav">
      <main className="wrap">
        <header className="pageHead">
          <Link href="/" className="pageBack" aria-label="홈으로">←</Link>
          <h1 className="pageTitle">편의도 랭킹 🏆</h1>
        </header>

        <div className="chips" style={{marginBottom:"20px"}}>
          {AXES.map(a => (
            <button key={a.key}
              className={axis===a.key ? "chip on" : "chip"}
              onClick={() => setAxis(a.key)}>
              {a.label}
            </button>
          ))}
        </div>

        <div className="secHead">
          <h2 className="secTitle">{current.label}</h2>
          <p className="secSub">{current.desc}</p>
        </div>

        <div className="rankList">
          {list.map((f, i) => {
            const v = f[axis as keyof typeof f] as number;
            return (
              <div key={f.id} className="rankItem">
                <span className="rankItemNo">{i+1}</span>
                <div className="rankItemMain">
                  <p className="rankItemName">{f.name}</p>
                  <p className="rankItemKind">{f.kind}</p>
                </div>
                <div className="rankItemBar">
                  <div className="rankItemFill" style={{width:`${(v/4)*100}%`}} />
                </div>
                <span className="rankItemVal">{v}/4</span>
              </div>
            );
          })}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
