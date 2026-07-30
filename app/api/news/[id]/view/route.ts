import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = await getPayload({ config });
  const article = await payload.findByID({ collection: "news-feed", id, depth: 0, overrideAccess: true });
  const updated = await payload.update({ collection: "news-feed", id, data: { viewCount: Math.max(article.viewCount ?? 0, article.legacyViewCount ?? 0) + 1 }, overrideAccess: true });
  return NextResponse.json({ readCount: updated.viewCount ?? 0 });
}
