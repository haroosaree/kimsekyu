import Link from "next/link";
import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import config from "@payload-config";
import NewsArchiveList from "@/components/news-archive-list";
import MenuHero from "@/components/menu-hero";
import ArticleReadCount from "@/components/article-read-count";
import { austinEconomySubmenus, categoryArchives, formatUSDate, PAGE_SIZE, pageFrom } from "@/lib/news-archives";
import { displayLegacyHTML, legacyThumbnailURL } from "@/lib/legacy-html";

export const dynamic = "force-dynamic";

const cleanArchiveRoutes: Record<string, string> = { "property-info": "property-info", "austin-news": "austin-news", "austin-real-estate": "austin-news", "austin-economy": "austin-news" };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const archive = categoryArchives[slug as keyof typeof categoryArchives];
  if (archive) return { title: archive.title, description: `${archive.title} 관련 어스틴과 센트럴 텍사스의 최신 정보입니다.`, alternates: { canonical: `/${cleanArchiveRoutes[slug] || slug}` } };
  const payload = await getPayload({ config });
  const result = await payload.find({ collection: "news", where: { slug: { equals: slug } }, depth: 0, limit: 1, overrideAccess: true });
  const article = result.docs[0];
  if (!article) return {};
  const description = String(article.contentHTML || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160);
  return { title: article.title as string, description, alternates: { canonical: `/news/${article.slug}` }, openGraph: { type: "article", title: article.title as string, description } };
}

export default async function NewsRoute({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }) {
  const { slug } = await params;
  const page = pageFrom((await searchParams).page);
  const payload = await getPayload({ config });
  const archive = categoryArchives[slug as keyof typeof categoryArchives];

  if (archive && cleanArchiveRoutes[slug]) permanentRedirect(`/${cleanArchiveRoutes[slug]}`);

  if (archive) {
    const news = await payload.find({
      collection: "news",
      where: { category: { in: [...archive.categories] } },
      depth: 0,
      limit: PAGE_SIZE,
      page,
      sort: "-publishedAt",
      overrideAccess: true,
    });

    return <><MenuHero /><main className="archive-page">
      <nav className="breadcrumb" aria-label="현재 위치"><Link href="/">홈</Link><span>›</span><span>{archive.title}</span></nav>
      <p className="eyebrow">AUSTIN INTELLIGENCE</p>
      <h1>{archive.title}</h1>
      <NewsArchiveList initialItems={news.docs.map((item) => ({ id: item.id, title: item.title as string, slug: item.slug, publishedAt: item.publishedAt, viewCount: item.viewCount ?? 0, thumbnailURL: legacyThumbnailURL(item.contentHTML as string) }))} initialPage={page} totalPages={news.totalPages} basePath={`/news/${slug}`} archive={slug} />
    </main></>;
  }

  const result = await payload.find({ collection: "news", where: { slug: { equals: slug } }, depth: 0, limit: 1, overrideAccess: true });
  const article = result.docs[0];
  if (!article) notFound();
  // Austin real-estate and economy articles are intentionally merged into the
  // single public “어스틴 소식” menu, even though their legacy categories remain.
  const resourceArchive = Object.entries(austinEconomySubmenus).find(([key, value]) => key !== "business" && value.categories.includes(article.category as never));
  const parentArchive = categoryArchives["austin-news"].categories.includes(article.category as never)
    ? (["austin-news", categoryArchives["austin-news"]] as const)
    : Object.entries(categoryArchives).find(([key, value]) => key !== "austin-real-estate" && key !== "austin-economy" && value.categories.includes(article.category as never));
  const backHref = resourceArchive ? `/resources/${resourceArchive[0]}` : parentArchive ? `/${parentArchive[0]}` : "/austin-news";
  const backLabel = resourceArchive ? `← ${resourceArchive[1].title}` : parentArchive ? `← ${parentArchive[1].title}` : "← 어스틴 소식";
  const articleSchema = { "@context": "https://schema.org", "@type": "Article", headline: article.title, datePublished: article.publishedAt, dateModified: article.updatedAt, author: { "@type": "Person", name: article.legacyAuthor || "김세규 부동산" }, publisher: { "@type": "Organization", name: "김세규 부동산", url: "https://kimsekyu.com" }, mainEntityOfPage: `https://kimsekyu.com/news/${article.slug}` };
  return <main className="article-page"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema).replace(/</g, "\\u003c") }} /><Link href={backHref} className="back-link">{backLabel}</Link><p className="eyebrow">{article.category}</p><h1>{article.title as string}</h1><div className="article-details"><time>{formatUSDate(article.publishedAt)}</time><ArticleReadCount id={article.id} initialCount={article.viewCount ?? 0} /></div><article className="legacy-content" dangerouslySetInnerHTML={{ __html: displayLegacyHTML(article.contentHTML as string) }} /></main>;
}
