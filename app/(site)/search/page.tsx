import Link from "next/link";
import type { Metadata } from "next";
import { getPayload } from "payload";
import config from "@payload-config";
import NewsArchiveList from "@/components/news-archive-list";
import { PAGE_SIZE, pageFrom } from "@/lib/news-archives";
import { legacyThumbnailURL } from "@/lib/legacy-html";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "검색", robots: { index: false, follow: true } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const { q: rawQuery = "", page: rawPage } = await searchParams;
  const query = rawQuery.trim().slice(0, 100);
  const page = pageFrom(rawPage);
  const payload = await getPayload({ config });
  const news = query.length >= 2 ? await payload.find({
    collection: "news",
    where: { or: [{ title: { like: query } }, { contentHTML: { like: query } }] },
    depth: 0,
    limit: PAGE_SIZE,
    page,
    sort: "-publishedAt",
    overrideAccess: true,
  }) : undefined;

  return <main className="archive-page">
    <nav className="breadcrumb" aria-label="현재 위치"><Link href="/">홈</Link><span>›</span><span>검색</span></nav>
    <p className="eyebrow">SEARCH</p>
    <h1>검색 결과</h1>
    {query.length < 2 ? <p className="search-message">검색어를 두 글자 이상 입력해 주세요.</p> : <>
      <p className="search-message"><b>“{query}”</b> 검색 결과 {news?.totalDocs.toLocaleString("en-US")}건</p>
      <NewsArchiveList initialItems={(news?.docs ?? []).map((item) => ({ id: item.id, title: item.title as string, slug: item.slug, publishedAt: item.publishedAt, viewCount: item.viewCount ?? 0, thumbnailURL: legacyThumbnailURL(item.contentHTML as string) }))} initialPage={page} totalPages={news?.totalPages ?? 0} basePath="/search" searchQuery={query} />
    </>}
  </main>;
}
