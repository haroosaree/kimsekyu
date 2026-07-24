// Legacy WordPress markup often puts visual break tags next to elements that already create a block break.
// Normalize only at rendering time so every existing record is displayed consistently.
export function displayLegacyHTML(html: string) {
  return html
    .replace(/(<br\s*\/?>(?:\s|&nbsp;)*){2,}/gi, "<br>")
    .replace(/<br\s*\/?>\s*(?=<(?:div|p|h[1-6]|ul|ol|li|table|thead|tbody|tr|blockquote|pre|figure)\b)/gi, "")
    .replace(/(<\/(?:div|p|h[1-6]|ul|ol|li|table|thead|tbody|tr|blockquote|pre|figure)>)\s*<br\s*\/?>/gi, "$1");
}

export function legacyThumbnailURL(html: string) {
  const source = html.match(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
  if (!source) return undefined;
  if (source.startsWith("/wp-content/uploads/")) {
    const base = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");
    return base ? `${base}/legacy/wordpress/uploads/${source.slice("/wp-content/uploads/".length)}` : undefined;
  }
  return source;
}
