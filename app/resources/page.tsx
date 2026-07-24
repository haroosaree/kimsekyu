import Link from "next/link";
import MenuHero from "@/components/menu-hero";

const resources = [
  { label: "오스틴 한인업소록", href: "/news/austin-economy/koreanbusiness", description: "오스틴 지역 한인 업소와 기관 정보" },
  { label: "어스틴 관광명소", href: "/news/austin-economy/tours", description: "여행과 레저를 위한 오스틴 명소" },
  { label: "어스틴 사진/풍경", href: "/news/austin-economy/gallery", description: "오스틴의 풍경과 장소 기록" },
];

export default function ResourcesPage() {
  return <><MenuHero /><main className="archive-page">
    <nav className="breadcrumb" aria-label="현재 위치"><Link href="/">홈</Link><span>›</span><span>자료실</span></nav>
    <p className="eyebrow">RESOURCES</p>
    <h1>자료실</h1>
    <div className="resource-links">{resources.map((resource) => <Link href={resource.href} key={resource.href}><span>{resource.label}</span><small>{resource.description}</small><b>→</b></Link>)}</div>
  </main></>;
}
