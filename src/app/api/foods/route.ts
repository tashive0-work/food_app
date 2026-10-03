import { NextResponse } from "next/server";
import { getLiveFoods } from "@/lib/getFoods";

export async function GET() {
  const { foods, totalCount } = await getLiveFoods();
  
  return NextResponse.json(
    { foods, totalCount, count: foods.length },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
