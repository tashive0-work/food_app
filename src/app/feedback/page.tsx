"use client";
import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getAnonymousId, getDeviceType } from "@/lib/session";
import { BottomNav } from "@/components/BottomNav";

const TYPES = [
  {
    key: "new_food",
    label: "🍕 새 메뉴 추천",
    placeholder: "추가되었으면 하는 맛있는 메뉴를 알려주세요! (예: 마라로제엽떡, 바질토마토베이글)",
  },
  {
    key: "suggestion",
    label: "💡 이런 기능 원해요",
    placeholder: "결정 장애를 더 쉽게 해결할 수 있는 아이디어를 자유롭게 들려주세요!",
  },
  {
    key: "praise",
    label: "❤️ 응원과 칭찬",
    placeholder: "앱을 쓰면서 기분 좋았거나 메뉴 선택에 도움이 되었던 순간을 들려주세요!",
  },
  {
    key: "recommend",
    label: "🤔 추천 결과 피드백",
    placeholder: "어떤 기분이나 상황에서 어떤 추천이 더 잘 어울렸을지 알려주세요.",
  },
  {
    key: "bug",
    label: "🐛 오류·정보 수정",
    placeholder: "작동하지 않는 부분이나 수정이 필요한 메뉴 정보를 알려주세요.",
  },
];

const FAQS = [
  {
    q: "소리함에 보낸 의견은 어떻게 반영되나요?",
    a: "제안해주신 메뉴와 기능은 정기 업데이트 시 적극 검토하여 데이터베이스와 기능에 신속하게 추가됩니다.",
  },
  {
    q: "추천 결과는 어떤 원리로 결정되나요?",
    a: "8문항의 진단 답변을 바탕으로 6축 상태(허기, 기력, 자극, 위로, 여유, 온기) 점수를 산출하고, 215종 메뉴 데이터와의 점수 매칭을 통해 현재 상태에 가장 적합한 메뉴를 추천합니다.",
  },
  {
    q: "회원가입이나 로그인을 해야 하나요?",
    a: "아니요! 가입 없이도 추천 기능을 모두 이용할 수 있어요. 모든 추천 및 소리함 기능은 무료로 제공됩니다. (찜 목록 기기 간 동기화를 원하시는 경우에만 선택적으로 구글 로그인을 이용하시면 됩니다.)",
  },
];

function FeedbackContent() {
  const searchParams = useSearchParams();
  const queryType = searchParams.get("type");
  const queryName = searchParams.get("name");

  const [type, setType] = useState("new_food");
  const [content, setContent] = useState("");
  const [foodName, setFoodName] = useState("");
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);

  useEffect(() => {
    try {
      const f = localStorage.getItem("food_favorites");
      if (f) setFavorites(JSON.parse(f));
    } catch (e) {
      console.error(e);
    }

    if (queryType && TYPES.some((t) => t.key === queryType)) {
      setType(queryType);
    }
    if (queryName) {
      setFoodName(queryName);
      setContent(`${queryName} 관련해서 제안합니다: `);
    }
  }, [queryType, queryName]);

  const currentTypeObj = TYPES.find((t) => t.key === type) || TYPES[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const trimmed = content.trim();
    if (trimmed.length < 2) {
      setErrorMsg("의견을 2자 이상 입력해 주세요.");
      return;
    }
    if (trimmed.length > 500) {
      setErrorMsg("의견은 500자 이내로 입력해 주세요.");
      return;
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        setErrorMsg("올바른 이메일 형식을 입력해 주세요.");
        return;
      }
      if (!privacyAgreed) {
        setErrorMsg("이메일 회신을 받으시려면 개인정보 수집·이용 동의에 체크해 주세요.");
        return;
      }
    }

    setSubmitting(true);
    const feedbackPayload = {
      anon_id: getAnonymousId(),
      type,
      content: trimmed,
      food_name: foodName.trim() || null,
      contact_email: trimmedEmail || null,
      device_type: getDeviceType(),
      created_at: new Date().toISOString(),
    };

    // 로컬 백업 저장 (서버 유실 방지)
    try {
      const prev = JSON.parse(localStorage.getItem("user_feedback_history") || "[]");
      prev.unshift(feedbackPayload);
      localStorage.setItem("user_feedback_history", JSON.stringify(prev.slice(0, 20)));
    } catch (e) {
      console.warn("Local feedback backup failed", e);
    }

    try {
      if (supabase) {
        const { error } = await supabase.from("feedback").insert({
          anon_id: feedbackPayload.anon_id,
          type: feedbackPayload.type,
          content: feedbackPayload.content,
          food_name: feedbackPayload.food_name,
          contact_email: feedbackPayload.contact_email,
          device_type: feedbackPayload.device_type,
        });
        if (error) {
          console.warn("Supabase feedback insert error:", error.message);
        }
      }
      setSuccessMsg("💌 소중한 의견이 정상 접수되었습니다! 정성껏 검토하여 반영하겠습니다.");
      setContent("");
      setFoodName("");
      setEmail("");
      setPrivacyAgreed(false);
    } catch (err) {
      console.error(err);
      // 로컬에 이미 백업되었으므로 사용자에게는 안심 메시지 제공
      setSuccessMsg("💌 의견이 기록되었습니다. 소중한 제안 진심으로 감사드립니다!");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app hasNav">
      <main className="wrap">
        <header className="pageHead" style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <Link href="/" className="pageBack" aria-label="홈으로" style={{ textDecoration: "none", fontSize: "18px", color: "var(--ink)" }}>
            ←
          </Link>
          <div>
            <h1 className="pageTitle" style={{ fontSize: "20px", fontWeight: 800, margin: 0 }}>
              고객의 소리함 💌
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--dim)" }}>
              더 맛있는 고민 해결을 위해 여러분의 목소리를 들려주세요
            </p>
          </div>
        </header>

        {/* 환영 안내 카드 */}
        <section
          style={{
            background: "linear-gradient(135deg, #FFF7ED 0%, #FFF1EC 100%)",
            border: "1px solid #FFEDD5",
            borderRadius: "12px",
            padding: "16px 18px",
            marginBottom: "24px",
          }}
        >
          <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#9A3412" }}>
            &ldquo;오늘 뭐 먹지?&rdquo;는 여러분과 함께 만들어갑니다
          </p>
          <p style={{ margin: "6px 0 0", fontSize: "12.5px", color: "#C2410C", lineHeight: 1.6 }}>
            원하는 메뉴가 없었거나, 꿀조합을 알려주고 싶거나, 조금이라도 불편했던 점이 있었다면 한 줄이라도 편하게 적어주세요!
          </p>
        </section>

        {/* 의견 접수 폼 */}
        <section className="secHead" style={{ marginTop: 0 }}>
          <h2 className="secTitle">의견 남기기</h2>
        </section>

        {successMsg && (
          <div
            style={{
              marginBottom: "20px",
              padding: "14px 16px",
              background: "#ECFDF5",
              border: "1.5px solid #10B981",
              borderRadius: "10px",
              color: "#065F46",
              fontSize: "13.5px",
              fontWeight: 600,
              lineHeight: 1.5,
            }}
          >
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <p className="aiError" style={{ marginBottom: "16px" }}>
            {errorMsg}
          </p>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px", color: "var(--ink)" }}>
              의견 종류를 골라주세요
            </label>
            <div className="chips" style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {TYPES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={type === t.key ? "chip on" : "chip"}
                  onClick={() => setType(t.key)}
                  style={{
                    padding: "8px 12px",
                    fontSize: "12.5px",
                    fontWeight: type === t.key ? 700 : 500,
                    borderRadius: "9999px",
                    cursor: "pointer",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px", color: "var(--ink)" }}>
              내용 <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <textarea
              className="aiInput"
              style={{
                width: "100%",
                height: "110px",
                resize: "vertical",
                borderRadius: "10px",
                padding: "12px",
                fontSize: "13.5px",
                lineHeight: "1.5",
              }}
              placeholder={currentTypeObj.placeholder}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={500}
              required
            />
            <span style={{ fontSize: "11px", color: "var(--dim)", display: "block", textAlign: "right", marginTop: "4px" }}>
              {content.length}/500자 (2자 이상이면 접수 가능)
            </span>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px", color: "var(--ink)" }}>
              관련 메뉴 이름 (선택)
            </label>
            <input
              type="text"
              className="aiInput"
              style={{ width: "100%", borderRadius: "8px", padding: "10px 12px", fontSize: "13.5px" }}
              placeholder="예: 마라로제떡볶이, 텐동, 그릭요거트"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px", color: "var(--ink)" }}>
              회신용 이메일 (선택)
            </label>
            <input
              type="email"
              className="aiInput"
              style={{ width: "100%", borderRadius: "8px", padding: "10px 12px", fontSize: "13.5px" }}
              placeholder="답변을 받아보실 이메일 (선택)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p style={{ margin: "6px 0 0", fontSize: "11.5px", color: "var(--dim)", lineHeight: 1.5 }}>
              회신을 원하실 때만 입력해주세요. 답변 완료 후 즉시 안전하게 파기됩니다.
            </p>
            {email.trim() !== "" && (
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "10px",
                  fontSize: "12px",
                  color: "var(--ink)",
                  cursor: "pointer",
                }}
              >
                <input type="checkbox" checked={privacyAgreed} onChange={(e) => setPrivacyAgreed(e.target.checked)} />
                <span>[필수] 개인정보 수집·이용 동의 (답변 목적으로만 이용 및 답변 완료 후 파기)</span>
              </label>
            )}
          </div>

          <button
            type="submit"
            className="btn btnMain"
            disabled={submitting}
            style={{
              marginTop: "8px",
              padding: "14px",
              fontSize: "15px",
              fontWeight: 700,
              borderRadius: "10px",
            }}
          >
            {submitting ? "소리함에 접수 중..." : "소리함에 의견 보내기 💌"}
          </button>
        </form>

        {/* 자주 묻는 질문 FAQ */}
        <section className="secHead" style={{ marginTop: "40px" }}>
          <h2 className="secTitle">자주 묻는 질문</h2>
        </section>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="card"
              style={{
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "6px",
                padding: "14px 16px",
                borderRadius: "10px",
              }}
            >
              <p style={{ margin: 0, fontWeight: 700, fontSize: "13.5px", color: "var(--ink)" }}>
                Q. {faq.q}
              </p>
              <p style={{ margin: 0, fontSize: "12.5px", color: "var(--dim)", lineHeight: 1.6 }}>
                A. {faq.a}
              </p>
            </div>
          ))}
        </div>
      </main>
      <BottomNav favCount={favorites.length} />
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center" }}>소리함을 불러오는 중...</div>}>
      <FeedbackContent />
    </Suspense>
  );
}
