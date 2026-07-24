import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = await getPayload({ config });
  const article = await payload.findByID({ collection: "news", id, depth: 0, overrideAccess: true });
  const updated = await payload.update({ collection: "news", id, data: { readCount: (article.readCount ?? 0) + 1 }, overrideAccess: true });
  return NextResponse.json({ readCount: updated.readCount ?? 0 });
}
