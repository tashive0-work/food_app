import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get("tag");
    const secret = searchParams.get("secret");

    const expectedSecret = process.env.REVALIDATE_SECRET;
    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json({ error: "Invalid secret token" }, { status: 401 });
    }

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

export async function GET(request: Request) {
  return POST(request);
}
