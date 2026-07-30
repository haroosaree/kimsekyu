BEGIN;

CREATE TABLE IF NOT EXISTS rich_content (
  id serial PRIMARY KEY,
  content jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE news_feed
  ADD COLUMN IF NOT EXISTS rich_content_id integer;

CREATE INDEX IF NOT EXISTS news_feed_rich_content_id_idx
  ON news_feed (rich_content_id);

COMMIT;
