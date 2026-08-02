"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navigation = [
  { label: "매물검색", href: "http://austingrace.matrix.abor.com/Matrix/Public/?L=1&ap=SCH", external: true },
  {
    label: "부동산 정보",
    // href: "/property-info",
    children: [
      { label: "미국 부동산 소식 / 시장 정보", href: "/property-info/market" },
      { label: "집을 살때", href: "/property-info/buying" },
      { label: "집을 팔때", href: "/property-info/selling" },
      { label: "융자 · 모기지 · 크레딧", href: "/property-info/finance" },
    ],
  },
  {
    label: "어스틴 부동산",
    // href: "/austin-real-estate",
    children: [
      { label: "어스틴 부동산 소식", href: "/austin-real-estate/austin-general" },
      { label: "어스틴 정착", href: "/austin-real-estate/settle" },
      { label: "어스틴 통계/순위/평가", href: "/austin-real-estate/facts" },
    ],
  },
  { label: "어스틴 경제/뉴스", href: "/austin-economy" },
  {
    label: "교육/학군",
    children: [
      { label: "어스틴 학군 맵", href: "/resources/school/map" },
      { label: "교육/학군/대학", href: "/resources/school/schooldistrict" },
    ],
  },
  { label: "문의하기", href: "/contact" },
  { label: "김세규 부동산 소개", href: "/agent" },
];

function MenuLinks({ className, onNavigate }: { className: string; onNavigate?: () => void }) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const isMobile = className === "mobile-nav-links";

  return <nav className={className} aria-label="주요 메뉴">{navigation.map((item) => item.external ? (
    <a key={item.label} href={item.href} target="_blank" rel="noreferrer" onClick={onNavigate}>{item.label}</a>
  ) : item.children && isMobile ? <div className={`mobile-nav-item ${expandedItem === item.label ? "is-expanded" : ""}`} key={item.label}>
    <div className="mobile-nav-primary"><button className="mobile-nav-label" type="button" aria-expanded={expandedItem === item.label} onClick={() => setExpandedItem((current) => current === item.label ? null : item.label)}>{item.label}</button><button type="button" aria-label={`${item.label} 하위 메뉴 ${expandedItem === item.label ? "닫기" : "열기"}`} aria-expanded={expandedItem === item.label} onClick={() => setExpandedItem((current) => current === item.label ? null : item.label)}>⌄</button></div>
    <div className="mobile-nav-submenu">{item.children.map((child) => <Link href={child.href} key={child.label} onClick={onNavigate}>{child.label}</Link>)}</div>
  </div> : <div className={item.children ? "nav-with-children" : undefined} key={item.label}>{item.children || (item as { clickable?: boolean }).clickable === false ? <span className="nav-parent-label">{item.label}</span> : <Link href={item.href} onClick={onNavigate}>{item.label}</Link>}{item.children && <><span className="nav-children-indicator" aria-hidden="true">⌄</span><div className="nav-submenu">{item.children.filter((child) => Boolean(child.href)).map((child) => <Link href={child.href} key={child.label} onClick={onNavigate}>{child.label}</Link>)}</div></>}</div>)}</nav>;
}

function SiteSearch({ onNavigate }: { onNavigate?: () => void }) {
  return <form className="site-search" action="/search" role="search" onSubmit={onNavigate}>
    <label className="sr-only" htmlFor="site-search">사이트 검색</label>
    <input id="site-search" name="q" type="search" placeholder="검색" minLength={2} required />
    <button type="submit" aria-label="검색">⌕</button>
  </form>;
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  if (pathname.startsWith("/admin") || pathname.startsWith("/api")) return null;
  return <>
    <header className="site-header">
      <Link href="/" className="brand" aria-label="김세규 부동산 홈"><img className="brand-photo" src="https://pub-8ca6b7121e244bc5a6e95146a35297bf.r2.dev/site/general/kim-sekyu-profile.jpg" alt="김세규" /><span className="brand-text"><span className="brand-kicker">AUSTIN · TEXAS</span><span>김세규 부동산</span><small>열정·믿음·긍정</small></span></Link>
      <MenuLinks className="desktop-nav" />
      <SiteSearch />
      <a className="header-contact" href="tel:+15129475599">512.947.5599</a>
      <button className="mobile-menu-toggle" type="button" aria-label="메뉴 열기" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><span /><span /><span /></button>
    </header>
    {menuOpen && <button className="mobile-menu-backdrop" type="button" aria-label="메뉴 닫기" onClick={() => setMenuOpen(false)} />}
    <div className={`mobile-nav ${menuOpen ? "is-open" : ""}`}><SiteSearch onNavigate={() => setMenuOpen(false)} /><MenuLinks className="mobile-nav-links" onNavigate={() => setMenuOpen(false)} /></div>
  </>;
}
