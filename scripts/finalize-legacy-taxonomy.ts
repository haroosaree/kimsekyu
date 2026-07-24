import { getPayload } from "payload";
import config from "@payload-config";

const categoryLabels: Record<string, string> = {
  "legacy-board-1": "미국 부동산 소식 / 시장 정보",
  "legacy-board-2": "주택 매도 가이드",
  "legacy-board-3": "주택 구매 / 생활 정보",
  "legacy-board-4": "융자 · 모기지 · 크레딧",
  "legacy-board-5": "어스틴 부동산",
  "legacy-board-6": "어스틴 지역 · 동네 정보",
  "legacy-board-7": "어스틴 경제 · 순위 · 고용",
  "legacy-board-8": "어스틴 경제 · 비즈니스 뉴스",
  "legacy-board-9": "어스틴 한인 비즈니스 · 기관",
  "legacy-board-10": "여행 · 레저",
  "legacy-board-12": "교육 · 학군 · 대학",
  "legacy-board-13": "부동산 질문 · 답변",
  "legacy-board-14": "어스틴 한인 커뮤니티",
  "legacy-board-15": "어스틴 생활 · 명소",
  blog: "블로그",
};

const navigationItems = [
  { label: "매물검색", href: "http://austingrace.matrix.abor.com/Matrix/Public/?L=1&ap=SCH", legacyUrl: "http://austingrace.matrix.abor.com/Matrix/Public/?L=1&ap=SCH", openInNewTab: true },
  { label: "부동산 정보", href: "/news/property-info", legacyUrl: "http://kimsekyu.com/index.php/property_info/", openInNewTab: false },
  { label: "어스틴 부동산", href: "/news/austin-real-estate", legacyUrl: "http://kimsekyu.com/index.php/austinre/", openInNewTab: false },
  { label: "어스틴 경제/뉴스", href: "/news/austin-economy", legacyUrl: "http://kimsekyu.com/index.php/austinnews/", openInNewTab: false },
  { label: "교육/학군", href: "/school", legacyUrl: "http://kimsekyu.com/index.php/school/", openInNewTab: false },
  { label: "질문/답변", href: "/news/questions", legacyUrl: "http://kimsekyu.com/index.php/q/", openInNewTab: false },
  { label: "김세규 부동산 소개", href: "/agent", legacyUrl: "http://kimsekyu.com/index.php/agent/", openInNewTab: false },
];

async function main() {
  const payload = await getPayload({ config });
  const result = await payload.find({ collection: "news", limit: 5000, depth: 0, overrideAccess: true });
  const records = result.docs.filter((record) => categoryLabels[record.category]);
  let next = 0;
  let updated = 0;

  await Promise.all(Array.from({ length: 6 }, async () => {
    while (next < records.length) {
      const record = records[next++];
      await payload.update({
        collection: "news",
        id: record.id,
        data: { category: categoryLabels[record.category] },
        overrideAccess: true,
      });
      updated += 1;
      if (updated % 100 === 0 || updated === records.length) console.log(`Categorized ${updated}/${records.length}`);
    }
  }));

  await payload.updateGlobal({ slug: "navigation", data: { items: navigationItems }, overrideAccess: true });
  console.log(`Finalized ${updated} News categories and ${navigationItems.length} navigation items.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
