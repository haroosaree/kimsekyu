import Link from "next/link";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import config from "@payload-config";
import NewsArchiveList from "@/components/news-archive-list";
import MenuHero from "@/components/menu-hero";
import { displayLegacyHTML, legacyThumbnailURL } from "@/lib/legacy-html";
import { PAGE_SIZE, pageFrom } from "@/lib/news-archives";

export const dynamic = "force-dynamic";

export default async function SchoolSubmenu({ params, searchParams }: { params: Promise<{ submenu: string }>; searchParams: Promise<{ page?: string }> }) {
  const { submenu } = await params;
  const page = pageFrom((await searchParams).page);
  const payload = await getPayload({ config });
  if (submenu === "map") {
    const result = await payload.find({ collection: "pages", where: { slug: { equals: "school" } }, depth: 0, limit: 1, overrideAccess: true });
    const school = result.docs[0];
    if (!school) notFound();
    return <><MenuHero menuHref="/resources/school/map" /><main className="article-page"><nav className="breadcrumb" aria-label="현재 위치"><Link href="/">홈</Link><span>›</span><Link href="/resources">자료실</Link><span>›</span><span>어스틴 학군 맵</span></nav><p className="eyebrow">RESOURCES</p><h1>어스틴 학군 맵</h1><article className="legacy-content" dangerouslySetInnerHTML={{ __html: displayLegacyHTML(school.contentHTML as string) }} /></main></>;
  }
  if (submenu !== "schooldistrict") notFound();
  const news = await payload.find({ collection: "news-feed", where: { and: [{ category: { equals: "resources/school" } }, { or: [{ legacyBoardId: { in: ["12", "legacy-board-12"] } }, { legacy_category: { in: ["legacy-board-12", "교육 · 학군 · 대학"] } }] }] } as never, depth: 0, limit: PAGE_SIZE, page, sort: "-publishedAt", overrideAccess: true });
  return <><MenuHero menuHref="/resources/school/schooldistrict" /><main className="archive-page"><nav className="breadcrumb" aria-label="현재 위치"><Link href="/">홈</Link><span>›</span><Link href="/resources">자료실</Link><span>›</span><span>교육/학군/대학</span></nav><p className="eyebrow">RESOURCES</p><h1>교육/학군/대학</h1><NewsArchiveList initialItems={news.docs.map((item) => ({ id: item.id, title: item.title as string, slug: item.slug, publishedAt: item.publishedAt, viewCount: item.viewCount || item.legacyViewCount || 0, thumbnailURL: legacyThumbnailURL(item.legacyContent as string) }))} initialPage={page} totalPages={news.totalPages} basePath="/resources/school/schooldistrict" hideMeta /></main></>;
}
