import type { Metadata } from "next";
import { FOODS } from "@/data/foods";
import { getFoodGuide } from "@/data/foodGuides";
import FoodDetailClient from "./FoodDetailClient";

interface PageProps {
  params: { name: string };
}

function findFoodServer(raw: string) {
  const name = decodeURIComponent(raw || "");
  return (
    FOODS.find((f) => f.name === name) ||
    FOODS.find((f) => f.name.replace(/\s+/g, "") === name.replace(/\s+/g, "")) ||
    null
  );
}

// 메뉴 상세 페이지를 빌드 때 미리 HTML로 만들어 둡니다 (검색엔진이 바로 읽을 수 있게).
export function generateStaticParams() {
  return FOODS.map((f) => ({ name: f.name }));
}

// 메뉴마다 고유한 제목·설명·대표주소를 붙입니다.
export function generateMetadata({ params }: PageProps): Metadata {
  const food = findFoodServer(params.name);
  if (!food) {
    return { title: "메뉴를 찾을 수 없어요", robots: { index: false } };
  }
  const guide = getFoodGuide(food.name, food.kind, food.spice, food.warm);
  const variants = food.variants?.length ? ` 종류: ${food.variants.slice(0, 4).join(", ")}.` : "";
  const title = `${food.name} 추천 — 이럴 때 먹어요`;
  const description = `${food.name}, ${guide.bestWhen.replace(/[.!]$/, "")}. 꿀조합: ${guide.pairing}.${variants}`.slice(0, 155);
  const path = `/food/${encodeURIComponent(food.name)}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title: `${title} | 오늘 뭐 먹지`, description, url: path, type: "article" },
    twitter: { title: `${title} | 오늘 뭐 먹지`, description },
  };
}

export default function FoodDetailPage({ params }: PageProps) {
  return <FoodDetailClient params={params} />;
}
