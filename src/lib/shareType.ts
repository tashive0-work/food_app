/**
 * 공유 카드에 쓰는 「오늘의 음식 유형」.
 *
 * classify() 가 돌려주는 문구는 화면 안에서 읽히도록 쓴 설명문이라
 * (「속을 달래야 하는 상태」) 그대로 공유하면 담백합니다.
 * 공유 카드에서는 짧고 집어가는 이름이 필요해서 따로 둡니다.
 * 화면 안 문구는 건드리지 않습니다 — 여기만 공유용입니다.
 */
export interface ShareType {
  /** 공유 링크에 들어가는 짧은 키 */
  key: string;
  /** 카드에 크게 들어가는 이름 */
  name: string;
  /** 이름 아래 한 줄 */
  line: string;
  emoji: string;
}

/** classify() 의 title → 공유용 유형 */
const BY_VERDICT: Record<string, ShareType> = {
  "속을 달래야 하는 상태": {
    key: "soothe", name: "속 달래기 장인", emoji: "🥣",
    line: "오늘은 몸이 쉬자고 말하는 날",
  },
  "당장 채워야 하는 상태": {
    key: "rush", name: "5분 안에 해결파", emoji: "⚡",
    line: "고민은 사치, 일단 배부터",
  },
  "매콤한 위로가 필요한 상태": {
    key: "spicy", name: "매운맛 응급환자", emoji: "🌶️",
    line: "힘든 날엔 얼큰한 게 약입니다",
  },
  "얼큰한 게 당기는 상태": {
    key: "fire", name: "얼큰 중독자", emoji: "🔥",
    line: "입이 자극을 부르는 날",
  },
  "따뜻한 게 필요한 상태": {
    key: "cozy", name: "포근한 한 그릇파", emoji: "🤍",
    line: "맛보다 위로가 먼저인 날",
  },
  "제대로 먹어야 하는 상태": {
    key: "proper", name: "제대로 한 상 차림파", emoji: "🍚",
    line: "몸도 입도 준비 완료",
  },
  "가볍게 끝내고 싶은 상태": {
    key: "light", name: "가볍게 넘기는 사람", emoji: "🍃",
    line: "많이는 안 당기는 날",
  },
  "천천히 즐기고 싶은 상태": {
    key: "slow", name: "느긋한 미식가", emoji: "🍷",
    line: "시간도 기력도 여유로운 날",
  },
  "시원한 게 당기는 상태": {
    key: "cool", name: "시원한 것만 찾는 사람", emoji: "🧊",
    line: "뜨거운 건 오늘 아니에요",
  },
  "무난하게 잘 먹고 싶은 상태": {
    key: "balanced", name: "실패 없는 무난파", emoji: "🍽️",
    line: "튀지 않고 균형 잡힌 하루",
  },
};

const FALLBACK: ShareType = BY_VERDICT["무난하게 잘 먹고 싶은 상태"];

/** 진단 결과 문구로 공유용 유형을 찾습니다. */
export function shareTypeOf(verdictTitle: string | undefined): ShareType {
  if (!verdictTitle) return FALLBACK;
  return BY_VERDICT[verdictTitle] ?? FALLBACK;
}

/** 공유 링크의 키로 유형을 되찾습니다 (공유받은 사람 화면에서 씁니다). */
export function shareTypeByKey(key: string | undefined): ShareType {
  if (!key) return FALLBACK;
  return Object.values(BY_VERDICT).find((t) => t.key === key) ?? FALLBACK;
}

/** 공유 링크 주소 */
export function shareUrlOf(typeKey: string, foodName: string): string {
  const q = new URLSearchParams({ t: typeKey, f: foodName });
  return `https://eatodayme.com/r?${q.toString()}`;
}
