import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const LEGACY_UPLOAD_PREFIX = "/wp-content/uploads/";
const R2_PREFIX = "legacy/wordpress/uploads/";
const STATE_PATH = ".migration/wordpress-media.json";
const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : undefined;
const concurrencyArg = process.argv.find((arg) => arg.startsWith("--concurrency="));
const concurrency = Math.max(1, Number(concurrencyArg?.split("=")[1]) || 6);

const required = [
  "R2_BUCKET",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_ENDPOINT",
  "R2_PUBLIC_BASE_URL",
  "WORDPRESS_EXPORT_PATH",
];

const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
  throw new Error(`Missing required environment variable(s): ${missing.join(", ")}`);
}

const xml = await readFile(process.env.WORDPRESS_EXPORT_PATH, "utf8");
const attachmentUrls = [...xml.matchAll(/<wp:attachment_url><!\[CDATA\[(.*?)\]\]><\/wp:attachment_url>/g)]
  .map((match) => match[1])
  .filter((url) => url.startsWith("http://kimsekyu.com"));

const uniqueUrls = [...new Set(attachmentUrls)];
const selectedUrls = Number.isFinite(limit) ? uniqueUrls.slice(0, limit) : uniqueUrls;

function objectKeyFor(url) {
  const pathname = new URL(url).pathname;
  const uploadPath = pathname.slice(pathname.indexOf(LEGACY_UPLOAD_PREFIX) + LEGACY_UPLOAD_PREFIX.length);
  return `${R2_PREFIX}${uploadPath}`;
}

async function readState() {
  try {
    return JSON.parse(await readFile(STATE_PATH, "utf8"));
  } catch {
    return { completed: {}, failed: {} };
  }
}

const state = await readState();
await mkdir(path.dirname(STATE_PATH), { recursive: true });

const client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const manifest = selectedUrls.map((sourceUrl) => {
  const key = objectKeyFor(sourceUrl);
  return {
    sourceUrl,
    key,
    publicUrl: `${process.env.R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}`,
  };
});

if (dryRun) {
  console.log(`Dry run: ${manifest.length} unique legacy attachment(s) found.`);
  console.table(manifest.slice(0, 10));
  process.exit(0);
}

let uploaded = 0;
const skipped = manifest.filter((item) => Boolean(state.completed[item.sourceUrl])).length;
let nextIndex = 0;
let persist = Promise.resolve();

function persistState() {
  persist = persist.then(() => writeFile(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`));
  return persist;
}

async function migrate(item) {
  try {
    const response = await fetch(item.sourceUrl);
    if (!response.ok) {
      throw new Error(`Download failed with HTTP ${response.status}`);
    }

    const body = Buffer.from(await response.arrayBuffer());
    const checksum = createHash("sha256").update(body).digest("hex");
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: item.key,
        Body: body,
        ContentType: response.headers.get("content-type") || "application/octet-stream",
        Metadata: {
          "sha256": checksum,
        },
      }),
    );

    state.completed[item.sourceUrl] = { ...item, checksum, uploadedAt: new Date().toISOString() };
    delete state.failed[item.sourceUrl];
    uploaded += 1;
    process.stdout.write(`Uploaded ${uploaded + skipped}/${manifest.length}: ${item.key}\n`);
  } catch (error) {
    state.failed[item.sourceUrl] = { ...item, error: error instanceof Error ? error.message : String(error) };
    process.stderr.write(`Failed: ${item.sourceUrl} — ${state.failed[item.sourceUrl].error}\n`);
  }
}

const pending = manifest.filter((item) => !state.completed[item.sourceUrl]);
await Promise.all(Array.from({ length: Math.min(concurrency, pending.length) }, async () => {
  while (nextIndex < pending.length) {
    const item = pending[nextIndex++];
    await migrate(item);
    await persistState();
  }
}));

await persist;

await writeFile(".migration/wordpress-media-manifest.json", `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Migration complete: ${uploaded} uploaded, ${skipped} resumed, ${Object.keys(state.failed).length} failed. Concurrency: ${concurrency}.`);
