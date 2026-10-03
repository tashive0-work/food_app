import { NextResponse } from "next/server";
import { getLiveFoods } from "@/lib/getFoods";

export async function GET() {
  const foods = await getLiveFoods();
  return NextResponse.json({ foods });
}
