import Link from "next/link";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import config from "@payload-config";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const payload = await getPayload({ config });
  const result = await payload.find({ collection: "pages", where: { slug: { equals: slug } }, depth: 0, limit: 1, overrideAccess: true });
  const page = result.docs[0];
  if (!page) notFound();
  return <main className="article-page"><Link href="/" className="back-link">← 김세규 부동산</Link><p className="eyebrow">AUSTIN GRACE REALTY LLC</p><h1>{page.title as string}</h1><article className="legacy-content" dangerouslySetInnerHTML={{ __html: page.contentHTML as string }} /></main>;
}
