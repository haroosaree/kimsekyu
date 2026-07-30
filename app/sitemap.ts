import type { MetadataRoute } from "next";
import { getPayload } from "payload";
import config from "@payload-config";
import { categoryArchives, austinEconomySubmenus } from "@/lib/news-archives";

const baseURL = "https://kimsekyu.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayload({ config });
  const [pages, firstNewsPage] = await Promise.all([
    payload.find({ collection: "pages", limit: 500, depth: 0, overrideAccess: true, select: { slug: true, updatedAt: true } }),
    payload.find({ collection: "news-feed", limit: 1000, depth: 0, page: 1, overrideAccess: true, select: { slug: true, updatedAt: true, publishedAt: true } }),
  ]);
  const news = [...firstNewsPage.docs];
  for (let page = 2; page <= firstNewsPage.totalPages; page += 1) {
    const nextPage = await payload.find({ collection: "news-feed", limit: 1000, depth: 0, page, overrideAccess: true, select: { slug: true, updatedAt: true, publishedAt: true } });
    news.push(...nextPage.docs);
  }
  const staticRoutes = ["", "/property-info", "/austin-news", "/resources", "/resources/school", "/resources/koreanbusiness", "/resources/tours", "/resources/gallery", "/contact", "/agent"];
  const archiveRoutes = Object.keys(categoryArchives).filter((slug) => !["questions", "austin-real-estate", "austin-economy"].includes(slug)).map((slug) => `/${slug}`);
  const submenuRoutes = Object.keys(austinEconomySubmenus).filter((slug) => slug !== "business").map((slug) => `/resources/${slug}`);
  return [
    ...[...new Set([...staticRoutes, ...archiveRoutes, ...submenuRoutes])].map((path) => ({ url: `${baseURL}${path}`, changeFrequency: "weekly" as const, priority: path === "" ? 1 : 0.7 })),
    ...pages.docs.filter((page) => !["school", "agent"].includes(page.slug)).map((page) => ({ url: `${baseURL}/${page.slug}`, lastModified: new Date(page.updatedAt), changeFrequency: "monthly" as const, priority: 0.6 })),
    ...news.map((article) => ({ url: `${baseURL}/news/${article.slug}`, lastModified: new Date(article.publishedAt), changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
