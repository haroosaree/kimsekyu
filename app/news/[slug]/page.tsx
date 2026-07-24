import Link from "next/link";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import config from "@payload-config";
import NewsArchiveList from "@/components/news-archive-list";
import ArticleReadCount from "@/components/article-read-count";
import { categoryArchives, formatUSDate, PAGE_SIZE, pageFrom } from "@/lib/news-archives";
import { displayLegacyHTML, legacyThumbnailURL } from "@/lib/legacy-html";

export const dynamic = "force-dynamic";

export default async function NewsRoute({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }) {
  const { slug } = await params;
  const page = pageFrom((await searchParams).page);
  const payload = await getPayload({ config });
  const archive = categoryArchives[slug as keyof typeof categoryArchives];

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

    return <main className="archive-page">
      <nav className="breadcrumb" aria-label="현재 위치"><Link href="/">홈</Link><span>›</span><span>{archive.title}</span></nav>
      <p className="eyebrow">AUSTIN INTELLIGENCE</p>
      <h1>{archive.title}</h1>
      <NewsArchiveList initialItems={news.docs.map((item) => ({ id: item.id, title: item.title as string, slug: item.slug, publishedAt: item.publishedAt, viewCount: (item.legacyViewCount ?? 0) + (item.readCount ?? 0), thumbnailURL: legacyThumbnailURL(item.contentHTML as string) }))} initialPage={page} totalPages={news.totalPages} basePath={`/news/${slug}`} archive={slug} />
    </main>;
  }

  const result = await payload.find({ collection: "news", where: { slug: { equals: slug } }, depth: 0, limit: 1, overrideAccess: true });
  const article = result.docs[0];
  if (!article) notFound();
  const parentArchive = Object.entries(categoryArchives).find(([, value]) => value.categories.includes(article.category as never));
  const backHref = parentArchive ? `/news/${parentArchive[0]}` : "/news";
  const backLabel = parentArchive ? `← ${parentArchive[1].title}` : "← 지역 소식";
  return <main className="article-page"><Link href={backHref} className="back-link">{backLabel}</Link><p className="eyebrow">{article.category}</p><h1>{article.title as string}</h1><div className="article-details"><time>{formatUSDate(article.publishedAt)}</time><ArticleReadCount id={article.id} initialCount={(article.legacyViewCount ?? 0) + (article.readCount ?? 0)} /></div><article className="legacy-content" dangerouslySetInnerHTML={{ __html: displayLegacyHTML(article.contentHTML as string) }} /></main>;
}
