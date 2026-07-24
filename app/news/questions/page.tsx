import Link from "next/link";
import QuestionForm from "./question-form";

export const dynamic = "force-dynamic";

export default function QuestionsPage() {
  return <main className="article-page">
    <Link href="/" className="back-link">← 김세규 부동산</Link>
    <p className="eyebrow">PRIVATE INQUIRY</p>
    <h1>질문/답변</h1>
    <p className="question-intro">부동산과 오스틴 생활에 관한 질문을 남겨 주세요. 내용과 답변은 관리자만 확인하며, 공개되지 않습니다.</p>
    <QuestionForm />
  </main>;
}
