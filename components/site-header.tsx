"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navigation = [
  { label: "매물검색", href: "http://austingrace.matrix.abor.com/Matrix/Public/?L=1&ap=SCH", external: true },
  { label: "부동산 정보", href: "/property-info" },
  { label: "어스틴 소식", href: "/austin-news" },
  {
    label: "자료실",
    href: "/resources",
    clickable: false,
    children: [
      { label: "교육/학군", href: "/resources/school" },
      { label: "어스틴 한인업소록", href: "/resources/koreanbusiness" },
      { label: "어스틴 관광명소", href: "/resources/tours" },
      { label: "어스틴 사진/풍경", href: "/resources/gallery" },
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
    <div className="mobile-nav-primary">{item.clickable === false ? <button className="mobile-nav-label" type="button" aria-expanded={expandedItem === item.label} onClick={() => setExpandedItem((current) => current === item.label ? null : item.label)}>{item.label}</button> : <Link href={item.href} onClick={onNavigate}>{item.label}</Link>}<button type="button" aria-label={`${item.label} 하위 메뉴 ${expandedItem === item.label ? "닫기" : "열기"}`} aria-expanded={expandedItem === item.label} onClick={() => setExpandedItem((current) => current === item.label ? null : item.label)}>⌄</button></div>
    <div className="mobile-nav-submenu">{item.children.map((child) => <Link href={child.href} key={child.label} onClick={onNavigate}>{child.label}</Link>)}</div>
  </div> : <div className={item.children ? "nav-with-children" : undefined} key={item.label}>{item.clickable === false ? <span className="nav-parent-label">{item.label}</span> : <Link href={item.href} onClick={onNavigate}>{item.label}</Link>}{item.children && <div className="nav-submenu">{item.children.map((child) => <Link href={child.href} key={child.label} onClick={onNavigate}>{child.label}</Link>)}</div>}</div>)}</nav>;
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
