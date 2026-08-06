"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getAnonymousId, getDeviceType } from "@/lib/session";
import { BottomNav } from "@/components/BottomNav";

const TYPES = [
  { key: "bug", label: "오류 신고" },
  { key: "info_error", label: "메뉴 정보가 잘못됐어요" },
  { key: "suggestion", label: "기능 제안" },
  { key: "recommend", label: "추천이 아쉬워요" },
  { key: "other", label: "기타" },
];

const FAQS = [
  {
    q: "추천 결과는 어떻게 정해지나요?",
    a: "여덟 개 문항의 답변을 여섯 가지 상태 수치로 바꾼 뒤, 각 메뉴의 속성과 얼마나 가까운지 계산해 순서를 정합니다.",
  },
  {
    q: "진단 기록이 저장되나요?",
    a: "회원가입 없이 이용하실 수 있으며, 개인을 식별할 수 있는 정보는 수집하지 않습니다. 자세한 내용은 개인정보 처리방침을 확인해 주세요.",
  },
  {
    q: "알레르기가 있어요.",
    a: "설정에서 제외할 항목을 선택하실 수 있습니다. 다만 메뉴 이름을 기준으로 하는 보조 기능이므로 완전하지 않습니다. 반드시 매장에 직접 확인해 주세요.",
  },
  {
    q: "추천된 메뉴가 마음에 들지 않아요.",
    a: "결과 화면에서 '이거 말고 다른 거'에 원하는 조건을 입력하시면 조건을 다시 맞춰 드립니다.",
  },
];

export default function FeedbackPage() {
  const [type, setType] = useState("bug");
  const [content, setContent] = useState("");
  const [foodName, setFoodName] = useState("");
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);

  useEffect(() => {
    try {
      const f = localStorage.getItem("food_favorites");
      if (f) setFavorites(JSON.parse(f));
    } catch (e) { console.error(e); }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const trimmed = content.trim();
    if (trimmed.length < 10) {
      setErrorMsg("문의 내용은 10자 이상 입력해 주세요.");
      return;
    }
    if (trimmed.length > 500) {
      setErrorMsg("문의 내용은 500자 이내로 입력해 주세요.");
      return;
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMsg("올바른 이메일 형식을 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    try {
      if (supabase) {
        const { error } = await supabase.from("feedback").insert({
          anon_id: getAnonymousId(),
          type,
          content: trimmed,
          food_name: foodName.trim() || null,
          contact_email: trimmedEmail || null,
          device_type: getDeviceType(),
        });
        if (error) {
          console.error(error);
          setErrorMsg("접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
          setSubmitting(false);
          return;
        }
      }
      setSuccessMsg("의견이 정상적으로 접수되었습니다. 감사합니다!");
      setContent("");
      setFoodName("");
      setEmail("");
    } catch (err) {
      console.error(err);
      setErrorMsg("접수 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app hasNav">
      <header className="pageHead">
        <Link href="/" className="pageBack" aria-label="홈으로">←</Link>
        <h1 className="pageTitle">고객 문의 및 의견</h1>
      </header>
      <main className="wrap">
        {/* 자주 묻는 질문 FAQ */}
        <section className="secHead" style={{ marginTop: 0 }}>
          <h2 className="secTitle">자주 묻는 질문</h2>
        </section>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
          {FAQS.map((faq, i) => (
            <div key={i} className="card" style={{ flexDirection: "column", alignItems: "flex-start", gap: "6px" }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "14.5px", color: "var(--ink)" }}>Q. {faq.q}</p>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--dim)", lineHeight: 1.6 }}>A. {faq.a}</p>
            </div>
          ))}
        </div>

        {/* 문의 작성 폼 */}
        <section className="secHead">
          <h2 className="secTitle">의견 보내기</h2>
          <p className="secSub">서비스 이용 중 불편한 점이나 제안하고 싶은 의견을 알려주세요.</p>
        </section>

        {successMsg && (
          <div className="legalNotice" style={{ marginBottom: "20px", borderColor: "var(--primary)" }}>
            <p style={{ color: "var(--primary)", fontWeight: 700 }}>{successMsg}</p>
          </div>
        )}

        {errorMsg && (
          <p className="aiError" style={{ marginBottom: "16px" }}>{errorMsg}</p>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13.5px", fontWeight: 600, marginBottom: "6px" }}>문의 유형</label>
            <div className="chips">
              {TYPES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={type === t.key ? "chip on" : "chip"}
                  onClick={() => setType(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13.5px", fontWeight: 600, marginBottom: "6px" }}>
              문의 내용 <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <textarea
              className="aiInput"
              style={{ width: "100%", height: "120px", resize: "vertical" }}
              placeholder="내용을 10자 이상 입력해 주세요 (최대 500자)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={500}
              required
            />
            <span style={{ fontSize: "11.5px", color: "var(--dim)", display: "block", textAlign: "right", marginTop: "4px" }}>
              {content.length}/500
            </span>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13.5px", fontWeight: 600, marginBottom: "6px" }}>관련 메뉴 (선택)</label>
            <input
              type="text"
              className="aiInput"
              style={{ width: "100%" }}
              placeholder="예: 김치찌개"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13.5px", fontWeight: 600, marginBottom: "6px" }}>회신 이메일 (선택)</label>
            <input
              type="email"
              className="aiInput"
              style={{ width: "100%" }}
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p style={{ margin: "6px 0 0", fontSize: "11.5px", color: "var(--dim)", lineHeight: 1.5 }}>
              회신이 필요하면 이메일을 남겨주세요. 답변 목적으로만 사용하고 처리 후 삭제합니다.
            </p>
          </div>

          <button type="submit" className="btn btnMain" disabled={submitting} style={{ marginTop: "12px" }}>
            {submitting ? "접수 중..." : "의견 보내기"}
          </button>
        </form>
      </main>
      <BottomNav favCount={favorites.length} />
    </div>
  );
}
