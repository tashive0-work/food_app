import type { Metadata } from "next";
import QuizClient from "./QuizClient";

export const metadata: Metadata = {
  title: "메뉴 추천 진단 — 8문항으로 오늘 메뉴 고르기",
  description: "8문항으로 취향과 상태에 맞는 오늘 점심·저녁 메뉴를 진단해 드립니다.",
  alternates: {
    canonical: "https://eatodayme.com/quiz",
  },
  openGraph: {
    title: "메뉴 추천 진단 — 8문항으로 오늘 메뉴 고르기 | 오늘의 잇템",
    description: "8문항으로 취향과 상태에 맞는 오늘 점심·저녁 메뉴를 진단해 드립니다.",
    url: "https://eatodayme.com/quiz",
  },
};

export default function QuizPage() {
  return <QuizClient />;
}
