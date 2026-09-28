import { Food } from "@/types/food";
import { FOODS } from "@/data/foods";
import { DietSettings, loadDietSettings, applyDietFilter } from "./dietFilter";

export type TimeSlot = "breakfast" | "lunch" | "snack" | "dinner" | "latenight";

export interface RotationResult {
  foods: Food[];
  title: string;
  slot: TimeSlot;
  dateStr: string;
}

/**
 * KST(한국 표준시) 기준 현재 날짜와 시간대를 계산합니다.
 */
export function getKstTimeInfo(dateObj?: Date): {
  dateStr: string;
  hour: number;
  slot: TimeSlot;
  title: string;
} {
  const target = dateObj ?? new Date();
  // KST: UTC + 9시간
  const kstMs = target.getTime() + 9 * 60 * 60 * 1000;
  const kstDate = new Date(kstMs);
  const dateStr = kstDate.toISOString().slice(0, 10);
  const hour = kstDate.getUTCHours();

  let slot: TimeSlot = "dinner";
  let title = "든든한 저녁으로 좋은 메뉴";

  if (hour >= 5 && hour < 11) {
    slot = "breakfast";
    title = "가볍게 시작하기 좋은 메뉴";
  } else if (hour >= 11 && hour < 15) {
    slot = "lunch";
    title = "점심으로 괜찮은 메뉴";
  } else if (hour >= 15 && hour < 18) {
    slot = "snack";
    title = "오후에 가볍게 즐기는 메뉴";
  } else if (hour >= 18 && hour < 22) {
    slot = "dinner";
    title = "든든한 저녁으로 좋은 메뉴";
  } else {
    slot = "latenight";
    title = "야식으로 딱인 메뉴";
  }

  return { dateStr, hour, slot, title };
}

/**
 * 2-2. 시간대별 후보군 선별 규칙
 * 기존 카테고리(kind), 테마(themes), 6축 점수(fill, light, ease, spice, comfort, warm) 기반 필터링
 */
export function filterCandidatesBySlot(foods: Food[], slot: TimeSlot): Food[] {
  switch (slot) {
    case "breakfast":
      // 05~10시: 소화 부담이 적고 가벼운 아침 식사 또는 간편 메뉴
      return foods.filter(
        (f) =>
          f.themes.includes("아침") ||
          (f.light >= 3 && f.ease >= 3 && f.spice <= 1 && f.fill <= 3)
      );

    case "lunch":
      // 11~14시: 점심 식사로 적절한 든든한 밥/면 식사류 (야식 전용 메뉴 제외)
      return foods.filter(
        (f) =>
          f.themes.includes("점심") ||
          (f.fill >= 2 && f.fill <= 4 && f.ease >= 2 && !f.themes.includes("야식"))
      );

    case "snack":
      // 15~17시: 간식, 베이커리, 디저트, 분식, 가벼운 요기류
      return foods.filter(
        (f) =>
          ["간편", "분식", "디저트", "패스트푸드"].includes(f.kind) ||
          (f.fill <= 2 && f.ease >= 3)
      );

    case "dinner":
      // 18~21시: 하루를 마무리하며 든든하게 먹는 저녁 및 모임/외식 식사
      return foods.filter(
        (f) =>
          f.themes.includes("퇴근") ||
          f.themes.includes("모임") ||
          (f.fill >= 3 && f.comfort >= 2)
      );

    case "latenight":
      // 22~04시: 야식 전용 메뉴, 안주류, 늦은 밤 혼자 간편하게 먹기 좋은 메뉴
      return foods.filter(
        (f) =>
          f.themes.includes("야식") ||
          f.kind === "야식" ||
          (f.ease >= 3 && f.themes.includes("혼자") && (f.fill >= 2 || f.spice >= 2))
      );
  }
}

/**
 * 32-bit FNV-1a 해시 함수: 문자열 시드를 고른 32비트 정수로 변환
 */
function hashString(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Mulberry32 난수 생성기: 동일 시드에서 항상 동일한 0~1 사이 실수 난수열 생성
 */
function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 시드 기반 결정적 Fisher-Yates 셔플
 */
function deterministicShuffle<T>(array: T[], rng: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 2-3. 카테고리 다양성 보장
 * 같은 카테고리(kind)가 연속 3개 이상 나오지 않도록 인터리빙
 */
function applyCategoryDiversity(shuffled: Food[], limit = 8): Food[] {
  const picked: Food[] = [];
  const remaining = [...shuffled];

  while (picked.length < limit && remaining.length > 0) {
    const len = picked.length;
    // 직전 2개가 동일 카테고리라면 3번째는 다른 카테고리 강제
    const mustAvoidKind =
      len >= 2 && picked[len - 1].kind === picked[len - 2].kind
        ? picked[len - 1].kind
        : null;

    let nextIndex = -1;
    if (mustAvoidKind) {
      nextIndex = remaining.findIndex((f) => f.kind !== mustAvoidKind);
    }

    if (nextIndex === -1) {
      nextIndex = 0;
    }

    picked.push(remaining[nextIndex]);
    remaining.splice(nextIndex, 1);
  }

  return picked;
}

/**
 * 2. 날짜 및 시간대 기반 고정 로테이션 메뉴를 생성합니다.
 */
export function getRotatedFoods(options?: {
  date?: Date;
  dietSettings?: DietSettings;
  limit?: number;
}): RotationResult {
  const limit = options?.limit ?? 8;
  const { dateStr, slot, title } = getKstTimeInfo(options?.date);

  // 1) 시간대별 후보군 추출
  let candidatePool = filterCandidatesBySlot(FOODS, slot);
  if (candidatePool.length === 0) {
    candidatePool = [...FOODS];
  }

  // 2) 알레르기·식이 필터 적용 (2-5)
  const settings = options?.dietSettings ?? loadDietSettings();
  const filteredPool = applyDietFilter(candidatePool, settings);
  // 만약 제외 조건으로 인해 후보가 너무 부족하면 원본 후보풀에서 보충하되 필터링 결과 우선
  const poolToUse = filteredPool.length > 0 ? filteredPool : candidatePool;

  // 3) 날짜(KST YYYY-MM-DD)와 시간대(slot)를 결합한 시드로 결정적 난수 생성 (2-1)
  const seedKey = `${dateStr}-${slot}`;
  const seedInt = hashString(seedKey);
  const rng = mulberry32(seedInt);

  // 4) 결정적 셔플
  const shuffled = deterministicShuffle(poolToUse, rng);

  // 5) 카테고리 다양성 적용 (2-3)
  const finalFoods = applyCategoryDiversity(shuffled, limit);

  return {
    foods: finalFoods,
    title,
    slot,
    dateStr,
  };
}
