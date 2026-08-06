import { Food } from "@/types/food";
import { ALLERGENS, DIET_PREFS } from "@/data/allergens";

export interface DietSettings {
  allergens: string[];
  diets: string[];
}

const KEY = "food_diet_settings";

export function loadDietSettings(): DietSettings {
  if (typeof window === "undefined") return { allergens: [], diets: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { console.error(e); }
  return { allergens: [], diets: [] };
}

export function saveDietSettings(s: DietSettings): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(s)); }
  catch (e) { console.error(e); }
}

/** 설정에 따라 제외 대상 메뉴를 걸러냅니다. */
export function applyDietFilter(foods: Food[], s: DietSettings): Food[] {
  if (!s.allergens.length && !s.diets.length) return foods;

  const keywords: string[] = [];
  let excludeSpicy = false;

  s.allergens.forEach((k) => {
    if (k === "spicy") { excludeSpicy = true; return; }
    const a = ALLERGENS.find((x) => x.key === k);
    if (a) keywords.push(...a.excludeKeywords);
  });
  s.diets.forEach((k) => {
    const d = DIET_PREFS.find((x) => x.key === k);
    if (d) keywords.push(...d.excludeKeywords);
  });

  return foods.filter((f) => {
    if (excludeSpicy && f.spice >= 3) return false;
    return !keywords.some((kw) => f.name.includes(kw));
  });
}
