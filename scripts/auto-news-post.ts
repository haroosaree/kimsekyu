import { parse } from "node:url";

type Category = "property-info" | "austin-news";
type Candidate = { title: string; url: string; source: string; publishedAt: string; html: string; imageURL?: string };

const apiURL = (process.env.PAYLOAD_API_URL || "http://localhost:3000").replace(/\/$/, "");
const apiKey = process.env.PAYLOAD_API_KEY;
const openAIKey = process.env.OPENAI_API_KEY;
const dryRun = process.env.NEWS_DRY_RUN === "true";
const feeds: Record<Category, string[]> = {
  "austin-news": [process.env.AUSTIN_NEWS_FEED_URL || "https://www.kxan.com/feed/"],
  "property-info": [process.env.PROPERTY_INFO_FEED_URL || "https://www.cnbc.com/id/10000115/device/rss/rss.html"],
};

function authHeaders() { return { "Content-Type": "application/json", ...(apiKey ? { Authorization: `users API-Key ${apiKey}` } : {}) }; }
function decode(value: string) { return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">"); }
function strip(value: string) { return decode(value).replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); }
function tag(xml: string, name: string) { return decode(xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"))?.[1] || "").trim(); }
function canonical(url: string) { try { const u = new URL(url); ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach((key) => u.searchParams.delete(key)); u.hash = ""; return u.toString().replace(/\/$/, ""); } catch { return url; } }
function slug(value: string) { return value.normalize("NFKC").toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 180) || `news-${Date.now()}`; }
function safeHTML(value: string) { return value.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<iframe[\s\S]*?<\/iframe>/gi, "").replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, ""); }

async function fetchCandidate(category: Category): Promise<Candidate> {
  for (const feedURL of feeds[category]) {
    const response = await fetch(feedURL, { headers: { "User-Agent": "kimsekyu-news-bot/1.0" }, signal: AbortSignal.timeout(20000) });
    if (!response.ok) continue;
    const xml = await response.text();
    const items = [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].map((match) => match[1]);
    for (const item of items) {
      const url = canonical(tag(item, "link") || tag(item, "guid"));
      const title = strip(tag(item, "title"));
      if (!url || !title) continue;
      const publishedAt = new Date(tag(item, "pubDate") || Date.now()).toISOString();
      const description = safeHTML(tag(item, "content:encoded") || tag(item, "description"));
      const imageURL = description.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
      return { title, url, source: parse(url).hostname || "source", publishedAt, html: description, imageURL };
    }
  }
  throw new Error(`No candidate found for ${category}`);
}

async function existing(category: Category) {
  const query = new URLSearchParams({ "where[category][equals]": category, limit: "1000", depth: "0", overrideAccess: "true" });
  const response = await fetch(`${apiURL}/api/news-feed?${query}`, { headers: authHeaders(), signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`Payload lookup failed (${response.status}): ${await response.text()}`);
  const body = await response.json() as { docs?: Array<Record<string, unknown>> };
  return body.docs || [];
}

async function translate(candidate: Candidate, category: Category) {
  if (!openAIKey) throw new Error("OPENAI_API_KEY is required for translation");
  const prompt = `Translate this article into natural Korean. Preserve the HTML structure and image URLs. Do not add facts. Return JSON with title and html only. Category: ${category}. Source title: ${candidate.title}\n\n${candidate.html}`;
  const response = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${openAIKey}` }, body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-4o-mini", temperature: 0.2, response_format: { type: "json_object" }, messages: [{ role: "system", content: "You are a careful Korean news translator." }, { role: "user", content: prompt }] }), signal: AbortSignal.timeout(90000) });
  if (!response.ok) throw new Error(`OpenAI translation failed (${response.status}): ${await response.text()}`);
  const body = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const result = JSON.parse(body.choices?.[0]?.message?.content || "{}");
  const source = `<p class="article-source"><strong>출처:</strong> ${candidate.source} — <a href="${candidate.url}" rel="nofollow noopener" target="_blank">원문 보기</a></p>`;
  return { title: String(result.title || candidate.title), html: `${safeHTML(String(result.html || ""))}${source}` };
}

async function publish(category: Category) {
  const candidate = await fetchCandidate(category);
  const docs = await existing(category);
  const normalized = strip(candidate.title).toLocaleLowerCase();
  const duplicate = docs.find((doc) => canonical(String(doc.legacyUrl || "")) === candidate.url || String(doc.title || "").trim().toLocaleLowerCase() === normalized);
  if (duplicate) return { category, skipped: true, reason: "duplicate", id: duplicate.id };
  if (dryRun) return { category, skipped: false, dryRun: true, source: candidate.url, title: candidate.title };
  const translated = await translate(candidate, category);
  const data = { title: translated.title, slug: slug(translated.title), category, legacyUrl: candidate.url, rawContent: translated.html, publishedAt: candidate.publishedAt, legacyViewCount: 0, viewCount: 0, readCount: 0 };
  const response = await fetch(`${apiURL}/api/news-feed`, { method: "POST", headers: authHeaders(), body: JSON.stringify(data), signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Payload create failed (${response.status}): ${await response.text()}`);
  const created = await response.json() as { doc?: { id?: string | number; slug?: string } };
  return { category, skipped: false, id: created.doc?.id, slug: created.doc?.slug, source: candidate.url };
}

export async function runAutoNews() { return Promise.all((Object.keys(feeds) as Category[]).map(publish)); }

if (import.meta.url === `file://${process.argv[1]}`) {
  runAutoNews().then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => { console.error(error); process.exitCode = 1; });
}
