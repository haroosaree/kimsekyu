import { getPayload } from "payload";
import config from "../payload.config";

const payload = await getPayload({ config });
const alt = "Legacy shared menu banner";
const existing = await payload.find({ collection: "media", where: { alt: { equals: alt } }, limit: 1, depth: 0, overrideAccess: true });
let banner = existing.docs[0];

if (!banner) {
  const source = "https://pub-8ca6b7121e244bc5a6e95146a35297bf.r2.dev/legacy/wordpress/uploads/2017/02/DSC03599.jpg";
  const response = await fetch(source);
  if (!response.ok) throw new Error(`Legacy banner download failed: ${response.status}`);
  const data = Buffer.from(await response.arrayBuffer());
  banner = await payload.create({ collection: "media", data: { alt }, file: { data, mimetype: response.headers.get("content-type") || "image/jpeg", name: "legacy-menu-banner.jpg", size: data.length }, overrideAccess: true });
}

await payload.updateGlobal({ slug: "site-settings", data: { menuHeroImage: banner.id }, overrideAccess: true });
console.log(`Menu hero seeded; media ID: ${banner.id}`);
process.exit(0);
