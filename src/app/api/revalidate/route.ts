import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import crypto from "crypto";

const ALLOWED_TAGS = new Set(["foods", "trends", "dashboard-trends", "dashboard-content"]);

function timingSafeCompare(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length === 0 || bufB.length === 0) return false;
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(request: Request) {
  try {
    const expectedSecret = process.env.REVALIDATE_SECRET;

    // Fail-closed 1: 서버에 REVALIDATE_SECRET 환경변수가 없으면 무조건 500 에러로 차단
    if (!expectedSecret || expectedSecret.trim() === "") {
      console.error("[RevalidateAPI] Server misconfigured: REVALIDATE_SECRET is missing.");
      return NextResponse.json(
        { error: "Server misconfigured: REVALIDATE_SECRET environment variable is missing" },
        { status: 500 }
      );
    }

    // Fail-closed 2: 헤더 x-revalidate-secret 검증 (없거나 다르면 무조건 401 차단)
    const secretHeader = request.headers.get("x-revalidate-secret") || "";
    if (!secretHeader || !timingSafeCompare(secretHeader, expectedSecret)) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing x-revalidate-secret header" },
        { status: 401 }
      );
    }

    // Fail-closed 3: tag 파라미터 검증 ('foods', 'trends' 만 허용)
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get("tag") || "";

    if (!tag || !ALLOWED_TAGS.has(tag)) {
      return NextResponse.json(
        { error: "Bad Request: Invalid or unsupported tag parameter" },
        { status: 400 }
      );
    }

    try {
      revalidateTag(tag);
    } catch (tagErr: any) {
      console.warn("[RevalidateAPI] revalidateTag warning:", tagErr?.message);
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

export async function GET() {
  return NextResponse.json(
    { error: "Method Not Allowed: Only POST is allowed" },
    { status: 405, headers: { Allow: "POST" } }
  );
}
