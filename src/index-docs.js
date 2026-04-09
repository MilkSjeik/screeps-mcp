import { writeFile } from "node:fs/promises";

const DOCS_URL = process.env.SCREEPS_DOCS_URL || "https://arena.screeps.com/docs";
const OUT_FILE = process.env.SCREEPS_DOCS_INDEX || "docs-index.json";

function decodeEntities(text) {
  return text
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function htmlToText(html) {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<(\/)?(p|div|section|article|header|footer|main|nav|aside|h[1-6]|li|ul|ol|pre|blockquote|tr|table|thead|tbody|tfoot)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\u00a0/g, " "),
  )
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+\n/g, "\n\n")
    .trim();
}

const response = await fetch(DOCS_URL, { headers: { accept: "text/html" } });
if (!response.ok) {
  throw new Error(`Failed to fetch docs: ${response.status} ${response.statusText}`);
}

const text = htmlToText(await response.text());
const index = {
  source: DOCS_URL,
  generatedAt: new Date().toISOString(),
  text,
};

await writeFile(OUT_FILE, `${JSON.stringify(index, null, 2)}\n`);
console.log(`Wrote ${OUT_FILE}`);
