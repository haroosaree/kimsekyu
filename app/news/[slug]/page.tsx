import Link from "next/link";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import config from "@payload-config";

export const dynamic = "force-dynamic";

const categoryArchives = {
  "property-info": {
    title: "부동산 정보",
    categories: [
      "legacy-board-1", "legacy-board-2", "legacy-board-3", "legacy-board-4",
      "미국 부동산 소식 / 시장 정보", "주택 매도 가이드", "주택 구매 / 생활 정보", "융자 · 모기지 · 크레딧",
    ],
  },
  "austin-real-estate": {
    title: "어스틴 부동산",
    categories: ["legacy-board-5", "legacy-board-6", "어스틴 부동산", "어스틴 지역 · 동네 정보"],
  },
  "austin-economy": {
    title: "어스틴 경제/뉴스",
    categories: [
      "legacy-board-7", "legacy-board-8", "legacy-board-9", "legacy-board-10", "legacy-board-14", "legacy-board-15",
      "어스틴 경제 · 순위 · 고용", "어스틴 경제 · 비즈니스 뉴스", "어스틴 한인 비즈니스 · 기관", "여행 · 레저", "어스틴 한인 커뮤니티", "어스틴 생활 · 명소",
    ],
  },
  questions: {
    title: "질문/답변",
    categories: ["legacy-board-13", "부동산 질문 · 답변"],
  },
} as const;

const formatDate = (value: string) => new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(value));

export default async function NewsRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const payload = await getPayload({ config });
  const archive = categoryArchives[slug as keyof typeof categoryArchives];

  if (archive) {
    const news = await payload.find({
      collection: "news",
      where: { category: { in: [...archive.categories] } },
      depth: 0,
      limit: 500,
      sort: "-publishedAt",
      overrideAccess: true,
    });

    return <main className="archive-page">
      <Link href="/news" className="back-link">← 지역 소식 전체보기</Link>
      <p className="eyebrow">AUSTIN INTELLIGENCE</p>
      <h1>{archive.title}</h1>
      <div className="archive-list">
        {news.docs.map((item) => <Link href={`/news/${item.slug}`} key={item.id}>
          <span>{item.category}</span><h2>{item.title as string}</h2><time>{formatDate(item.publishedAt)}</time><b>↗</b>
        </Link>)}
      </div>
    </main>;
  }

  const result = await payload.find({ collection: "news", where: { slug: { equals: slug } }, depth: 0, limit: 1, overrideAccess: true });
  const article = result.docs[0];
  if (!article) notFound();
  return <main className="article-page"><Link href="/news" className="back-link">← 지역 소식</Link><p className="eyebrow">{article.category}</p><h1>{article.title as string}</h1><time>{new Intl.DateTimeFormat("ko-KR", { dateStyle: "long" }).format(new Date(article.publishedAt))}</time><article className="legacy-content" dangerouslySetInnerHTML={{ __html: article.contentHTML as string }} /></main>;
}
