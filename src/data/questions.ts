import { Question } from "@/types/food";

export const QUESTIONS: Question[] = [
  {
    q: "나이대가 어떻게 되세요?",
    a: [
      ["14–19세", { set: { ageGroup: "10s" } }],
      ["20–30대", { set: { ageGroup: "2030s" } }],
      ["40–50대 이상", { set: { ageGroup: "4050s" } }],
      ["말 안 할래요", { set: { ageGroup: "unknown" } }],
    ],
  },
  {
    q: "지금 배는 어느 정도인가요?",
    a: [
      ["아직 괜찮아요", { set: { hunger: 1 } }],
      ["슬슬 출출해요", { set: { hunger: 2 } }],
      ["꽤 고파요", { set: { hunger: 3 } }],
      ["눈앞이 흐려요", { set: { hunger: 4 } }],
    ],
  },
  {
    q: "오늘 하루, 기분은 어땠어요?",
    a: [
      ["꽤 좋았어요", { set: { comfort: 1 }, add: { energy: 1 } }],
      ["그냥 그랬어요", { set: { comfort: 2 } }],
      ["좀 지쳤어요", { set: { comfort: 3 }, add: { energy: -1 } }],
      ["말도 마세요", { set: { comfort: 4 }, add: { energy: -1, spice: 1 } }],
    ],
  },
  {
    q: "몸 상태는 어떤가요?",
    a: [
      ["쌩쌩해요", { set: { energy: 4 } }],
      ["보통이에요", { set: { energy: 3 } }],
      ["나른해요", { set: { energy: 2 } }],
      ["속이 안 좋아요", { set: { energy: 1 }, add: { spice: -2 } }],
    ],
  },
  {
    q: "입이 원하는 건 어느 쪽이에요?",
    a: [
      ["맵고 얼큰한 거", { set: { spice: 4 } }],
      ["짭조름하고 기름진 거", { set: { spice: 3 } }],
      ["담백하고 깔끔한 거", { set: { spice: 1 } }],
      ["달콤한 거", { set: { spice: 2 }, add: { comfort: 1 } }],
    ],
  },
  {
    q: "먹기까지 쓸 수 있는 시간은요?",
    a: [
      ["10분 안에 끝내고 싶어요", { set: { time: 1 } }],
      ["30분쯤은 괜찮아요", { set: { time: 2 } }],
      ["한 시간은 여유 있어요", { set: { time: 3 } }],
      ["오늘은 시간이 넉넉해요", { set: { time: 4 } }],
    ],
  },
  {
    q: "지금 몸이 원하는 온도는?",
    a: [
      ["뜨끈한 국물", { set: { warm: 4 } }],
      ["따뜻한 한 그릇", { set: { warm: 3 } }],
      ["시원한 거", { set: { warm: 0 } }],
      ["딱히 상관없어요", { set: { warm: 2 } }],
    ],
  },
  {
    q: "오늘은 누구랑 먹어요?",
    a: [
      ["혼자요", { set: { social: "혼자" } }],
      ["둘이서", { set: { social: "둘" } }],
      ["여럿이", { set: { social: "모임" } }],
      ["아직 몰라요", { set: { social: "미정" } }],
    ],
  },
];
