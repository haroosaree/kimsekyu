import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin/", "/api/", "/search"] }],
    sitemap: "https://kimsekyu.com/sitemap.xml",
    host: "https://kimsekyu.com",
  };
}
