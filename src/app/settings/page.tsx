"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ALLERGENS, DIET_PREFS } from "@/data/allergens";
import { loadDietSettings, saveDietSettings, DietSettings } from "@/lib/dietFilter";
import { BottomNav } from "@/components/BottomNav";

export default function SettingsPage() {
  const [settings, setSettings] = useState<DietSettings>({ allergens: [], diets: [] });
  const [favorites, setFavorites] = useState<number[]>([]);

  useEffect(() => {
    setSettings(loadDietSettings());
    try {
      const f = localStorage.getItem("food_favorites");
      if (f) setFavorites(JSON.parse(f));
    } catch (e) { console.error(e); }
  }, []);

  const toggleAllergen = (key: string) => {
    const next = {
      ...settings,
      allergens: settings.allergens.includes(key)
        ? settings.allergens.filter((k) => k !== key)
        : [...settings.allergens, key],
    };
    setSettings(next);
    saveDietSettings(next);
  };

  const toggleDiet = (key: string) => {
    const next = {
      ...settings,
      diets: settings.diets.includes(key)
        ? settings.diets.filter((k) => k !== key)
        : [...settings.diets, key],
    };
    setSettings(next);
    saveDietSettings(next);
  };

  return (
    <div className="app hasNav">
      <main className="wrap">
        <header className="pageHead">
          <Link href="/" className="pageBack" aria-label="홈으로">←</Link>
          <h1 className="pageTitle">제외 조건 설정</h1>
        </header>

        <div className="legalNotice" style={{ marginBottom: "24px" }}>
          <p>
            <strong>주의사항</strong>
            <br />
            이 기능은 메뉴 이름을 기준으로 제외하는 보조 도구입니다. 실제 조리 방식과 재료는 매장마다 다를 수 있으므로 완전하지 않습니다. 심각한 알레르기가 있는 경우 반드시 매장에 직접 확인하시고, 의사 또는 영양사와 상담하세요.
          </p>
        </div>

        <section className="secHead" style={{ marginTop: 0 }}>
          <h2 className="secTitle">알레르기 유발 성분 제외</h2>
          <p className="secSub">해당 식재료가 포함된 메뉴를 추천에서 제외합니다.</p>
        </section>
        <div>
          {ALLERGENS.map((item) => {
            const checked = settings.allergens.includes(item.key);
            return (
              <div
                key={item.key}
                className="settingRow"
                onClick={() => toggleAllergen(item.key)}
                style={{ cursor: "pointer" }}
              >
                <span className="settingLabel">{item.label}</span>
                <div className={checked ? "settingCheck on" : "settingCheck"}>✓</div>
              </div>
            );
          })}
        </div>

        <section className="secHead" style={{ marginTop: "32px" }}>
          <h2 className="secTitle">식단 선호</h2>
          <p className="secSub">선호하는 식단 조건에 맞춰 메뉴를 제외합니다.</p>
        </section>
        <div>
          {DIET_PREFS.map((item) => {
            const checked = settings.diets.includes(item.key);
            return (
              <div
                key={item.key}
                className="settingRow"
                onClick={() => toggleDiet(item.key)}
                style={{ cursor: "pointer" }}
              >
                <span className="settingLabel">{item.label}</span>
                <div className={checked ? "settingCheck on" : "settingCheck"}>✓</div>
              </div>
            );
          })}
        </div>
      </main>
      <BottomNav favCount={favorites.length} />
    </div>
  );
}
