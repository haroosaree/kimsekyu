import Link from "next/link";
import QuestionForm from "./question-form";

export const dynamic = "force-dynamic";

export default function QuestionsPage() {
  return <main className="article-page">
    <nav className="breadcrumb" aria-label="현재 위치"><Link href="/">홈</Link><span>›</span><span>질문/답변</span></nav>
    <p className="eyebrow">PRIVATE INQUIRY</p>
    <h1>질문/답변</h1>
    <a className="button button-primary question-ask-button" href="#ask">질문하기 / Ask <span>↓</span></a>
    <p className="question-intro">부동산과 오스틴 생활에 관한 질문을 남겨 주세요. 내용과 답변은 관리자만 확인하며, 공개되지 않습니다.</p>
    <QuestionForm />
  </main>;
}
