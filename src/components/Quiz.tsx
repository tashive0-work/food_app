import React, { useState, useEffect } from "react";
import { Question } from "@/types/food";

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
