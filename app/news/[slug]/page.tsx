import Link from "next/link";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import config from "@payload-config";

export const dynamic = "force-dynamic";

export default async function NewsArticle({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const payload = await getPayload({ config });
  const result = await payload.find({ collection: "news", where: { slug: { equals: slug } }, depth: 0, limit: 1, overrideAccess: true });
  const article = result.docs[0];
  if (!article) notFound();
  return <main className="article-page"><Link href="/news" className="back-link">← 지역 소식</Link><p className="eyebrow">{article.category}</p><h1>{article.title as string}</h1><time>{new Intl.DateTimeFormat("ko-KR", { dateStyle: "long" }).format(new Date(article.publishedAt))}</time><article className="legacy-content" dangerouslySetInnerHTML={{ __html: article.contentHTML as string }} /></main>;
}
