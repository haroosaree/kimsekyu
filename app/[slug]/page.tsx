import Link from "next/link";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import config from "@payload-config";
import { displayLegacyHTML } from "@/lib/legacy-html";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const menuLabel = ({ school: "교육/학군", agent: "김세규 부동산 소개" } as Record<string, string>)[slug];
  const payload = await getPayload({ config });
  const result = await payload.find({ collection: "pages", where: { slug: { equals: slug } }, depth: 0, limit: 1, overrideAccess: true });
  const page = result.docs[0];
  if (!page) notFound();
  return <main className="article-page">{menuLabel ? <nav className="breadcrumb" aria-label="현재 위치"><Link href="/">홈</Link><span>›</span><span>{menuLabel}</span></nav> : <Link href="/" className="back-link">← 김세규 부동산</Link>}<p className="eyebrow">AUSTIN GRACE REALTY LLC</p><h1>{page.title as string}</h1><article className="legacy-content" dangerouslySetInnerHTML={{ __html: displayLegacyHTML(page.contentHTML as string) }} /></main>;
}
