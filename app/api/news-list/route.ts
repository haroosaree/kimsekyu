import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { austinEconomySubmenus, categoryArchives, PAGE_SIZE, pageFrom, type ArchiveSlug } from "@/lib/news-archives";
import { legacyThumbnailURL } from "@/lib/legacy-html";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const archive = searchParams.get("archive") as (ArchiveSlug | keyof typeof austinEconomySubmenus) | null;
  const query = searchParams.get("q")?.trim().slice(0, 100);
  const page = pageFrom(searchParams.get("page") ?? undefined);
  const payload = await getPayload({ config });
  const archiveConfig = archive ? categoryArchives[archive as ArchiveSlug] || austinEconomySubmenus[archive as keyof typeof austinEconomySubmenus] : null;
  const result = await payload.find({
    collection: "news-feed",
    ...(query ? { where: { or: [{ title: { like: query } }, { legacyContent: { like: query } }] } } : archiveConfig ? { where: archiveConfig.legacyBoardIds?.length ? { and: [{ category: { in: [...archiveConfig.categories] } }, { or: [{ legacyBoardId: { in: archiveConfig.legacyBoardIds.flatMap((id) => [id, id.replace("legacy-board-", "")]) } }, { legacy_category: { in: [...archiveConfig.legacyBoardIds] } }] }] } : { category: { in: [...archiveConfig.categories] } } } : {}),
    depth: 0,
    limit: PAGE_SIZE,
    page,
    sort: "-publishedAt",
    overrideAccess: true,
  });
  return NextResponse.json({ docs: result.docs.map((item) => ({ id: item.id, title: item.title, slug: item.slug, publishedAt: item.publishedAt, viewCount: item.viewCount ?? 0, thumbnailURL: legacyThumbnailURL(item.legacyContent as string) })), page: result.page, totalPages: result.totalPages });
}
