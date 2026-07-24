import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { categoryArchives, PAGE_SIZE, pageFrom, type ArchiveSlug } from "@/lib/news-archives";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const archive = searchParams.get("archive") as ArchiveSlug | null;
  const page = pageFrom(searchParams.get("page") ?? undefined);
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "news",
    ...(archive && categoryArchives[archive] ? { where: { category: { in: [...categoryArchives[archive].categories] } } } : {}),
    depth: 0,
    limit: PAGE_SIZE,
    page,
    sort: "-publishedAt",
    overrideAccess: true,
  });
  return NextResponse.json({ docs: result.docs.map((item) => ({ id: item.id, title: item.title, slug: item.slug, category: item.category, publishedAt: item.publishedAt, readCount: item.readCount ?? 0 })), page: result.page, totalPages: result.totalPages });
}
