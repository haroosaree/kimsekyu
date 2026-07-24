"use client";

import { useEffect, useState } from "react";

export default function ArticleReadCount({ id, initialCount }: { id: string | number; initialCount: number }) {
  const [count, setCount] = useState(initialCount);
  useEffect(() => {
    fetch(`/api/news/${id}/view`, { method: "POST" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (typeof data?.readCount === "number") setCount(data.readCount); })
      .catch(() => undefined);
  }, [id]);
  return <span>조회 {count.toLocaleString("en-US")}</span>;
}
