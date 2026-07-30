export const PAGE_SIZE = 10;

export const categoryArchives = {
  "property-info": {
    title: "부동산 정보",
    categories: ["property-info"],
  },
  "austin-real-estate": {
    title: "어스틴 부동산",
    categories: ["austin-news"],
  },
  "austin-economy": {
    title: "어스틴 경제/뉴스",
    categories: ["austin-news"],
  },
  "austin-news": {
    title: "어스틴 소식",
    // Keep the legacy category stored on every article. This combined menu only reads it.
    categories: ["austin-news"],
  },
  questions: {
    title: "질문/답변",
    categories: ["property-info"],
  },
} as const;

export type ArchiveSlug = keyof typeof categoryArchives;

export const austinEconomySubmenus = {
  business: { title: "어스틴 경제/비지니스 소식", categories: ["austin-news"] },
  koreanbusiness: { title: "어스틴 한인업소록", categories: ["resources/koreanbusiness"] },
  tours: { title: "어스틴 관광명소", categories: ["resources/tours"] },
  gallery: { title: "어스틴 사진/풍경", categories: ["resources/gallery"] },
} as const;
export type NewsListItem = { id: string | number; title: string; slug: string; publishedAt: string; viewCount: number; thumbnailURL?: string };

export function formatUSDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)).replace(",", "");
}

export function pageFrom(value: string | undefined) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}
