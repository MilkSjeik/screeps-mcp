import { readFile } from "node:fs/promises";

export function decodeEntities(text) {
  return text
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

export function htmlToText(html) {
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<(\/)?(p|div|section|article|header|footer|main|nav|aside|h[1-6]|li|ul|ol|pre|blockquote|tr|table|thead|tbody|tfoot)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\u00a0/g, " ");

  return decodeEntities(cleaned)
    .replace(/[ \t]+/g, " ")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

export async function loadLocalIndex(indexFile = "docs-index.json") {
  try {
    const raw = await readFile(indexFile, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed?.text) {
      const text = String(parsed.text);
      return { at: Date.now(), text, lines: text.split("\n").map((line) => line.trim()).filter(Boolean) };
    }
  } catch {
    return null;
  }

  return null;
}

export function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function snippets(lines, query, limit) {
  const pattern = new RegExp(escapeRegExp(query), "i");
  const results = [];

  for (let i = 0; i < lines.length && results.length < limit; i++) {
    if (!pattern.test(lines[i])) continue;
    const start = Math.max(0, i - 2);
    const end = Math.min(lines.length, i + 3);
    results.push(lines.slice(start, end).join("\n"));
  }

  return results;
}
