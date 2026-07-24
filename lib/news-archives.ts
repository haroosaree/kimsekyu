export const PAGE_SIZE = 10;

export const categoryArchives = {
  "property-info": {
    title: "부동산 정보",
    categories: [
      "legacy-board-1", "legacy-board-2", "legacy-board-3", "legacy-board-4",
      "미국 부동산 소식 / 시장 정보", "주택 매도 가이드", "주택 구매 / 생활 정보", "융자 · 모기지 · 크레딧",
    ],
  },
  "austin-real-estate": {
    title: "어스틴 부동산",
    categories: ["legacy-board-5", "legacy-board-6", "어스틴 부동산", "어스틴 지역 · 동네 정보"],
  },
  "austin-economy": {
    title: "어스틴 경제/뉴스",
    categories: [
      "legacy-board-8", "어스틴 경제 · 비즈니스 뉴스",
    ],
  },
  questions: {
    title: "질문/답변",
    categories: ["legacy-board-13", "부동산 질문 · 답변"],
  },
} as const;

export type ArchiveSlug = keyof typeof categoryArchives;

export const austinEconomySubmenus = {
  business: { title: "어스틴 경제/비지니스 소식", categories: ["legacy-board-8", "어스틴 경제 · 비즈니스 뉴스"] },
  koreanbusiness: { title: "오스틴 한인업소록", categories: ["legacy-board-9", "어스틴 한인 비즈니스 · 기관"] },
  tours: { title: "어스틴 관광명소", categories: ["legacy-board-10", "여행 · 레저"] },
  gallery: { title: "어스틴 사진/풍경", categories: ["legacy-board-15", "어스틴 생활 · 명소"] },
} as const;
export type NewsListItem = { id: string | number; title: string; slug: string; publishedAt: string; viewCount: number; thumbnailURL?: string };

export function formatUSDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)).replace(",", "");
}

export function pageFrom(value: string | undefined) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}
