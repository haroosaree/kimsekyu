---
name: auto-news-post
description: Gather, select, translate, and publish recurring Austin and real-estate news posts into the Kimsekyu Payload CMS. Use when creating or operating the weekly automation, processing an optional source URL, selecting sources for property-info or austin-news (also accept the user's austin-new spelling), preserving HTML and image URLs, or configuring the Monday 8:00 AM America/Chicago schedule.
---

# Auto News Post

Create exactly one publishable post for each category per run: `property-info` and `austin-news`. Treat `austin-new` as an input alias for `austin-news`; never create a third category.

## Workflow

1. Accept an optional URL and category. If no URL is supplied, search current web results.
2. Before selecting, load existing `news-feed` records for the target category and build an exclusion set from canonical source URLs, normalized titles, and source article identifiers. Never select an article already represented in that set, even if its URL has tracking parameters or a minor title variation.
3. Select a recent reputable article not in the exclusion set. Prioritize Austin-local reporting and Austin real-estate/housing for `austin-news`; prioritize real-estate, housing, mortgage, market, and homeowner reporting for `property-info`.
3. Start with KXAN (`https://www.kxan.com/`) for Austin news and CNBC Real Estate (`https://www.cnbc.com/real-estate/`) for property information, but use a more relevant reputable source when appropriate.
4. Extract title, body, date, author/source, canonical URL, and article image URLs. Preserve semantic HTML structure and valid original image URLs; omit tracking pixels and site chrome.
5. Translate into natural Korean without inventing facts. Retain the HTML structure and append a visible Korean source block with the source name and clickable canonical URL.
6. Create a published Payload `news-feed` record using the repository's rich-content field, normalized category, Korean title, source metadata, canonical URL, publication date, and deterministic slug.
8. Re-check for duplicates immediately before publishing using canonical URL, normalized title, source identifier, and a normalized-content fingerprint. If any match exists, skip it and choose the next candidate; never overwrite or delete without explicit authorization.
9. Validate balanced HTML, safe markup (no script/iframe/event handlers), preserved image URLs, and a visible source link before publishing.

## Scheduling

Run every Monday at 8:00 AM in `America/Chicago`, including daylight-saving transitions. Prefer the deployment platform's timezone-aware scheduler; otherwise calculate the UTC equivalent. Make the job idempotent because scheduled retries can occur.

## Safety and repository rules

Read [references/repository-contract.md](references/repository-contract.md) before writing implementation code. Keep credentials in environment variables and never put secrets, database URLs, or full `.env` contents in logs, prompts, commits, or posts. Ask before changing schema, migrating records, pushing code, or changing the schedule. Preserve legacy fields and counts.

## Output

For each category, report only the selected source, resulting slug, Payload record id if created, and duplicate status. Do not claim publication until the CMS write and validation succeed.
