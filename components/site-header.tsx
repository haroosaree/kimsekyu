"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navigation = [
  { label: "매물검색", href: "http://austingrace.matrix.abor.com/Matrix/Public/?L=1&ap=SCH", external: true },
  { label: "부동산 정보", href: "/news/property-info" },
  { label: "어스틴 부동산", href: "/news/austin-real-estate" },
  { label: "어스틴 경제/뉴스", href: "/news/austin-economy" },
  {
    label: "자료실",
    href: "/resources",
    children: [
      { label: "교육/학군", href: "/school" },
      { label: "오스틴 한인업소록", href: "/news/austin-economy/koreanbusiness" },
      { label: "어스틴 관광명소", href: "/news/austin-economy/tours" },
      { label: "어스틴 사진/풍경", href: "/news/austin-economy/gallery" },
    ],
  },
  { label: "질문/답변", href: "/news/questions" },
  { label: "김세규 부동산 소개", href: "/agent" },
];

function MenuLinks({ className, onNavigate }: { className: string; onNavigate?: () => void }) {
  return <nav className={className} aria-label="주요 메뉴">{navigation.map((item) => item.external ? (
    <a key={item.label} href={item.href} target="_blank" rel="noreferrer" onClick={onNavigate}>{item.label}</a>
  ) : <div className={item.children ? "nav-with-children" : undefined} key={item.label}><Link href={item.href} onClick={onNavigate}>{item.label}</Link>{item.children && <div className="nav-submenu">{item.children.map((child) => <Link href={child.href} key={child.label} onClick={onNavigate}>{child.label}</Link>)}</div>}</div>)}</nav>;
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
      <Link href="/" className="brand" aria-label="김세규 부동산 홈"><span className="brand-kicker">AUSTIN · TEXAS</span><span>김세규 부동산</span></Link>
      <MenuLinks className="desktop-nav" />
      <SiteSearch />
      <a className="header-contact" href="tel:+15129475599">512.947.5599</a>
      <button className="mobile-menu-toggle" type="button" aria-label="메뉴 열기" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><span /><span /><span /></button>
    </header>
    {menuOpen && <button className="mobile-menu-backdrop" type="button" aria-label="메뉴 닫기" onClick={() => setMenuOpen(false)} />}
    <div className={`mobile-nav ${menuOpen ? "is-open" : ""}`}><SiteSearch onNavigate={() => setMenuOpen(false)} /><MenuLinks className="mobile-nav-links" onNavigate={() => setMenuOpen(false)} /></div>
  </>;
}
