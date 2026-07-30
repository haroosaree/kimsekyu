import { getPayload } from "payload";
import config from "@payload-config";

const normalizeLineBreaks = (html: string) => html
  .replace(/\r?\n+/g, "<br>")
  .replace(/(<br\s*\/?>(?:\s|&nbsp;)*){2,}/gi, "<br>")
  .replace(/<br\s*\/?>\s*(?=<(?:div|p|h[1-6]|ul|ol|li|table|thead|tbody|tr|blockquote|pre|figure)\b)/gi, "")
  .replace(/(<\/(?:div|p|h[1-6]|ul|ol|li|table|thead|tbody|tr|blockquote|pre|figure)>)\s*<br\s*\/?>/gi, "$1");

const needsNormalization = (html: string) => /\r?\n|(<br\s*\/?>(?:\s|&nbsp;)*){2,}|<br\s*\/?>\s*<(?:div|p|h[1-6]|ul|ol|li|table|thead|tbody|tr|blockquote|pre|figure)\b|<\/(?:div|p|h[1-6]|ul|ol|li|table|thead|tbody|tr|blockquote|pre|figure)>\s*<br\s*\/?>/i.test(html);

async function normalizeCollection(collection: "pages" | "news-feed") {
  const payload = await getPayload({ config });
  const result = await payload.find({ collection, limit: 5000, depth: 0, overrideAccess: true });
  const contentField = collection === "pages" ? "contentHTML" : "legacyContent";
  const records = result.docs.filter((record) => {
    const value = (record as unknown as Record<string, unknown>)[contentField];
    return typeof value === "string" && needsNormalization(value);
  });
  let next = 0;
  let updated = 0;

  await Promise.all(Array.from({ length: 6 }, async () => {
    while (next < records.length) {
      const record = records[next++];
      const content = String((record as unknown as Record<string, unknown>)[contentField] || "");
      await payload.update({
        collection,
        id: record.id,
        data: { [contentField]: normalizeLineBreaks(content) } as never,
        overrideAccess: true,
      });
      updated += 1;
      if (updated % 100 === 0 || updated === records.length) console.log(`${collection}: ${updated}/${records.length}`);
    }
  }));
  return { total: result.totalDocs, updated };
}

const [pages, news] = await Promise.all([normalizeCollection("pages"), normalizeCollection("news-feed")]);
console.log(`Line-break normalization complete: ${pages.updated}/${pages.total} Pages, ${news.updated}/${news.total} News.`);
