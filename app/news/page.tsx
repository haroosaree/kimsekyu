import Link from "next/link";
import { getPayload } from "payload";
import config from "@payload-config";
import NewsArchiveList from "@/components/news-archive-list";
import MenuHero from "@/components/menu-hero";
import { PAGE_SIZE, pageFrom } from "@/lib/news-archives";
import { legacyThumbnailURL } from "@/lib/legacy-html";

export const dynamic = "force-dynamic";

export default async function NewsIndex({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = pageFrom((await searchParams).page);
  const payload = await getPayload({ config });
  const news = await payload.find({ collection: "news", depth: 0, limit: PAGE_SIZE, page, sort: "-publishedAt", overrideAccess: true });
  const initialItems = news.docs.map((item) => ({ id: item.id, title: item.title as string, slug: item.slug, publishedAt: item.publishedAt, viewCount: item.viewCount ?? 0, thumbnailURL: legacyThumbnailURL(item.contentHTML as string) }));
  return <><MenuHero /><main className="archive-page"><nav className="breadcrumb" aria-label="현재 위치"><Link href="/">홈</Link><span>›</span><span>지역 소식</span></nav><p className="eyebrow">AUSTIN INTELLIGENCE</p><h1>지역 소식</h1><NewsArchiveList initialItems={initialItems} initialPage={page} totalPages={news.totalPages} basePath="/news" /></main></>;
}
