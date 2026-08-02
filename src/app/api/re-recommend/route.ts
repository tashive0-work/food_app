import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { prompt, currentScores, requestCount } = await request.json();

    // 1. Session request count rate limit (Max 5 times)
    if (typeof requestCount === "number" && requestCount >= 5) {
      return NextResponse.json(
        { error: "세션당 최대 5회까지만 재추천할 수 있습니다." },
        { status: 429 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your-gemini-api-key") {
      return NextResponse.json(
        { error: "Gemini API 키가 설정되지 않았습니다. .env.local을 확인해 주세요." },
        { status: 500 }
      );
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

    const systemPrompt = `당신은 음식 추천 시스템의 파라미터 조정 에이전트입니다.
사용자의 요구사항을 분석하여 6축 상태 수치 보정치(delta: -2 ~ 2 범위 정수)와 제외할 음식 목록(excludeFoods) 및 사유(reason)를 JSON으로 생성하세요.

6축 정의:
- hunger: 허기
- energy: 기력
- spice: 자극 (매운맛)
- comfort: 위로 (따뜻한/포근한 맛)
- time: 여유 시간
- warm: 온기 (뜨거운 국물/따뜻한 요리)

사용자의 현재 수치: ${JSON.stringify(currentScores || {})}
사용자 입력: "${prompt}"`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              delta: {
                type: "OBJECT",
                properties: {
                  hunger: { type: "INTEGER" },
                  energy: { type: "INTEGER" },
                  spice: { type: "INTEGER" },
                  comfort: { type: "INTEGER" },
                  time: { type: "INTEGER" },
                  warm: { type: "INTEGER" },
                },
                required: ["hunger", "energy", "spice", "comfort", "time", "warm"],
              },
              excludeFoods: {
                type: "ARRAY",
                items: { type: "STRING" },
              },
              reason: { type: "STRING" },
            },
            required: ["delta", "excludeFoods", "reason"],
          },
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemini API error:", errText);
      return NextResponse.json(
        { error: "AI 응답 생성에 실패했습니다. 잠시 후 다시 시도해 주세요." },
        { status: 502 }
      );
    }

    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return NextResponse.json({ error: "올바른 응답을 받지 못했습니다." }, { status: 500 });
    }

    const parsed = JSON.parse(rawText);
    return NextResponse.json(parsed);
  } catch (err: unknown) {
    console.error("Re-recommend handler error:", err);
    return NextResponse.json({ error: "서버 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
