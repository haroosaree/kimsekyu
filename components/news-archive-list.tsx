"use client";

import Link from "next/link";
import { useState } from "react";
import { formatUSDate, type NewsListItem } from "@/lib/news-archives";

type Props = {
  initialItems: NewsListItem[];
  initialPage: number;
  totalPages: number;
  basePath: string;
  archive?: string;
  searchQuery?: string;
};

function paginationItems(currentPage: number, totalPages: number) {
  const pages = new Set([1, totalPages]);
  for (let page = Math.max(1, currentPage - 2); page <= Math.min(totalPages, currentPage + 2); page += 1) pages.add(page);
  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((page, index) => index > 0 && page - sorted[index - 1] > 1 ? (["…", page] as const) : ([page] as const));
}

export default function NewsArchiveList({ initialItems, initialPage, totalPages, basePath, archive, searchQuery }: Props) {
  const [items, setItems] = useState(initialItems);
  const [nextPage, setNextPage] = useState(initialPage + 1);
  const [loading, setLoading] = useState(false);
  const hasMore = nextPage <= totalPages;

  async function loadMore() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(nextPage) });
    if (archive) params.set("archive", archive);
    if (searchQuery) params.set("q", searchQuery);
    const response = await fetch(`/api/news-list?${params}`);
    if (response.ok) {
      const data = await response.json();
      setItems((current) => [...current, ...data.docs]);
      setNextPage((current) => current + 1);
    }
    setLoading(false);
  }

  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (searchQuery) params.set("q", searchQuery);
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  return <>
    <div className="archive-list">{items.map((item) => <Link href={`/news/${item.slug}`} key={item.id}>
      <div className="archive-thumbnail">{item.thumbnailURL && <img src={item.thumbnailURL} alt="" />}</div><h2>{item.title}</h2><div className="article-meta"><time>{formatUSDate(item.publishedAt)}</time><small>조회 {item.viewCount.toLocaleString("en-US")}</small></div><b>↗</b>
    </Link>)}</div>
    {totalPages > 1 && <nav className="archive-pagination" aria-label="페이지 탐색">
      <div className="desktop-pagination">
        {initialPage > 1 ? <Link className="pagination-arrow" href={pageHref(initialPage - 1)} aria-label="Previous page">←</Link> : <span className="pagination-arrow disabled" aria-hidden="true">←</span>}
        {paginationItems(initialPage, totalPages).map((item, index) => typeof item === "string" ? <span className="pagination-ellipsis" key={`${item}-${index}`}>{item}</span> : <Link className={item === initialPage ? "active" : ""} href={pageHref(item)} key={item}>{item}</Link>)}
        {initialPage < totalPages ? <Link className="pagination-arrow" href={pageHref(initialPage + 1)} aria-label="Next page">→</Link> : <span className="pagination-arrow disabled" aria-hidden="true">→</span>}
      </div>
      {hasMore && <button type="button" className="mobile-more" onClick={loadMore} disabled={loading}>{loading ? "불러오는 중…" : "Show more · 더보기"}<span>↓</span></button>}
    </nav>}
  </>;
}
