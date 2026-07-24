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

async function upsertPage(item: LegacyItem) {
  const legacyUrl = string(item.link);
  const existing = await payload.find({
    collection: "pages",
    where: { legacyUrl: { equals: legacyUrl } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const data = {
    title: string(item.title),
    slug: safeSlug(string(item["wp:post_name"]), `legacy-page-${string(item["wp:post_id"])}`),
    legacyUrl,
    contentHTML: rewriteAssetUrls(string(item["content:encoded"])),
    publishedAt: dateISO(string(item["wp:post_date_gmt"]) || string(item["wp:post_date"])),
  };
  if (existing.docs[0]) {
    await payload.update({ collection: "pages", id: existing.docs[0].id, data, overrideAccess: true });
    updated += 1;
  } else {
    await payload.create({ collection: "pages", data, overrideAccess: true });
    created += 1;
  }
}

async function upsertNews(item: LegacyItem, category: string, legacyBoardId?: string) {
  const legacyId = string(item["wp:post_id"]);
  const existing = await payload.find({
    collection: "news",
    where: { legacyId: { equals: legacyId } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const data = {
    title: string(item.title),
    slug: safeSlug(string(item["wp:post_name"]), `legacy-news-${legacyId}`),
    category,
    legacyId,
    legacyBoardId,
    legacyUrl: string(item.link),
    contentHTML: rewriteAssetUrls(string(item["content:encoded"])),
    publishedAt: dateISO(string(item["wp:post_date_gmt"]) || string(item["wp:post_date"])),
    legacyAuthor: string(item["dc:creator"]),
  };
  if (existing.docs[0]) {
    await payload.update({ collection: "news", id: existing.docs[0].id, data, overrideAccess: true });
    updated += 1;
  } else {
    await payload.create({ collection: "news", data, overrideAccess: true });
    created += 1;
  }
}

for (const item of pages) await upsertPage(item);
for (const item of kboard) {
  const boardId = string(item["wp:post_parent"]);
  await upsertNews(item, `legacy-board-${boardId}`, boardId);
}
for (const item of posts) await upsertNews(item, "blog");

console.log(`Content import complete: ${created} created, ${updated} updated.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
