"use client";

import React, { useState } from "react";
import { logInteraction } from "@/lib/supabase";
import { shareUrlOf, type ShareType } from "@/lib/shareType";

/**
 * 진단 결과 공유 버튼.
 *
 * 카카오 SDK 를 쓰지 않습니다. 링크를 카톡에 붙여 넣으면 카톡이 알아서
 * 공유 카드(/og/result 이미지)를 보여줍니다. 키 발급도 도메인 등록도 필요 없습니다.
 *
 * 인스타 스토리는 웹에서 직접 올리는 방법이 없어서,
 * 세로 이미지를 만들어 휴대폰 공유 시트(저장·인스타)로 넘깁니다.
 */
const S: Record<string, React.CSSProperties> = {
  wrap: { margin: "18px 0 6px" },
  head: { fontSize: 13, fontWeight: 800, color: "var(--ink)", margin: "0 0 4px" },
  sub: { fontSize: 12, color: "var(--dim)", margin: "0 0 10px", lineHeight: 1.6 },
  row: { display: "flex", gap: 8 },
  btn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    padding: "13px 12px",
    borderRadius: 13,
    border: "1.5px solid #E5E8EB",
    background: "#fff",
    fontSize: 13.5,
    fontWeight: 800,
    color: "#191F28",
    cursor: "pointer",
  },
  primary: {
    border: "none",
    background: "#191F28",
    color: "#fff",
  },
  done: { marginTop: 9, fontSize: 12, fontWeight: 700, color: "#E8663D", textAlign: "center" },
};

interface Props {
  type: ShareType;
  foodName: string;
}

export function ShareButtons({ type, foodName }: Props) {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const url = shareUrlOf(type.key, foodName);
  const text = `오늘의 내 음식 유형은 「${type.name}」. 추천 메뉴는 ${foodName}!`;

  const note = (m: string) => {
    setMsg(m);
    window.setTimeout(() => setMsg(""), 2600);
  };

  /** 링크 공유 — 카톡·메시지에 붙으면 카드가 뜹니다 */
  const shareLink = async () => {
    logInteraction(null, foodName, 0, "share");
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    if (nav.share) {
      try {
        await nav.share({ title: "오늘의 잇템", text, url });
        return;
      } catch {
        // 사용자가 취소한 경우 — 복사로 넘어가지 않고 조용히 끝냅니다
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      note("링크를 복사했어요. 카톡에 붙여 넣으면 카드가 떠요.");
    } catch {
      note("링크 복사가 안 돼요. 주소창의 주소를 복사해 주세요.");
    }
  };

  /** 세로 이미지 — 인스타 스토리용 */
  const shareImage = async () => {
    if (busy) return;
    setBusy(true);
    logInteraction(null, foodName, 0, "share");
    try {
      const q = new URLSearchParams({ t: type.key, f: foodName, s: "story" });
      const res = await fetch(`/og/result?${q.toString()}`);
      if (!res.ok) throw new Error("이미지를 만들지 못했어요");
      const blob = await res.blob();
      const file = new File([blob], `오늘의잇템_${type.name}.png`, { type: "image/png" });

      const nav = navigator as Navigator & {
        share?: (d: ShareData) => Promise<void>;
        canShare?: (d: ShareData) => boolean;
      };
      if (nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: "오늘의 잇템" });
      } else {
        const href = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = href;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(href);
        note("이미지를 저장했어요. 스토리에 올려 주세요.");
      }
    } catch {
      note("이미지를 만들지 못했어요. 잠시 뒤 다시 눌러 주세요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={S.wrap}>
      <p style={S.head}>
        {type.emoji} 오늘의 내 유형은 「{type.name}」
      </p>
      <p style={S.sub}>친구는 어떤 유형인지 궁금하시죠? 결과를 보내 보세요.</p>
      <div style={S.row}>
        <button type="button" style={{ ...S.btn, ...S.primary }} onClick={shareLink}>
          <span aria-hidden="true">💬</span> 결과 공유하기
        </button>
        <button
          type="button"
          style={{ ...S.btn, opacity: busy ? 0.6 : 1 }}
          onClick={shareImage}
          disabled={busy}
        >
          <span aria-hidden="true">📷</span> {busy ? "만드는 중…" : "이미지로 저장"}
        </button>
      </div>
      {msg && <p style={S.done}>{msg}</p>}
    </div>
  );
}
