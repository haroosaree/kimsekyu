import { getPayload } from "payload";
import config from "@payload-config";

const boardURLs = [
  "http://kimsekyu.com/index.php/property_info/property_general/",
  "http://kimsekyu.com/index.php/property_info/buy/",
  "http://kimsekyu.com/index.php/property_info/sell/",
  "http://kimsekyu.com/index.php/property_info/mortgage/",
  "http://kimsekyu.com/index.php/austinre/austin_general/",
  "http://kimsekyu.com/index.php/austinre/austin_settle/",
  "http://kimsekyu.com/index.php/austinre/facts/",
  "http://kimsekyu.com/index.php/austinnews/austinnews_general/",
  "http://kimsekyu.com/index.php/austinnews/koreanbusiness/",
  "http://kimsekyu.com/index.php/austinnews/tours/",
  "http://kimsekyu.com/index.php/austinnews/gallery/",
  "http://kimsekyu.com/index.php/school/parent/",
  "http://kimsekyu.com/index.php/q/q_general/",
  "http://kimsekyu.com/index.php/q/anouncement/",
];

const dryRun = process.argv.includes("--dry-run");
const listURL = (base: string, page: number) => `${base}?pageid=${page}&mod=list`;
const pageCount = (html: string) => Number(html.match(/class="last-page"><a href="\?pageid=(\d+)&mod=list"/)?.[1] || 1);

function rowsFrom(html: string) {
  const rows: Array<{ uid: string; views: number }> = [];
  for (const row of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const uid = row[1].match(/[?&]uid=(\d+)/)?.[1];
    const views = row[1].match(/class="kboard-list-view">\s*(\d+)\s*</)?.[1];
    if (uid && views) rows.push({ uid, views: Number(views) });
  }
  return rows;
}

async function fetchText(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.text();
}

const payload = await getPayload({ config });
const legacyNews = await payload.find({ collection: "news", limit: 5000, depth: 0, overrideAccess: true });
const newsByKboardUID = new Map(
  legacyNews.docs
    .filter((item) => item.legacyUrl?.includes("kboard_content_redirect="))
    .map((item) => [item.legacyUrl!.match(/kboard_content_redirect=(\d+)/)?.[1], item])
    .filter(([uid]) => Boolean(uid)) as Array<[string, (typeof legacyNews.docs)[number]]>,
);

const boardFirstPages = await Promise.all(boardURLs.map(async (base) => ({ base, html: await fetchText(listURL(base, 1)) })));
const jobs = boardFirstPages.flatMap(({ base, html }) => Array.from({ length: pageCount(html) }, (_, index) => ({ base, page: index + 1, html: index === 0 ? html : undefined })));
const counts = new Map<string, number>();
let next = 0;

await Promise.all(Array.from({ length: 5 }, async () => {
  while (next < jobs.length) {
    const job = jobs[next++];
    const html = job.html ?? await fetchText(listURL(job.base, job.page));
    for (const { uid, views } of rowsFrom(html)) counts.set(uid, views);
  }
}));

const updates = [...counts].flatMap(([uid, legacyViewCount]) => {
  const item = newsByKboardUID.get(uid);
  const viewCount = Math.max(item?.viewCount ?? 0, legacyViewCount + (item?.readCount ?? 0));
  return item && (item.legacyViewCount !== legacyViewCount || item.viewCount !== viewCount) ? [{ id: item.id, legacyViewCount, viewCount }] : [];
});

console.log(`Collected ${counts.size} KBoard counts across ${jobs.length} list pages; ${updates.length} News records need updates.`);
if (!dryRun) {
  let updateIndex = 0;
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (updateIndex < updates.length) {
      const update = updates[updateIndex++];
      await payload.update({ collection: "news", id: update.id, data: { legacyViewCount: update.legacyViewCount, viewCount: update.viewCount }, overrideAccess: true });
      if (updateIndex % 100 === 0 || updateIndex === updates.length) console.log(`Updated ${updateIndex}/${updates.length}`);
    }
  }));
}

console.log("KBoard view-count backfill complete.");
