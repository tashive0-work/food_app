import React, { useRef } from "react";
import { AppState, Verdict } from "@/types/food";
import { Bar } from "./Bar";
import html2canvas from "html2canvas";

interface ReceiptProps {
  state: AppState;
  verdict: Verdict;
  stamp: string;
}

export function Receipt({ state, verdict, stamp }: ReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handleDownloadImage = async () => {
    if (!receiptRef.current) return;
    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 2 });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `food_receipt_${Date.now()}.png`;
      link.click();
    } catch (err) {
      console.error("Failed to capture receipt:", err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "오늘 뭐 먹지 - 나의 상태 영수증",
          text: `오늘 나의 상태: [${verdict.title}] ${verdict.line}`,
          url: window.location.href,
        });
      } catch (e) {
        console.log("Share cancelled or failed", e);
      }
    } else {
      handleDownloadImage();
    }
  };

  return (
    <div>
      <section ref={receiptRef} className="receipt" aria-label="오늘의 상태 영수증">
        <div className="rTop">
          <p className="rShop">오늘 뭐 먹지</p>
          <p className="rMeta">상태 진단 결과서</p>
          <p className="rMeta">{stamp}</p>
        </div>
        <div className="rRule" />
        <Bar label="허기" value={state.hunger} />
        <Bar label="기력" value={state.energy} />
        <Bar label="자극" value={state.spice} />
        <Bar label="위로" value={state.comfort} />
        <Bar label="여유" value={state.time} />
        <Bar label="온기" value={state.warm} />
        <div className="rRule" />
        <div className="rline">
          <span className="rlabel">함께</span>
          <span className="rval2">{state.social}</span>
        </div>
        <div className="rRule" />
        <p className="rTotalLabel">진단</p>
        <p className="rTotal">{verdict.title}</p>
        <p className="rNote">{verdict.line}</p>
        <div className="rTear" aria-hidden="true" />
      </section>

      <div style={{ display: "flex", gap: "8px", marginTop: "24px" }}>
        <button
          onClick={handleDownloadImage}
          className="btn btnSub"
          style={{ flex: 1, padding: "12px", fontSize: "13.5px", cursor: "pointer" }}
        >
          영수증 이미지 저장
        </button>
        <button
          onClick={handleShare}
          className="btn btnMain"
          style={{ flex: 1, padding: "12px", fontSize: "13.5px", cursor: "pointer" }}
        >
          결과 공유하기
        </button>
      </div>
    </div>
  );
}
