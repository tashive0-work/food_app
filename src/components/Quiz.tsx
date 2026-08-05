import React from "react";
import { Question } from "@/types/food";

interface QuizProps {
  questions: Question[];
  step: number;
  onAnswer: (index: number) => void;
  onBack: () => void;
}

export function Quiz({ questions, step, onAnswer, onBack }: QuizProps) {
  const currentQ = questions[step];
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
          <button key={i} className="opt" onClick={() => onAnswer(i)}>
            {label}
          </button>
        ))}
      </div>
      {step > 0 && (
        <button className="back" onClick={onBack}>
          이전 질문으로
        </button>
      )}
    </section>
  );
}
