import Link from "next/link";
import { notFound } from "next/navigation";
import { permanentRedirect } from "next/navigation";
import { getPayload } from "payload";
import config from "@payload-config";
import NewsArchiveList from "@/components/news-archive-list";
import MenuHero from "@/components/menu-hero";
import { austinEconomySubmenus, PAGE_SIZE, pageFrom } from "@/lib/news-archives";
import { legacyThumbnailURL } from "@/lib/legacy-html";

export const dynamic = "force-dynamic";

export default async function NewsSubmenu({ params, searchParams }: { params: Promise<{ slug: string; submenu: string }>; searchParams: Promise<{ page?: string }> }) {
  const { slug, submenu } = await params;
  if (slug === "austin-economy") permanentRedirect(submenu === "business" ? "/austin-news" : `/resources/${submenu}`);
  const page = pageFrom((await searchParams).page);
  const archive = slug === "austin-economy" ? austinEconomySubmenus[submenu as keyof typeof austinEconomySubmenus] : undefined;
  if (!archive) notFound();
  const isResource = submenu !== "business";

  const payload = await getPayload({ config });
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
    <nav className="breadcrumb" aria-label="현재 위치"><Link href="/">홈</Link><span>›</span><Link href={isResource ? "/resources" : "/news/austin-economy"}>{isResource ? "자료실" : "어스틴 경제/뉴스"}</Link><span>›</span><span>{archive.title}</span></nav>
    <p className="eyebrow">{isResource ? "RESOURCES" : "AUSTIN ECONOMY & NEWS"}</p>
    <h1>{archive.title}</h1>
    <NewsArchiveList initialItems={news.docs.map((item) => ({ id: item.id, title: item.title as string, slug: item.slug, publishedAt: item.publishedAt, viewCount: item.viewCount ?? 0, thumbnailURL: legacyThumbnailURL(item.contentHTML as string) }))} initialPage={page} totalPages={news.totalPages} basePath={`/news/${slug}/${submenu}`} />
  </main></>;
}
