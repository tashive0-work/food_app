import type { Metadata } from "next";
import SearchClient from "./SearchClient";

export const metadata: Metadata = {
  title: "메뉴 검색",
  description: "먹고 싶은 음식을 이름, 종류, 상황별 키워드로 빠르게 검색해보세요.",
  alternates: {
    canonical: "https://eatodayme.com/search",
  },
  openGraph: {
    title: "메뉴 검색 | 오늘의 잇템",
    description: "먹고 싶은 음식을 이름, 종류, 상황별 키워드로 빠르게 검색해보세요.",
    url: "https://eatodayme.com/search",
  },
};

export default function SearchPage() {
  return <SearchClient />;
}
