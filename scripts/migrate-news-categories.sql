BEGIN;

ALTER TABLE "news" ADD COLUMN IF NOT EXISTS "legacy_category" text;
CREATE INDEX IF NOT EXISTS "news_legacy_category_idx" ON "news" ("legacy_category");

UPDATE "news"
SET "legacy_category" = "category"
WHERE "legacy_category" IS NULL OR "legacy_category" = '';

UPDATE "news" SET "category" = 'property-info' WHERE "legacy_category" IN ('legacy-board-1', 'legacy-board-2', 'legacy-board-3', 'legacy-board-4', 'legacy-board-5', 'legacy-board-13');
UPDATE "news" SET "category" = 'austin-news' WHERE "legacy_category" IN ('legacy-board-6', 'legacy-board-7', 'legacy-board-8');
UPDATE "news" SET "category" = 'resources/koreanbusiness' WHERE "legacy_category" IN ('legacy-board-9', 'legacy-board-14');
UPDATE "news" SET "category" = 'resources/tours' WHERE "legacy_category" = 'legacy-board-10';
UPDATE "news" SET "category" = 'resources/gallery' WHERE "legacy_category" = 'legacy-board-15';
UPDATE "news" SET "category" = 'resources/school' WHERE "legacy_category" = 'legacy-board-12';

COMMIT;

-- Verify the result:
-- SELECT "legacy_category", "category", COUNT(*)
-- FROM "news"
-- GROUP BY "legacy_category", "category"
-- ORDER BY "legacy_category", "category";
