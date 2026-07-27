import Link from "next/link";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getPayload } from "payload";
import config from "@payload-config";
import { displayLegacyHTML } from "@/lib/legacy-html";
import MenuHero from "@/components/menu-hero";
import NewsArchiveList from "@/components/news-archive-list";
import { categoryArchives, PAGE_SIZE, pageFrom } from "@/lib/news-archives";
import { legacyThumbnailURL } from "@/lib/legacy-html";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (slug === "school") permanentRedirect("/resources/school");
  const archive = categoryArchives[slug as keyof typeof categoryArchives];
  if (archive) return { title: archive.title, description: `${archive.title} 관련 어스틴과 센트럴 텍사스의 최신 정보입니다.`, alternates: { canonical: `/${slug}` } };
  const payload = await getPayload({ config });
  const result = await payload.find({ collection: "pages", where: { slug: { equals: slug } }, depth: 0, limit: 1, overrideAccess: true, select: { title: true, seoDescription: true } });
  const page = result.docs[0];
  return page ? { title: page.title as string, description: page.seoDescription as string | undefined, alternates: { canonical: `/${slug}` } } : {};
}

export default async function Page({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }) {
  const { slug } = await params;
  const pageNumber = pageFrom((await searchParams).page);
  const menuLabel = ({ school: "교육/학군", agent: "김세규 부동산 소개" } as Record<string, string>)[slug];
  const payload = await getPayload({ config });

  const archive = categoryArchives[slug as keyof typeof categoryArchives];
  if (archive) {
    const news = await payload.find({ collection: "news", where: { category: { in: [...archive.categories] } }, depth: 0, limit: PAGE_SIZE, page: pageNumber, sort: "-publishedAt", overrideAccess: true });
    return <><MenuHero /><main className="archive-page">
      <nav className="breadcrumb" aria-label="현재 위치"><Link href="/">홈</Link><span>›</span><span>{archive.title}</span></nav>
      <p className="eyebrow">AUSTIN INTELLIGENCE</p>
      <h1>{archive.title}</h1>
      <NewsArchiveList initialItems={news.docs.map((item) => ({ id: item.id, title: item.title as string, slug: item.slug, publishedAt: item.publishedAt, viewCount: item.viewCount ?? 0, thumbnailURL: legacyThumbnailURL(item.contentHTML as string) }))} initialPage={pageNumber} totalPages={news.totalPages} basePath={`/${slug}`} archive={slug} />
    </main></>;
  }

  const result = await payload.find({ collection: "pages", where: { slug: { equals: slug } }, depth: 0, limit: 1, overrideAccess: true });
  const page = result.docs[0];
  if (!page) notFound();
  return <>{menuLabel && <MenuHero />}<main className="article-page">{menuLabel ? <nav className="breadcrumb" aria-label="현재 위치"><Link href="/">홈</Link><span>›</span><span>{menuLabel}</span></nav> : <Link href="/" className="back-link">← 김세규 부동산</Link>}<p className="eyebrow">AUSTIN GRACE REALTY LLC</p><h1>{page.title as string}</h1><article className="legacy-content" dangerouslySetInnerHTML={{ __html: displayLegacyHTML(page.contentHTML as string) }} /></main></>;
}
