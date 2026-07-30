import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";
import { getPayload } from "payload";
import config from "@payload-config";

type LegacyItem = Record<string, string | number | LegacyItem[] | undefined>;

async function main() {
const dryRun = process.argv.includes("--dry-run");
const required = ["WORDPRESS_EXPORT_PATH", "R2_PUBLIC_BASE_URL"];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) throw new Error(`Missing environment variable(s): ${missing.join(", ")}`);

const publicAssetBaseUrl = process.env.R2_PUBLIC_BASE_URL!.replace(/\/$/, "");
const xml = await readFile(process.env.WORDPRESS_EXPORT_PATH!, "utf8");
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseTagValue: false,
  trimValues: false,
});
const parsed = parser.parse(xml) as { rss: { channel: { item?: LegacyItem[] | LegacyItem } } };
const channelItems = parsed.rss.channel.item ?? [];
const items = Array.isArray(channelItems) ? channelItems : [channelItems];

const string = (value: unknown) => (typeof value === "string" || typeof value === "number" ? String(value).trim() : "");
const postType = (item: LegacyItem) => string(item["wp:post_type"]);
const postStatus = (item: LegacyItem) => string(item["wp:status"]);
const rewriteAssetUrls = (html: string) =>
  html.replaceAll("http://kimsekyu.com/wp-content/uploads/", `${publicAssetBaseUrl}/legacy/wordpress/uploads/`);
const normalizeLineBreaks = (html: string) => html
  .replace(/\r?\n+/g, "<br>")
  .replace(/(<br\s*\/?>(?:\s|&nbsp;)*){2,}/gi, "<br>")
  .replace(/<br\s*\/?>\s*(?=<(?:div|p|h[1-6]|ul|ol|li|table|thead|tbody|tr|blockquote|pre|figure)\b)/gi, "")
  .replace(/(<\/(?:div|p|h[1-6]|ul|ol|li|table|thead|tbody|tr|blockquote|pre|figure)>)\s*<br\s*\/?>/gi, "$1");
const prepareHTML = (html: string) => normalizeLineBreaks(rewriteAssetUrls(html));
const dateISO = (value: string) => new Date(`${value.replace(" ", "T")}Z`).toISOString();
const safeSlug = (value: string, fallback: string) => value || fallback;

const pages = items.filter((item) => postType(item) === "page" && postStatus(item) === "publish");
const kboard = items.filter((item) => postType(item) === "kboard" && postStatus(item) === "publish");
const posts = items.filter((item) => postType(item) === "post" && postStatus(item) === "publish");

const summary = {
  pages: pages.length,
  kboardNews: kboard.length,
  posts: posts.length,
  mode: dryRun ? "dry-run" : "import",
};

await mkdir(".migration", { recursive: true });
await writeFile(".migration/wordpress-content-summary.json", `${JSON.stringify(summary, null, 2)}\n`);

if (dryRun) {
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}

const payload = await getPayload({ config });
let created = 0;
let updated = 0;
let processed = 0;
const [existingPages, existingNews] = await Promise.all([
  payload.find({ collection: "pages", limit: 1000, depth: 0, overrideAccess: true }),
  payload.find({ collection: "news-feed", limit: 5000, depth: 0, overrideAccess: true }),
]);
const pageIdsByLegacyUrl = new Map(existingPages.docs.map((doc) => [doc.legacyUrl, doc.id]));
const newsIdsByLegacyId = new Map(existingNews.docs.map((doc) => [doc.legacyId, doc.id]));

async function upsertPage(item: LegacyItem) {
  const legacyUrl = string(item.link);
  const existingId = pageIdsByLegacyUrl.get(legacyUrl);
  const data = {
    title: string(item.title) || `Untitled legacy page ${string(item["wp:post_id"])}`,
    slug: safeSlug(string(item["wp:post_name"]), `legacy-page-${string(item["wp:post_id"])}`),
    legacyUrl,
    contentHTML: prepareHTML(string(item["content:encoded"])),
    publishedAt: dateISO(string(item["wp:post_date_gmt"]) || string(item["wp:post_date"])),
  };
  if (existingId) {
    await payload.update({ collection: "pages", id: existingId, data, overrideAccess: true });
    updated += 1;
  } else {
    await payload.create({ collection: "pages", data, overrideAccess: true });
    created += 1;
  }
}

async function upsertNews(item: LegacyItem, category: string, legacyBoardId?: string) {
  const legacyId = string(item["wp:post_id"]);
  const existingId = newsIdsByLegacyId.get(legacyId);
  const baseSlug = safeSlug(string(item["wp:post_name"]), `legacy-news-${legacyId}`);
  const slugMatches = await payload.find({ collection: "news-feed", where: { slug: { equals: baseSlug } }, limit: 2, depth: 0, overrideAccess: true, select: { id: true, legacyId: true } });
  const slug = slugMatches.docs.some((doc) => String(doc.legacyId) !== legacyId && String(doc.id) !== String(existingId)) ? `${baseSlug}-${legacyId}` : baseSlug;
  const data = {
    title: string(item.title) || `Untitled legacy article ${legacyId}`,
    slug,
    category,
    legacy_category: category,
    legacyId,
    legacyBoardId,
    legacyUrl: string(item.link),
    contentHTML: prepareHTML(string(item["content:encoded"])),
    publishedAt: dateISO(string(item["wp:post_date_gmt"]) || string(item["wp:post_date"])),
    legacyViewCount: 0,
    viewCount: 0,
    readCount: 0,
    legacyAuthor: string(item["dc:creator"]),
  };
  if (existingId) {
    const { legacyViewCount: ___, viewCount: __, readCount: _, ...updateData } = data;
    await payload.update({ collection: "news-feed", id: existingId, data: updateData as never, overrideAccess: true });
    updated += 1;
  } else {
    await payload.create({ collection: "news-feed", data: data as never, overrideAccess: true });
    created += 1;
  }
}

const tasks = [
  ...pages.map((item) => () => upsertPage(item)),
  ...kboard.map((item) => () => {
    const boardId = string(item["wp:post_parent"]);
    return upsertNews(item, `legacy-board-${boardId}`, boardId);
  }),
  ...posts.map((item) => () => upsertNews(item, "blog")),
];
let nextTask = 0;
await Promise.all(Array.from({ length: 1 }, async () => {
  while (nextTask < tasks.length) {
    const task = tasks[nextTask++];
    await task();
    processed += 1;
    if (processed % 100 === 0 || processed === tasks.length) console.log(`Imported ${processed}/${tasks.length}`);
  }
}));

console.log(`Content import complete: ${created} created, ${updated} updated.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
