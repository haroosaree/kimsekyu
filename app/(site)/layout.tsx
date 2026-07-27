import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SiteHeader from "@/components/site-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL || "https://kimsekyu.com"),
  title: { default: "김세규 부동산 | Austin Real Estate", template: "%s | 김세규 부동산" },
  description: "어스틴과 센트럴 텍사스의 주거용·상업용 부동산 파트너, 김세규 부동산.",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    title: "김세규 부동산 | Austin Real Estate",
    description: "어스틴과 센트럴 텍사스의 주거용·상업용 부동산 파트너.",
    images: ["/og.png"],
  },
  twitter: { card: "summary_large_image", title: "김세규 부동산 | Austin Real Estate", description: "어스틴과 센트럴 텍사스의 주거용·상업용 부동산 파트너." },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><SiteHeader />{children}</body>
    </html>
  );
}
