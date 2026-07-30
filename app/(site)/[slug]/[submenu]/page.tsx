import Link from "next/link";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import config from "@payload-config";
import NewsArchiveList from "@/components/news-archive-list";
import MenuHero from "@/components/menu-hero";
import { austinEconomySubmenus, PAGE_SIZE, pageFrom } from "@/lib/news-archives";
import { displayLegacyHTML, legacyThumbnailURL } from "@/lib/legacy-html";

export const dynamic = "force-dynamic";

export default async function ArchiveSubmenu({ params, searchParams }: { params: Promise<{ slug: string; submenu: string }>; searchParams: Promise<{ page?: string }> }) {
  const { slug, submenu } = await params;
  const page = pageFrom((await searchParams).page);
  const isResource = slug === "resources";
  const payload = await getPayload({ config });

  if (isResource && submenu === "school") {
    const result = await payload.find({ collection: "pages", where: { slug: { equals: "school" } }, depth: 0, limit: 1, overrideAccess: true });
    const school = result.docs[0];
    if (!school) notFound();
    return <><MenuHero /><main className="article-page"><nav className="breadcrumb" aria-label="현재 위치"><Link href="/">홈</Link><span>›</span><Link href="/resources">자료실</Link><span>›</span><span>교육/학군</span></nav><p className="eyebrow">RESOURCES</p><h1>{school.title as string}</h1><article className="legacy-content" dangerouslySetInnerHTML={{ __html: displayLegacyHTML(school.contentHTML as string) }} /></main></>;
  }

  const archive = slug === "austin-economy" || isResource ? austinEconomySubmenus[submenu as keyof typeof austinEconomySubmenus] : undefined;
  if (!archive) notFound();
  const news = await payload.find({ collection: "news-feed", where: { category: { in: [...archive.categories] } }, depth: 0, limit: PAGE_SIZE, page, sort: "-publishedAt", overrideAccess: true });

  return <><MenuHero /><main className="archive-page">
    <nav className="breadcrumb" aria-label="현재 위치"><Link href="/">홈</Link><span>›</span><Link href={isResource ? "/resources" : "/austin-news"}>{isResource ? "자료실" : "어스틴 소식"}</Link><span>›</span><span>{archive.title}</span></nav>
    <p className="eyebrow">{isResource ? "RESOURCES" : "AUSTIN NEWS"}</p>
    <h1>{archive.title}</h1>
    <NewsArchiveList initialItems={news.docs.map((item) => ({ id: item.id, title: item.title as string, slug: item.slug, publishedAt: item.publishedAt, viewCount: item.viewCount ?? 0, thumbnailURL: legacyThumbnailURL(item.legacyContent as string) }))} initialPage={page} totalPages={news.totalPages} basePath={`/${slug}/${submenu}`} hideMeta={isResource} />
  </main></>;
}
