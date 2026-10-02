import type { Metadata } from "next";
import { FOODS } from "@/data/foods";
import { getFoodGuide } from "@/data/foodGuides";
import { getRelatedFoods } from "@/lib/relatedFoods";
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

export function generateStaticParams() {
  return FOODS.map((f) => ({ name: f.name }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const food = findFoodServer(params.name);
  if (!food) {
    return { title: "메뉴를 찾을 수 없어요", robots: { index: false } };
  }
  const guide = getFoodGuide(food.name, food.kind, food.spice, food.warm);
  const variants = food.variants?.length ? ` 종류: ${food.variants.slice(0, 4).join(", ")}.` : "";
  const title = `${food.name} 추천 — 이럴 때 먹어요`;
  const description = `${food.name}, ${guide.bestWhen.replace(/[.!]$/, "")}. 꿀조합: ${guide.pairing}.${variants}`.slice(0, 155);
  const encodedName = encodeURIComponent(food.name);
  const path = `/food/${encodedName}`;
  const ogImageUrl = `https://eatodayme.com/og/food/${encodedName}`;
  return {
    title,
    description,
    alternates: { canonical: `https://eatodayme.com${path}` },
    openGraph: {
      title: `${title} | 오늘의 잇템`,
      description,
      url: `https://eatodayme.com${path}`,
      type: "article",
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | 오늘의 잇템`,
      description,
      images: [ogImageUrl],
    },
  };
}

export default function FoodDetailPage({ params }: PageProps) {
  const food = findFoodServer(params.name);
  const initialRelated = food ? getRelatedFoods(food, { limit: 6 }) : [];

  const breadcrumbJsonLd = food
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "홈",
            item: "https://eatodayme.com/",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "메뉴 전체",
            item: "https://eatodayme.com/food",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: food.name,
            item: `https://eatodayme.com/food/${encodeURIComponent(food.name)}`,
          },
        ],
      }
    : null;

  return (
    <>
      {breadcrumbJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      )}
      <FoodDetailClient params={params} initialRelated={initialRelated} />
    </>
  );
}
