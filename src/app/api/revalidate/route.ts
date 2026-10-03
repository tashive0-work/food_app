import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import crypto from "crypto";

function timingSafeEqualStr(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(request: Request) {
  try {
    const secretHeader = request.headers.get("x-revalidate-secret") || "";
    const expectedSecret = process.env.REVALIDATE_SECRET || "";

    // 1. 헤더 비밀값 검증 (없거나 다르면 무조건 401 반환)
    if (!expectedSecret || !secretHeader || !timingSafeEqualStr(secretHeader, expectedSecret)) {
      return NextResponse.json({ error: "Unauthorized: Invalid secret token" }, { status: 401 });
    }

    // 2. tag 파라미터 검증
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get("tag");

    if (!tag) {
      return NextResponse.json({ error: "Missing tag query parameter" }, { status: 400 });
    }

    try {
      revalidateTag(tag);
    } catch (tagErr: any) {
      console.warn('[RevalidateAPI] revalidateTag warning:', tagErr?.message);
    }

    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
      tag,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Revalidation failed" }, { status: 500 });
  }
}
