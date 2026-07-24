// Legacy WordPress markup often puts visual break tags next to elements that already create a block break.
// Normalize only at rendering time so every existing record is displayed consistently.
export function displayLegacyHTML(html: string) {
  return html
    .replace(/(<br\s*\/?>(?:\s|&nbsp;)*){2,}/gi, "<br>")
    .replace(/<br\s*\/?>\s*(?=<(?:div|p|h[1-6]|ul|ol|li|table|thead|tbody|tr|blockquote|pre|figure)\b)/gi, "")
    .replace(/(<\/(?:div|p|h[1-6]|ul|ol|li|table|thead|tbody|tr|blockquote|pre|figure)>)\s*<br\s*\/?>/gi, "$1");
}
