export const PAGE_SIZE = 10;

export const categoryArchives = {
  "property-info": {
    title: "부동산 정보",
    categories: ["property-info"],
    legacyBoardIds: ["legacy-board-1", "legacy-board-2", "legacy-board-3", "legacy-board-4"],
  },
  "austin-real-estate": {
    title: "어스틴 부동산",
    categories: ["property-info"],
    legacyBoardIds: ["legacy-board-5"],
  },
  "austin-economy": {
    title: "어스틴 경제/뉴스",
    categories: ["austin-news"],
    legacyBoardIds: ["legacy-board-6", "legacy-board-7", "legacy-board-8"],
  },
  "austin-news": {
    title: "어스틴 소식",
    // Keep the legacy category stored on every article. This combined menu only reads it.
    categories: ["austin-news"],
    legacyBoardIds: ["legacy-board-6", "legacy-board-7", "legacy-board-8"],
  },
  questions: {
    title: "질문/답변",
    categories: ["property-info"],
    legacyBoardIds: ["legacy-board-13"],
  },
} as const;

export type ArchiveSlug = keyof typeof categoryArchives;

export const austinEconomySubmenus = {
  "austin-general": { title: "어스틴 부동산 소식", categories: ["property-info"], legacyBoardIds: ["legacy-board-5"] },
  settle: { title: "어스틴 정착", categories: ["austin-news"], legacyBoardIds: ["legacy-board-6"] },
  facts: { title: "어스틴 통계/순위/평가", categories: ["austin-news"], legacyBoardIds: ["legacy-board-7"] },
  market: { title: "미국 부동산 소식 / 시장 정보", categories: ["property-info"], legacyBoardIds: ["legacy-board-1"], legacyLabels: ["미국 부동산 소식 / 시장 정보"] },
  selling: { title: "집을 팔때", categories: ["property-info"], legacyBoardIds: ["legacy-board-2"], legacyLabels: ["주택 매도 가이드"] },
  buying: { title: "집을 살때", categories: ["property-info"], legacyBoardIds: ["legacy-board-3"], legacyLabels: ["주택 구매 / 생활 정보"] },
  finance: { title: "융자 · 모기지 · 크레딧", categories: ["property-info"], legacyBoardIds: ["legacy-board-4"], legacyLabels: ["융자 · 모기지 · 크레딧"] },
  local: { title: "어스틴 지역 · 동네 정보", categories: ["austin-news"], legacyBoardIds: ["legacy-board-6"] },
  economy: { title: "어스틴 경제 · 순위 · 고용", categories: ["austin-news"], legacyBoardIds: ["legacy-board-7"] },
  business: { title: "어스틴 경제 · 비즈니스 뉴스", categories: ["austin-news"], legacyBoardIds: ["legacy-board-8"] },
  koreanbusiness: { title: "어스틴 한인업소록", categories: ["resources/koreanbusiness"], legacyBoardIds: ["legacy-board-9"] },
  koreancommunity: { title: "어스틴 한인 커뮤니티", categories: ["resources/koreanbusiness"], legacyBoardIds: ["legacy-board-14"] },
  tours: { title: "어스틴 관광명소", categories: ["resources/tours"], legacyBoardIds: ["legacy-board-10", "legacy-board-15"] },
  gallery: { title: "어스틴 사진/풍경", categories: ["resources/gallery"], legacyBoardIds: ["legacy-board-11"] },
} as const;
export type NewsListItem = { id: string | number; title: string; slug: string; publishedAt: string; viewCount: number; thumbnailURL?: string };

export function formatUSDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)).replace(",", "");
}

export function pageFrom(value: string | undefined) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}
