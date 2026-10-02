import type { Metadata } from "next";
import RegionClient from "./RegionClient";

export const metadata: Metadata = {
  title: "지역 음식 | 오늘 뭐 먹지",
  description:
    "여행 중이거나 낯선 동네에 있을 때. 17개 시·도의 대표 음식과 그 음식을 파는 곳을 바로 찾아보세요.",
  alternates: {
    canonical: "https://eatodayme.com/region",
  },
  openGraph: {
    title: "지역 음식 | 오늘 뭐 먹지",
    description:
      "여행 중이거나 낯선 동네에 있을 때. 17개 시·도의 대표 음식과 그 음식을 파는 곳을 바로 찾아보세요.",
    url: "https://eatodayme.com/region",
  },
};

export default function RegionPage() {
  return <RegionClient />;
}
