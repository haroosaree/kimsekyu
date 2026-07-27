import Link from "next/link";
import MenuHero from "@/components/menu-hero";
import ContactForm from "./contact-form";

export const dynamic = "force-dynamic";

export default function ContactPage() {
  return <><MenuHero /><main className="article-page">
    <nav className="breadcrumb" aria-label="현재 위치"><Link href="/">홈</Link><span>›</span><span>문의하기 - Contact Us</span></nav>
    <p className="eyebrow">CONTACT US</p>
    <h1>문의하기</h1>
    <p className="question-intro">부동산과 어스틴 생활에 관한 문의를 남겨 주세요. 확인 후 김세규 부동산에서 연락드리겠습니다.</p>
    <ContactForm />
  </main></>;
}
