import Link from "next/link";
import { getPayload } from "payload";
import config from "@payload-config";
import QuestionForm from "./question-form";
import MenuHero from "@/components/menu-hero";
import { PAGE_SIZE, pageFrom } from "@/lib/news-archives";

export const dynamic = "force-dynamic";

function paginationItems(currentPage: number, totalPages: number) {
  const pages = new Set([1, totalPages]);
  for (let item = Math.max(1, currentPage - 2); item <= Math.min(totalPages, currentPage + 2); item += 1) pages.add(item);
  const sorted = [...pages].sort((left, right) => left - right);
  return sorted.flatMap((item, index) => index > 0 && item - sorted[index - 1] > 1 ? (["…", item] as const) : ([item] as const));
}

export default async function QuestionsPage({ searchParams }: { searchParams: Promise<{ ask?: string; page?: string }> }) {
  const { ask, page: pageParam } = await searchParams;
  const page = pageFrom(pageParam);
  const payload = await getPayload({ config });
  // This server-side query intentionally selects only public-safe fields. Answers and contact
  // details remain restricted to Payload administrators and never enter the page response.
  const questions = await payload.find({ collection: "questions", where: { subject: { not_like: "Re:%" } }, depth: 0, limit: PAGE_SIZE, page, sort: "-publishedAt", overrideAccess: true, select: { subject: true, message: true, name: true, createdAt: true, publishedAt: true, viewCount: true } });

  return <><MenuHero /><main className="article-page">
    <nav className="breadcrumb" aria-label="현재 위치"><Link href="/">홈</Link><span>›</span><span>질문/답변</span></nav>
    <p className="eyebrow">QUESTIONS</p>
    <h1>질문/답변</h1>
    <a className="button button-primary question-ask-button" href="/questions?ask=1#ask">질문하기 / Ask <span>↗</span></a>
    <p className="question-intro">부동산과 오스틴 생활에 관한 질문을 확인하세요. 답변과 연락처는 관리자만 확인할 수 있습니다.</p>
    {ask === "1" && <QuestionForm />}
    <section className="question-list" aria-label="질문 목록">
      {questions.docs.length === 0 ? <p className="question-empty">등록된 질문이 아직 없습니다.</p> : questions.docs.map((question) => <article key={question.id} className="question-item">
        <div className="question-item-meta"><span>{question.name as string}</span><time>{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(question.publishedAt || question.createdAt))}</time></div>
        <h2>{question.subject as string}</h2>
        <p>{question.message as string}</p>
        <div className="question-private-answer">답변은 관리자만 확인할 수 있습니다.</div>
      </article>)}
    </section>
    {questions.totalPages > 1 && <nav className="question-pagination" aria-label="질문 페이지 탐색">
      {page > 1 ? <Link className="pagination-arrow" href={page === 2 ? "/questions" : `/questions?page=${page - 1}`} aria-label="Previous page">‹</Link> : <span className="pagination-arrow disabled" aria-hidden="true">‹</span>}
      {paginationItems(page, questions.totalPages).map((item, index) => typeof item === "string" ? <span className="pagination-ellipsis" key={`${item}-${index}`}>{item}</span> : <Link className={item === page ? "active" : ""} href={item === 1 ? "/questions" : `/questions?page=${item}`} key={item}>{item}</Link>)}
      {page < questions.totalPages ? <Link className="pagination-arrow" href={`/questions?page=${page + 1}`} aria-label="Next page">›</Link> : <span className="pagination-arrow disabled" aria-hidden="true">›</span>}
    </nav>}
  </main></>;
}
