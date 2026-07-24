"use client";

import { FormEvent, useState } from "react";

const initialValues = { subject: "", message: "", name: "", email: "", phone: "" };

export default function QuestionForm() {
  const [values, setValues] = useState(initialValues);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    const response = await fetch("/api/questions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    if (response.ok) {
      setValues(initialValues);
      setState("sent");
    } else setState("error");
  }

  if (state === "sent") return <p className="question-success">질문이 접수되었습니다. 확인 후 연락드리겠습니다.</p>;

  return <form id="ask" className="question-form" onSubmit={submit}>
    <label>제목<input required maxLength={160} value={values.subject} onChange={(event) => setValues({ ...values, subject: event.target.value })} /></label>
    <label>질문 내용<textarea required maxLength={5000} rows={7} value={values.message} onChange={(event) => setValues({ ...values, message: event.target.value })} /></label>
    <div className="question-form-row"><label>이름<input required value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} /></label><label>이메일<input required type="email" value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} /></label></div>
    <label>전화번호 <small>(선택)</small><input value={values.phone} onChange={(event) => setValues({ ...values, phone: event.target.value })} /></label>
    {state === "error" && <p className="question-error">전송하지 못했습니다. 잠시 후 다시 시도해 주세요.</p>}
    <button className="button button-primary" type="submit" disabled={state === "sending"}>{state === "sending" ? "전송 중…" : "질문 보내기"}<span>↗</span></button>
  </form>;
}
