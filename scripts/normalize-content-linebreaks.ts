import { getPayload } from "payload";
import config from "@payload-config";

const normalizeLineBreaks = (html: string) => html.replace(/\r?\n+/g, "<br>").replace(/(<br\s*\/?>(?:\s|&nbsp;)*){2,}/gi, "<br>");

async function normalizeCollection(collection: "pages" | "news") {
  const payload = await getPayload({ config });
  const result = await payload.find({ collection, limit: 5000, depth: 0, overrideAccess: true });
  const records = result.docs.filter((record) => typeof record.contentHTML === "string" && (/\r?\n/.test(record.contentHTML) || /(<br\s*\/?>(?:\s|&nbsp;)*){2,}/i.test(record.contentHTML)));
  let next = 0;
  let updated = 0;

  await Promise.all(Array.from({ length: 6 }, async () => {
    while (next < records.length) {
      const record = records[next++];
      await payload.update({
        collection,
        id: record.id,
        data: { contentHTML: normalizeLineBreaks(record.contentHTML as string) },
        overrideAccess: true,
      });
      updated += 1;
      if (updated % 100 === 0 || updated === records.length) console.log(`${collection}: ${updated}/${records.length}`);
    }
  }));
  return { total: result.totalDocs, updated };
}

const [pages, news] = await Promise.all([normalizeCollection("pages"), normalizeCollection("news")]);
console.log(`Line-break normalization complete: ${pages.updated}/${pages.total} Pages, ${news.updated}/${news.total} News.`);
