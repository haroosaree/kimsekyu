import { getPayload } from "payload";
import config from "@payload-config";

const legacyMapping: Record<string, { label: string; category: string }> = {
  "legacy-board-1": { label: "미국 부동산 소식 / 시장 정보", category: "property-info" },
  "legacy-board-2": { label: "주택 매도 가이드", category: "property-info" },
  "legacy-board-3": { label: "주택 구매 / 생활 정보", category: "property-info" },
  "legacy-board-4": { label: "융자 · 모기지 · 크레딧", category: "property-info" },
  "legacy-board-5": { label: "어스틴 부동산", category: "property-info" },
  "legacy-board-6": { label: "어스틴 지역 · 동네 정보", category: "austin-news" },
  "legacy-board-7": { label: "어스틴 경제 · 순위 · 고용", category: "austin-news" },
  "legacy-board-8": { label: "어스틴 경제 · 비즈니스 뉴스", category: "austin-news" },
  "legacy-board-9": { label: "어스틴 한인 비즈니스 · 기관", category: "resources/koreanbusiness" },
  "legacy-board-10": { label: "여행 · 레저", category: "resources/tours" },
  "legacy-board-12": { label: "교육 · 학군 · 대학", category: "resources/school" },
  "legacy-board-13": { label: "부동산 질문 · 답변", category: "property-info" },
  "legacy-board-14": { label: "어스틴 한인 커뮤니티", category: "resources/koreanbusiness" },
  "legacy-board-15": { label: "어스틴 생활 · 명소", category: "resources/gallery" },
};

async function main() {
  const payload = await getPayload({ config });
  let updated = 0;
  let skipped = 0;
  let page = 1;
  let total = 0;
  while (true) {
    const result = await payload.find({ collection: "news", limit: 250, page, depth: 0, overrideAccess: true });
    total = result.totalDocs;
    for (const item of result.docs) {
    const legacyCategory = String(item.legacy_category || item.category || "");
    const mapping = legacyMapping[legacyCategory];
    if (!mapping) { skipped += 1; continue; }
    await payload.update({ collection: "news", id: item.id, data: { legacy_category: legacyCategory, category: mapping.category }, overrideAccess: true });
    updated += 1;
    }
    console.log(`Processed ${Math.min(page * 250, total)}/${total}`);
    if (!result.hasNextPage) break;
    page += 1;
  }
  console.log(`Updated ${updated} News records; skipped ${skipped} without a mapping.`);
  process.exit(0);
}

main().catch((error) => { console.error(error); process.exit(1); });
