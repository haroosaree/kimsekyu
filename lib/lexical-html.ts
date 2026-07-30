type LexicalNode = Record<string, unknown>;

function escapeHTML(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderText(node: LexicalNode) {
  let value = escapeHTML(node.text);
  const format = Number(node.format || 0);
  if (format & 16) value = `<code>${value}</code>`;
  if (format & 1) value = `<strong>${value}</strong>`;
  if (format & 2) value = `<em>${value}</em>`;
  if (format & 4) value = `<s>${value}</s>`;
  if (format & 8) value = `<u>${value}</u>`;
  return value;
}

function renderNode(node: LexicalNode): string {
  if (!node) return "";
  if (node.type === "text") return renderText(node);
  if (node.type === "linebreak") return "<br>";
  const children = Array.isArray(node.children) ? node.children.map((child) => renderNode(child as LexicalNode)).join("") : "";
  if (node.type === "link" || node.type === "autolink") {
    const fields = node.fields && typeof node.fields === "object" ? node.fields as Record<string, unknown> : {};
    const url = fields.url || node.url || "#";
    const target = fields.newTab ? ` target="_blank" rel="noopener noreferrer"` : "";
    return `<a href="${escapeHTML(url)}"${target}>${children}</a>`;
  }
  if (node.type === "upload") {
    const value = node.value && typeof node.value === "object" ? node.value as Record<string, unknown> : {};
    const url = value.url || value.thumbnailURL;
    if (!url) return "";
    return `<figure><img src="${escapeHTML(url)}" alt="${escapeHTML(value.alt || "")}" loading="lazy" /></figure>`;
  }
  if (node.type === "heading") {
    const tag = typeof node.tag === "string" && /^h[1-6]$/.test(node.tag) ? node.tag : "h2";
    return `<${tag}>${children}</${tag}>`;
  }
  if (node.type === "list" || node.type === "listitem") {
    const tag = node.type === "list" && node.listType === "number" ? "ol" : node.type === "list" ? "ul" : "li";
    return `<${tag}>${children}</${tag}>`;
  }
  if (node.type === "quote") return `<blockquote>${children}</blockquote>`;
  if (node.type === "horizontalrule") return "<hr />";
  if (node.type === "paragraph") return `<p>${children}</p>`;
  return children;
}

export function lexicalToHTML(value: unknown) {
  const root = value && typeof value === "object" && "root" in value ? (value as Record<string, unknown>).root : value;
  if (!root || typeof root !== "object") return "";
  return renderNode(root as LexicalNode);
}
