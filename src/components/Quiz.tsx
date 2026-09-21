import React, { useState, useEffect } from "react";
import { Question } from "@/types/food";
import { Mascot } from "./Mascot";

const MASCOT_QUIZ_BUBBLES = [
  "오먹이가 딱 맞게 골라줄게요!",
  "음... 지금 배고픈 정도는?",
  "오늘 하루 기분은 어땠어요?",
  "지금 몸 컨디션은 어때요?",
  "어떤 맛이 제일 당기나요?",
  "식사에 쓸 시간은 얼마나 있나요?",
  "따뜻한 온기가 필요하신가요?",
  "오늘 식사는 누구와 함께해요?",
];

interface QuizProps {
  questions: Question[];
  step: number;
  onAnswer: (index: number) => void;
  onBack: () => void;
}

export function Quiz({ questions, step, onAnswer, onBack }: QuizProps) {
  const [disabled, setDisabled] = useState(false);
  const currentQ = questions[step];

  useEffect(() => {
    setDisabled(false);
  }, [step]);

  const handleOptClick = (i: number) => {
    if (disabled) return;
    setDisabled(true);
    onAnswer(i);
  };

  return (
    <section className="quiz">
      <div className="progress">
        <span>
          {step + 1} / {questions.length}
        </span>
        <div className="track">
          <div className="fill" style={{ width: `${((step + 1) / questions.length) * 100}%` }} />
        </div>
      </div>

      {/* 질문 영역 위 오먹이 thinking 120px & 말풍선 */}
      <div style={{ display: "flex", justifyContent: "center", margin: "14px 0 16px" }}>
        <Mascot
          expression="thinking"
          size={120}
          priority
          bubble={MASCOT_QUIZ_BUBBLES[step] || "음... 골라볼까요?"}
          bubblePosition="right"
          bubbleStyle={{
            maxWidth: "200px",
            fontSize: "14px",
            padding: "8px 13px",
            whiteSpace: "normal",
            wordBreak: "keep-all",
          }}
        />
      </div>

      <h2 className="qtext">{currentQ.q}</h2>
      <div className="opts">
        {currentQ.a.map(([label], i) => (
          <button key={i} className="opt" disabled={disabled} onClick={() => handleOptClick(i)}>
            {label}
          </button>
        ))}
      </div>
      {step > 0 && (
        <button className="back" disabled={disabled} onClick={onBack}>
          이전 질문으로
        </button>
      )}
    </section>
  );
}
