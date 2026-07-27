"use client";

import Script from "next/script";
import { FormEvent, useRef, useState } from "react";

type TurnstileWidgetId = string;
type TurnstileApi = {
  render: (container: HTMLElement, options: { sitekey: string; action: string; callback: (token: string) => void; "expired-callback": () => void; "error-callback": () => void }) => TurnstileWidgetId;
  reset: (widgetId: TurnstileWidgetId) => void;
};

declare global {
  interface Window { turnstile?: TurnstileApi; }
}

const initialValues = { subject: "", message: "", name: "", email: "", phone: "" };

export default function ContactForm() {
  const [values, setValues] = useState(initialValues);
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const turnstileContainer = useRef<HTMLDivElement>(null);
  const widgetId = useRef<TurnstileWidgetId | null>(null);

  function renderTurnstile() {
    if (!turnstileContainer.current || widgetId.current !== null || !window.turnstile) return;
    const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!sitekey) { setError("보안 인증 설정이 필요합니다."); return; }
    widgetId.current = window.turnstile.render(turnstileContainer.current, {
      sitekey,
      action: "contact",
      callback: setToken,
      "expired-callback": () => setToken(""),
      "error-callback": () => { setToken(""); setError("보안 인증에 실패했습니다. 다시 시도해 주세요."); },
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) { setError("보안 인증을 완료해 주세요."); return; }
    setStatus("sending"); setError("");
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, token }) });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "문의 전송에 실패했습니다.");
      setValues(initialValues); setStatus("success");
    } catch (submissionError) {
      setStatus("error"); setError(submissionError instanceof Error ? submissionError.message : "문의 전송에 실패했습니다.");
    } finally {
      if (widgetId.current !== null && window.turnstile) window.turnstile.reset(widgetId.current);
      setToken("");
    }
  }

  return <>
    <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={renderTurnstile} />
    <form className="question-form" onSubmit={handleSubmit}>
      <label>제목<input required maxLength={160} value={values.subject} onChange={(event) => setValues({ ...values, subject: event.target.value })} /></label>
      <label>내용<textarea required maxLength={5000} rows={8} value={values.message} onChange={(event) => setValues({ ...values, message: event.target.value })} /></label>
      <div className="question-form-row"><label>이름<input required maxLength={120} value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} /></label><label>이메일<input required type="email" maxLength={254} value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} /></label></div>
      <label>전화번호<input type="tel" maxLength={40} value={values.phone} onChange={(event) => setValues({ ...values, phone: event.target.value })} /></label>
      <div ref={turnstileContainer} />
      {error && <p className="question-error" role="alert">{error}</p>}
      {status === "success" && <p className="question-success" role="status">문의가 접수되었습니다. 감사합니다.</p>}
      <button className="button button-primary" type="submit" disabled={status === "sending" || !token}>{status === "sending" ? "전송 중…" : "문의 보내기 / Send"}<span>↗</span></button>
    </form>
  </>;
}
