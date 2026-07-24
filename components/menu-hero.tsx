import { getPayload } from "payload";
import config from "@payload-config";

const fallbackImage = "https://pub-8ca6b7121e244bc5a6e95146a35297bf.r2.dev/legacy/wordpress/uploads/2017/02/DSC03599.jpg";

export default async function MenuHero() {
  let imageURL = fallbackImage;
  try {
    const payload = await getPayload({ config });
    const settings = await payload.findGlobal({ slug: "site-settings", depth: 1, overrideAccess: true });
    const image = settings.menuHeroImage as { url?: string } | null;
    if (image?.url) imageURL = image.url;
  } catch {
    // Retain the migrated legacy banner when the CMS is temporarily unavailable.
  }
  return <section className="menu-hero" style={{ backgroundImage: `url("${imageURL}")` }} aria-label="메뉴 배너" />;
}
