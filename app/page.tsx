import { Fragment } from "react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { getPayload } from "payload";
import config from "@payload-config";

export const dynamic = "force-dynamic";

type Article = { id: string | number; title: string; slug: string; category: string; publishedAt: string; readCount: number };
type Item = { value?: string; label?: string; title?: string; description?: string; linkLabel?: string; linkHref?: string };
type Media = { url?: string } | null | undefined;

const defaults = {
  hero: {
    eyebrow: "AUSTIN GRACE REALTY LLC", heading: "집을 찾는 일,", emphasis: "삶을 이해하는 일부터.", description: "오스틴과 센트럴 텍사스에서 20년의 경험으로, 당신의 다음 주소를 함께 찾습니다.",
    primaryLabel: "매물 검색하기", primaryHref: "http://austingrace.matrix.abor.com/Matrix/Public/?L=1&ap=SCH", secondaryLabel: "상담 문의하기", secondaryHref: "mailto:kimsekyu@gmail.com", sideNote: "A considered approach\nto Austin real estate.",
  },
  introduction: {
    eyebrow: "LOCAL KNOWLEDGE, LASTING GUIDANCE", heading: "오스틴의 변화와\n당신의 기준을", emphasis: "모두 읽습니다.", description: "김세규 부동산은 주거용·상업용 매매와 임대, 부동산 관리까지 폭넓게 돕습니다. 시장의 숫자만이 아니라, 동네의 리듬과 가족의 다음 장까지 살펴봅니다.", linkLabel: "김세규 부동산 소개", linkHref: "/agent",
    stats: [{ value: "20+", label: "Years in Austin real estate" }, { value: "2005", label: "Serving Central Texas since" }, { value: "1:1", label: "Personal, full-service guidance" }],
  },
  services: {
    eyebrow: "HOW WE HELP", cards: [
      { title: "주택 매매", description: "단독주택, 콘도, 타운홈. 생활 방식에 맞는 선택을 함께 정리합니다.", linkLabel: "시장 정보 보기", linkHref: "/news/austin-real-estate" },
      { title: "상업용 부동산", description: "상가, 오피스, 토지와 아파트까지. 더 큰 계획을 위한 든든한 파트너가 됩니다.", linkLabel: "부동산 정보 보기", linkHref: "/news/property-info" },
      { title: "정착 & 학군", description: "학교와 생활권, 지역 소식까지. 오스틴에서의 새로운 시작을 설계합니다.", linkLabel: "교육·학군 보기", linkHref: "/school" },
    ],
  },
  newsSection: {
    eyebrow: "FROM AUSTIN", heading: "새로운 지역 소식", allLinkLabel: "모든 소식 보기", allLinkHref: "/news", readLabel: "조회", articleLinkLabel: "Read story", emptyStateLabel: "Migration in progress",
    emptyCardTitles: ["오스틴의 시장을 읽는 새로운 방법", "센트럴 텍사스, 다음 성장의 중심", "좋은 동네를 고르는 기준"],
  },
  contact: {
    eyebrow: "LET'S TALK", heading: "오스틴에서의\n다음 장을 시작해 볼까요?", emphasis: "", introduction: "오스틴 및 라운드락 인근 지역 (센트락 텍사스 지역) 의 각종 부동산 중개 서비스를 하고 있습니다. 김세규 부동산은 단독 주택, 타운홈, 다세대 주택, 상업용 부동산 (상가, 아파트, 대지, 오피스, 빌딩) 소개 및 매매, 렌트, 리스, 부동산 관리 등의 일을 합니다.", phone: "512.947.5599", email: "kimsekyu@gmail.com", profileName: "김세규 · REALTOR® / Broker", profileCaption: "2005년부터 풀타임으로 일해 온 텍사스 어스틴의 김세규에게 연락 주세요.",
    profileImage: "https://pub-8ca6b7121e244bc5a6e95146a35297bf.r2.dev/legacy/wordpress/uploads/2023/07/%EA%B9%80%EC%84%B8%EA%B7%9C-%EB%B6%80%EB%8F%99%EC%82%B0-%EC%9C%A0%ED%8A%9C%EB%B8%8C-%EB%A1%9C%EA%B3%A0-%EC%82%AC%EC%A7%84-875x1024.jpg",
  },
  footer: { kicker: "AUSTIN · TEXAS", brand: "김세규 부동산", company: "Austin Grace Realty LLC\nAustin, Round Rock & Central Texas", copyright: "© {year} Kim Sekyu Real Estate" },
};

function lines(value: string) {
  return value.split("\n").map((line, index, entries) => <Fragment key={`${line}-${index}`}>{line}{index < entries.length - 1 && <br />}</Fragment>);
}

function choose<T>(value: T[] | undefined, fallback: T[]) {
  return value && value.length > 0 ? value : fallback;
}

async function getHomepageData() {
  try {
    const payload = await getPayload({ config });
    const [news, settings, homepage] = await Promise.all([
      payload.find({ collection: "news", depth: 0, limit: 3, sort: "-publishedAt", overrideAccess: true }),
      payload.findGlobal({ slug: "site-settings", depth: 1, overrideAccess: true }),
      payload.findGlobal({ slug: "homepage", depth: 1, overrideAccess: true }),
    ]);
    return { news: news.docs.map((article) => ({ id: article.id, title: article.title as string, slug: article.slug, category: article.category, publishedAt: article.publishedAt, readCount: article.viewCount ?? 0 })) as Article[], heroImageURL: ((settings.heroImage as Media)?.url), homepage: homepage as unknown as Record<string, unknown> };
  } catch {
    return { news: [] as Article[], heroImageURL: undefined, homepage: {} as Record<string, unknown> };
  }
}

const formatDate = (value: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)).replace(",", "");

export default async function Home() {
  const { news: latestNews, heroImageURL, homepage } = await getHomepageData();
  const hero = { ...defaults.hero, ...(homepage.hero as Partial<typeof defaults.hero> | undefined) };
  const introduction = { ...defaults.introduction, ...(homepage.introduction as Partial<typeof defaults.introduction> | undefined) };
  const services = { ...defaults.services, ...(homepage.services as Partial<typeof defaults.services> | undefined) };
  const newsSection = { ...defaults.newsSection, ...(homepage.newsSection as Partial<typeof defaults.newsSection> | undefined) };
  const contact = { ...defaults.contact, ...(homepage.contact as Partial<typeof defaults.contact> | undefined) };
  const footer = { ...defaults.footer, ...(homepage.footer as Partial<typeof defaults.footer> | undefined) };
  const stats = choose(introduction.stats as Item[] | undefined, defaults.introduction.stats);
  const serviceCards = choose(services.cards as Item[] | undefined, defaults.services.cards);
  const emptyCardTitles = choose((newsSection.emptyCardTitles as Item[] | undefined)?.map((item) => item.title ? item : ({ title: item } as Item)), defaults.newsSection.emptyCardTitles.map((title) => ({ title })));
  const contactImageURL = typeof contact.profileImage === "string" ? contact.profileImage : (contact.profileImage as Media)?.url || defaults.contact.profileImage;

  return <main>
    <section className="hero" style={heroImageURL ? ({ "--hero-image": `url("${heroImageURL}")` } as CSSProperties) : undefined}>
      <div className="hero-copy"><p className="eyebrow">{hero.eyebrow}</p><h1>{lines(hero.heading)}<br /><em>{hero.emphasis}</em></h1><p className="hero-description">{hero.description}</p><div className="hero-actions"><a className="button button-primary" href={hero.primaryHref} target={hero.primaryHref.startsWith("http") ? "_blank" : undefined} rel={hero.primaryHref.startsWith("http") ? "noreferrer" : undefined}>{hero.primaryLabel} <span>↗</span></a><a className="button button-secondary" href={hero.secondaryHref}>{hero.secondaryLabel}</a></div></div>
      <div className="hero-side-note"><span>01</span>{lines(hero.sideNote)}</div>
    </section>

    <section className="intro-section section-shell"><p className="eyebrow">{introduction.eyebrow}</p><div className="split-heading"><h2>{lines(introduction.heading)}<br /><em>{introduction.emphasis}</em></h2><div><p>{introduction.description}</p><Link className="text-link" href={introduction.linkHref}>{introduction.linkLabel} <span>→</span></Link></div></div><div className="stat-row">{stats.map((stat) => <div key={stat.value}><strong>{stat.value}</strong><span>{stat.label}</span></div>)}</div></section>

    <section className="services-section"><div className="section-shell"><p className="eyebrow">{services.eyebrow}</p><div className="service-grid">{serviceCards.map((card, index) => <article key={card.title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{card.title}</h3><p>{card.description}</p><Link href={card.linkHref || "/"}>{card.linkLabel} →</Link></article>)}</div></div></section>

    <section className="news-section section-shell"><div className="section-heading-row"><div><p className="eyebrow">{newsSection.eyebrow}</p><h2>{newsSection.heading}</h2></div><Link className="text-link" href={newsSection.allLinkHref}>{newsSection.allLinkLabel} <span>→</span></Link></div><div className="news-grid">{latestNews.length > 0 ? latestNews.map((article) => <Link className="news-card" href={`/news/${article.slug}`} key={article.id}><div><span>{article.category.replace("legacy-board-", "Austin Report ")}</span><time>{formatDate(article.publishedAt)} · {newsSection.readLabel} {article.readCount.toLocaleString("en-US")}</time></div><h3>{article.title}</h3><b>{newsSection.articleLinkLabel} <span>↗</span></b></Link>) : emptyCardTitles.map((card, index) => <article className="news-card" key={card.title}><div><span>Austin Report 0{index + 1}</span><time>{newsSection.emptyStateLabel}</time></div><h3>{card.title}</h3><b>{newsSection.articleLinkLabel} <span>↗</span></b></article>)}</div></section>

    <section className="contact-banner"><div className="section-shell contact-content"><figure className="contact-agent"><img src={contactImageURL} alt={contact.profileName} /><figcaption><strong>{contact.profileName}</strong><span>{contact.profileCaption}</span></figcaption></figure><div className="contact-copy"><p className="eyebrow">{contact.eyebrow}</p><h2>{lines(contact.heading)}{contact.emphasis && <><br /><em>{contact.emphasis}</em></>}</h2><p className="contact-intro">{contact.introduction}</p><div className="contact-details"><a href={`tel:${contact.phone.replaceAll(".", "")}`}>{contact.phone}</a><a href={`mailto:${contact.email}`}>{contact.email}</a></div></div></div></section>

    <footer className="site-footer section-shell"><div className="brand"><span className="brand-kicker">{footer.kicker}</span><span>{footer.brand}</span></div><p>{lines(footer.company)}</p><p>{footer.copyright.replace("{year}", String(new Date().getFullYear()))}</p></footer>
  </main>;
}
