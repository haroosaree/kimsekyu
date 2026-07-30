// Legacy WordPress markup often puts visual break tags next to elements that already create a block break.
// Normalize only at rendering time so every existing record is displayed consistently.
export function displayLegacyHTML(html: unknown) {
  if (typeof html !== "string") {
    if (html && typeof html === "object") html = (html as Record<string, unknown>).ko ?? (html as Record<string, unknown>).en ?? Object.values(html as Record<string, unknown>).find((value) => typeof value === "string");
    if (typeof html !== "string") return "";
  }
  const displayedImages = new Set<string>();
  const base = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");

  return html
    .replace(/(<br\s*\/?>(?:\s|&nbsp;)*){2,}/gi, "<br>")
    .replace(/<br\s*\/?>\s*(?=<(?:div|p|h[1-6]|ul|ol|li|table|thead|tbody|tr|blockquote|pre|figure)\b)/gi, "")
    .replace(/(<\/(?:div|p|h[1-6]|ul|ol|li|table|thead|tbody|tr|blockquote|pre|figure)>)\s*<br\s*\/?>/gi, "$1")
    .replace(/<ul\b/gi, "<br><ul")
    .replace(/<\/ul>/gi, "</ul><br>")
    .replace(/(?:<br\s*\/?>\s*)*<ul\b/gi, "<br><ul")
    .replace(/<\/ul>(?:\s*<br\s*\/?>)*/gi, "</ul><br>")
    .replace(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi, (image, source: string) => {
      let key = source.replace(/[?#].*$/, "");
      try {
        key = decodeURIComponent(key);
      } catch {
        // Retain the original URL when a legacy value contains malformed escapes.
      }
      if (displayedImages.has(key)) return "";
      displayedImages.add(key);
      const marker = "/wp-content/uploads/";
      const markerIndex = source.indexOf(marker);
      if (base && markerIndex >= 0) {
        let objectPath = source.slice(markerIndex + marker.length).replace(/[?#].*$/, "");
        try { objectPath = decodeURIComponent(objectPath); } catch { /* keep original path */ }
        const replacement = `${base}/legacy/wordpress/uploads/${objectPath.split("/").map(encodeURIComponent).join("/")}`;
        return image.replace(source, replacement);
      }
      return image;
    });
}

export function legacyThumbnailURL(html: unknown) {
  if (typeof html !== "string") {
    if (html && typeof html === "object") html = (html as Record<string, unknown>).ko ?? (html as Record<string, unknown>).en ?? Object.values(html as Record<string, unknown>).find((value) => typeof value === "string");
    if (typeof html !== "string") return undefined;
  }
  const source = html.match(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
  if (!source) return undefined;
  const uploadsMarker = "/wp-content/uploads/";
  const uploadsIndex = source.indexOf(uploadsMarker);
  if (uploadsIndex >= 0) {
    const base = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");
    let objectPath = source.slice(uploadsIndex + uploadsMarker.length).replace(/[?#].*$/, "");
    try { objectPath = decodeURIComponent(objectPath); } catch { /* keep the original path */ }
    return base ? `${base}/legacy/wordpress/uploads/${objectPath.split("/").map(encodeURIComponent).join("/")}` : undefined;
  }
  return source;
}
