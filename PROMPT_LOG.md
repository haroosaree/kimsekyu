# Kimsekyu renovation prompt log

## Summary through 2026-07-30

- Cloned `git@github.com:haroosaree/kimsekyu.git` into `/Users/ajmbp/Code/kimsekyu`.
- Set up a Next.js server-rendered site with Payload CMS, Neon/Postgres, Cloudflare R2, and environment-variable-based secrets. `.env` is ignored and was never pushed.
- Imported and migrated WordPress/KBoard content and media, preserving legacy IDs, legacy categories, URLs, dates, authors, view counts, and source HTML where available. Media URLs are rewritten to R2, with known unavailable legacy assets tracked separately.
- Built the public site navigation, responsive sticky/mobile menu, breadcrumbs, menu archives, pagination, search, contact page, SEO metadata, date formatting, view-count increments, and resource submenus.
- Added Payload-managed landing-page/site settings, navigation management, menu banners, contact content, and admin controls. Navigation now supports multiple banner images per menu, selected randomly per visit.
- Added a Payload Lexical rich-content editor with R2-backed media uploads. Public article pages render rich content first, then raw content, then legacy content as fallback.
- Fixed the major News Feed creation crash: the manually created `news_feed.id` column lacked an auto-increment sequence, `NOT NULL`, and a primary key. Existing IDs were verified unique/non-null; the sequence and constraints were added without deleting records.
- Fixed rich-content image rendering by querying article media relationships with `depth: 1`.
- Fixed Vercel frozen-install failure by removing an obsolete local Payload patch and regenerating the pnpm lockfile. The production build subsequently passed TypeScript and static generation.
- Fixed stale migration-script type errors after the collection was renamed to `news-feed`.
- Added the missing Payload navigation relationship tables `navigation_rels` and `navigation_items_rels` in Postgres. Payload Navigation now loads successfully.
- Latest local menu-banner changes are not yet pushed unless explicitly requested.

## Ongoing logging rule

Record only each future user prompt with its date. Do not record actions, results, outcomes, secrets, passwords, tokens, database URLs, or full `.env` contents.

---

## 2026-07-30

No saving on outcomes; save prompts only.

## 2026-07-31

Mostly done for the TODO, let's build a skill to build auto news post that runs periodically, now we have 2 major news category `property-info` and `austin-new`, the program will gather news, translate it into Korean while preserving HTML/images, include source information, and run every Monday at 8am Central time. It may take a URL argument or search sources such as KXAN and CNBC Real Estate.
