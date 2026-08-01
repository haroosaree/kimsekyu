# Repository contract

Inspect the repository before relying on these defaults; this reference is not permission to alter schema.

- Payload collection: `news-feed`.
- Public categories: `property-info` and `austin-news`.
- Input alias: `austin-new` → `austin-news`.
- Store the Korean title in the single title field.
- Prefer the collection's rich-content field for translated HTML. Preserve raw/legacy fields; do not overwrite legacy content.
- Preserve `legacy_category`, `legacy_id`, and existing view/read counts when updating migrated records.
- Inspect the collection config for exact source metadata field names before writing.
- Use the existing media/R2 path only when copying images; retaining a valid original image URL is acceptable when project policy allows.
- Use Payload APIs/config rather than destructive SQL.

Before implementation, inspect `payload.config.*`, the `news-feed` collection definition, existing migration scripts, and scheduler configuration. If a field is absent or ambiguous, stop and ask rather than silently adding or removing fields.
