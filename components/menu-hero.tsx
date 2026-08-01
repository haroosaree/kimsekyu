import { randomInt } from "node:crypto";
import { getPayload } from "payload";
import config from "@payload-config";

const fallbackImage = "https://pub-8ca6b7121e244bc5a6e95146a35297bf.r2.dev/legacy/wordpress/uploads/2017/02/DSC03599.jpg";

export default async function MenuHero({ menuHref }: { menuHref?: string }) {
  let imageURL = fallbackImage;
  try {
    const payload = await getPayload({ config });
    const navigation = await payload.findGlobal({ slug: "navigation", depth: 1, overrideAccess: true });
    const item = menuHref && Array.isArray(navigation.items)
      ? navigation.items.find((entry: { href?: string }) => entry.href === menuHref) as { bannerImages?: Array<{ url?: string }> } | undefined
      : undefined;
    const bannerImages = item?.bannerImages?.filter((entry) => entry?.url) || [];
    const image = bannerImages.length
      ? bannerImages[randomInt(bannerImages.length)]
      : navigation.bannerImage as { url?: string } | null;
    if (image?.url) imageURL = image.url;
  } catch {
    // Retain the migrated legacy banner when the CMS is temporarily unavailable.
  }
  return <section className="menu-hero" style={{ backgroundImage: `url("${imageURL}")` }} aria-label="메뉴 배너" />;
}
