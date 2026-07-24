import Link from "next/link";
import { getPayload } from "payload";
import config from "@payload-config";

export const dynamic = "force-dynamic";

type Article = { id: string | number; title: string; slug: string; category: string; publishedAt: string; readCount: number };

async function getLatestNews(): Promise<Article[]> {
  try {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "news",
      depth: 0,
      limit: 3,
      sort: "-publishedAt",
      overrideAccess: true,
    });
    return result.docs.map((article) => ({
      id: article.id,
      title: article.title as string,
      slug: article.slug,
      category: article.category,
      publishedAt: article.publishedAt,
      readCount: article.viewCount ?? 0,
    }));
  } catch {
    return [];
  }
}

const formatDate = (value: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)).replace(",", "");

export default async function Home() {
  const latestNews = await getLatestNews();

  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">AUSTIN GRACE REALTY LLC</p>
          <h1>집을 찾는 일,<br /><em>삶을 이해하는 일부터.</em></h1>
          <p className="hero-description">오스틴과 센트럴 텍사스에서 20년의 경험으로, 당신의 다음 주소를 함께 찾습니다.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="http://austingrace.matrix.abor.com/Matrix/Public/?L=1&ap=SCH" target="_blank" rel="noreferrer">매물 검색하기 <span>↗</span></a>
            <a className="button button-secondary" href="mailto:kimsekyu@gmail.com">상담 문의하기</a>
          </div>
        </div>
        <div className="hero-side-note"><span>01</span> A considered approach<br />to Austin real estate.</div>
      </section>

      <section className="intro-section section-shell">
        <p className="eyebrow">LOCAL KNOWLEDGE, LASTING GUIDANCE</p>
        <div className="split-heading">
          <h2>오스틴의 변화와<br />당신의 기준을<br /><em>모두 읽습니다.</em></h2>
          <div>
            <p>김세규 부동산은 주거용·상업용 매매와 임대, 부동산 관리까지 폭넓게 돕습니다. 시장의 숫자만이 아니라, 동네의 리듬과 가족의 다음 장까지 살펴봅니다.</p>
            <Link className="text-link" href="/agent">김세규 부동산 소개 <span>→</span></Link>
          </div>
        </div>
        <div className="stat-row">
          <div><strong>20+</strong><span>Years in Austin real estate</span></div>
          <div><strong>2005</strong><span>Serving Central Texas since</span></div>
          <div><strong>1:1</strong><span>Personal, full-service guidance</span></div>
        </div>
      </section>

      <section className="services-section">
        <div className="section-shell">
          <p className="eyebrow">HOW WE HELP</p>
          <div className="service-grid">
            <article><span>01</span><h3>주택 매매</h3><p>단독주택, 콘도, 타운홈. 생활 방식에 맞는 선택을 함께 정리합니다.</p><Link href="/news/austin-real-estate">시장 정보 보기 →</Link></article>
            <article><span>02</span><h3>상업용 부동산</h3><p>상가, 오피스, 토지와 아파트까지. 더 큰 계획을 위한 든든한 파트너가 됩니다.</p><Link href="/news/property-info">부동산 정보 보기 →</Link></article>
            <article><span>03</span><h3>정착 & 학군</h3><p>학교와 생활권, 지역 소식까지. 오스틴에서의 새로운 시작을 설계합니다.</p><Link href="/school">교육·학군 보기 →</Link></article>
          </div>
        </div>
      </section>

      <section className="news-section section-shell">
        <div className="section-heading-row"><div><p className="eyebrow">FROM AUSTIN</p><h2>새로운 지역 소식</h2></div><Link className="text-link" href="/news">모든 소식 보기 <span>→</span></Link></div>
        <div className="news-grid">
          {latestNews.length > 0 ? latestNews.map((article) => (
            <Link className="news-card" href={`/news/${article.slug}`} key={article.id}>
              <div><span>{article.category.replace("legacy-board-", "Austin Report ")}</span><time>{formatDate(article.publishedAt)} · 조회 {article.readCount.toLocaleString("en-US")}</time></div>
              <h3>{article.title}</h3><b>Read story <span>↗</span></b>
            </Link>
          )) : ["오스틴의 시장을 읽는 새로운 방법", "센트럴 텍사스, 다음 성장의 중심", "좋은 동네를 고르는 기준"].map((title, index) => (
            <article className="news-card" key={title}><div><span>Austin Report 0{index + 1}</span><time>Migration in progress</time></div><h3>{title}</h3><b>Coming soon <span>↗</span></b></article>
          ))}
        </div>
      </section>

      <section className="contact-banner">
        <div className="section-shell contact-content"><p className="eyebrow">LET&apos;S TALK</p><h2>오스틴에서의<br /><em>다음 장을 시작해 볼까요?</em></h2><div><a href="tel:+15129475599">512.947.5599</a><a href="mailto:kimsekyu@gmail.com">kimsekyu@gmail.com</a></div></div>
      </section>

      <footer className="site-footer section-shell"><div className="brand"><span className="brand-kicker">AUSTIN · TEXAS</span><span>김세규 부동산</span></div><p>Austin Grace Realty LLC<br />Austin, Round Rock & Central Texas</p><p>© {new Date().getFullYear()} Kim Sekyu Real Estate</p></footer>
    </main>
  );
}
