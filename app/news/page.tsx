import Link from "next/link";
import { getPayload } from "payload";
import config from "@payload-config";

export const dynamic = "force-dynamic";

export default async function NewsIndex() {
  const payload = await getPayload({ config });
  const news = await payload.find({ collection: "news", depth: 0, limit: 48, sort: "-publishedAt", overrideAccess: true });
  return <main className="archive-page"><Link href="/" className="back-link">← 김세규 부동산</Link><p className="eyebrow">AUSTIN INTELLIGENCE</p><h1>지역 소식</h1><div className="archive-list">{news.docs.map((item) => <Link href={`/news/${item.slug}`} key={item.id}><span>{item.category}</span><h2>{item.title as string}</h2><time>{new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(item.publishedAt))}</time><b>↗</b></Link>)}</div></main>;
}
