import type { Metadata } from "next";
import TrendClient from "./TrendClient";

export const metadata: Metadata = {
  title: "요즘 뜨는 메뉴 순위",
  description: "실시간 검색어와 트렌드 데이터를 분석하여 요즘 가장 인기가 높은 인기 메뉴 순위를 알려드립니다.",
  alternates: {
    canonical: "https://eatodayme.com/trend",
  },
  openGraph: {
    title: "요즘 뜨는 메뉴 순위 | 오늘의 잇템",
    description: "실시간 검색어와 트렌드 데이터를 분석하여 요즘 가장 인기가 높은 인기 메뉴 순위를 알려드립니다.",
    url: "https://eatodayme.com/trend",
  },
};

export default function TrendPage() {
  return <TrendClient />;
}
