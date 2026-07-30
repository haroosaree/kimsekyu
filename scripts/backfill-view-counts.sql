UPDATE "news"
SET "view_count" = "legacy_view_count"
WHERE COALESCE("view_count", 0) < COALESCE("legacy_view_count", 0);
