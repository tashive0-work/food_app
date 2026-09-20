/**
 * 배달 앱 (배민, 쿠팡이츠, 요기요) 및 레시피 서비스 파트너십 딥링크/UTM 트래킹 유틸리티
 */

export interface DeliveryApp {
  name: string;
  icon: string;
  getUrl: (foodName: string) => string;
}

export const DELIVERY_APPS: DeliveryApp[] = [
  {
    name: "배달의민족",
    icon: "🛵",
    getUrl: (n: string) =>
      `https://www.baemin.com/search?keyword=${encodeURIComponent(n)}&utm_source=foodmood&utm_medium=affiliate`,
  },
  {
    name: "쿠팡이츠",
    icon: "⚡",
    getUrl: (n: string) =>
      `https://www.coupangeats.com/search?q=${encodeURIComponent(n)}&utm_source=foodmood&utm_medium=affiliate`,
  },
  {
    name: "요기요",
    icon: "🍔",
    getUrl: (n: string) =>
      `https://www.yogiyo.co.kr/mobile/#/search/${encodeURIComponent(n)}/?utm_source=foodmood&utm_medium=affiliate`,
  },
];

export function getAffiliateRecipeUrl(foodName: string): string {
  return `https://www.10000recipe.com/recipe/list.html?q=${encodeURIComponent(
    foodName
  )}&utm_source=foodmood&utm_medium=partner`;
}
