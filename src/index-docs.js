import { writeFile } from "node:fs/promises";
import { htmlToText } from "./docs.js";

const DOCS_URL = process.env.SCREEPS_DOCS_URL || "https://arena.screeps.com/docs";
const OUT_FILE = process.env.SCREEPS_DOCS_INDEX || "docs-index.json";

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
