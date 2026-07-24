import Link from "next/link";
import { getPayload } from "payload";
import config from "@payload-config";
import NewsArchiveList from "@/components/news-archive-list";
import { PAGE_SIZE, pageFrom } from "@/lib/news-archives";

export const dynamic = "force-dynamic";

export default async function NewsIndex({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = pageFrom((await searchParams).page);
  const payload = await getPayload({ config });
  const news = await payload.find({ collection: "news", depth: 0, limit: PAGE_SIZE, page, sort: "-publishedAt", overrideAccess: true });
  const initialItems = news.docs.map((item) => ({ id: item.id, title: item.title as string, slug: item.slug, category: item.category, publishedAt: item.publishedAt }));
  return <main className="archive-page"><Link href="/" className="back-link">← 김세규 부동산</Link><p className="eyebrow">AUSTIN INTELLIGENCE</p><h1>지역 소식</h1><NewsArchiveList initialItems={initialItems} initialPage={page} totalPages={news.totalPages} basePath="/news" /></main>;
}
