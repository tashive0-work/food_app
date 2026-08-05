"use client";

import React, { useState } from "react";
import { AppState } from "@/types/food";

interface AiReRecommendInputProps {
  currentScores: AppState;
  onApplyDelta: (delta: Record<string, number>, excludeFoods: string[], reason: string) => void;
}

export function AiReRecommendInput({
  currentScores,
  onApplyDelta,
}: AiReRecommendInputProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [aiReason, setAiReason] = useState("");
  const [requestCount, setRequestCount] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    if (requestCount >= 5) {
      setErrorMsg("세션당 최대 5회까지만 재추천을 요청할 수 있습니다.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/re-recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          currentScores,
          requestCount,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "AI 재추천 요청 중 오류가 발생했습니다.");
        setLoading(false);
        return;
      }

      setRequestCount((c) => c + 1);
      setAiReason(data.reason || "요청 조건에 맞게 추천이 재정렬되었습니다.");
      onApplyDelta(data.delta || {}, data.excludeFoods || [], data.reason || "");
      setPrompt("");
    } catch (err) {
      console.error(err);
      setErrorMsg("네트워크 오류가 발생했습니다. 기존 추천 결과가 유지됩니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="aiRecommendBox" style={{ marginTop: "32px" }}>
      <div className="secHead" style={{ margin: "0 0 12px" }}>
        <h3 className="secTitle" style={{ fontSize: "19px" }}>
          이거 말고 다른 거
        </h3>
        <p className="secSub">
          이거 말고 다른 게 당기면, 그냥 말해주세요. (최대 5회)
        </p>
      </div>

      <form onSubmit={handleSubmit} className="aiForm">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="예: 국물 있는 걸로, 어제 치킨 먹었어, 만원 이하"
          disabled={loading}
          className="aiInput"
        />
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="btn btnMain aiSubmit"
        >
          {loading ? "보정 중..." : "적용"}
        </button>
      </form>

      {errorMsg && (
        <p className="aiError">
          {errorMsg}
        </p>
      )}

      {aiReason && !errorMsg && (
        <div className="aiReason">
          <strong>AI 보정 내용:</strong> {aiReason} (남은 횟수: {5 - requestCount}회)
        </div>
      )}
    </section>
  );
}
