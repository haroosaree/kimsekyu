"use client";

import Link from "next/link";
import { useState } from "react";
import type { NewsListItem } from "@/lib/news-archives";

type Props = {
  initialItems: NewsListItem[];
  initialPage: number;
  totalPages: number;
  basePath: string;
  archive?: string;
};

const formatDate = (value: string) => new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(value));

export default function NewsArchiveList({ initialItems, initialPage, totalPages, basePath, archive }: Props) {
  const [items, setItems] = useState(initialItems);
  const [nextPage, setNextPage] = useState(initialPage + 1);
  const [loading, setLoading] = useState(false);
  const hasMore = nextPage <= totalPages;

  async function loadMore() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(nextPage) });
    if (archive) params.set("archive", archive);
    const response = await fetch(`/api/news?${params}`);
    if (response.ok) {
      const data = await response.json();
      setItems((current) => [...current, ...data.docs]);
      setNextPage((current) => current + 1);
    }
    setLoading(false);
  }

  return <>
    <div className="archive-list">{items.map((item) => <Link href={`/news/${item.slug}`} key={item.id}>
      <span>{item.category}</span><h2>{item.title}</h2><time>{formatDate(item.publishedAt)}</time><b>↗</b>
    </Link>)}</div>
    {totalPages > 1 && <nav className="archive-pagination" aria-label="페이지 탐색">
      <div className="desktop-pagination">{Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => <Link className={page === initialPage ? "active" : ""} href={page === 1 ? basePath : `${basePath}?page=${page}`} key={page}>{page}</Link>)}</div>
      {hasMore && <button type="button" className="mobile-more" onClick={loadMore} disabled={loading}>{loading ? "불러오는 중…" : "Show more · 더보기"}<span>↓</span></button>}
    </nav>}
  </>;
}
