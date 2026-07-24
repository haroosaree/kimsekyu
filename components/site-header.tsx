"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { label: "매물검색", href: "http://austingrace.matrix.abor.com/Matrix/Public/?L=1&ap=SCH", external: true },
  { label: "부동산 정보", href: "/news/property-info" },
  { label: "어스틴 부동산", href: "/news/austin-real-estate" },
  { label: "어스틴 경제/뉴스", href: "/news/austin-economy" },
  { label: "교육/학군", href: "/school" },
  { label: "질문/답변", href: "/news/questions" },
  { label: "김세규 부동산 소개", href: "/agent" },
];

function MenuLinks({ className }: { className: string }) {
  return <nav className={className} aria-label="주요 메뉴">{navigation.map((item) => item.external ? (
    <a key={item.label} href={item.href} target="_blank" rel="noreferrer">{item.label}</a>
  ) : <Link key={item.label} href={item.href}>{item.label}</Link>)}</nav>;
}

export default function SiteHeader() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname.startsWith("/api")) return null;
  return <>
    <header className="site-header">
      <Link href="/" className="brand" aria-label="김세규 부동산 홈"><span className="brand-kicker">AUSTIN · TEXAS</span><span>김세규 부동산</span></Link>
      <MenuLinks className="desktop-nav" />
      <a className="header-contact" href="tel:+15129475599">512.947.5599</a>
    </header>
    <MenuLinks className="mobile-nav" />
  </>;
}
