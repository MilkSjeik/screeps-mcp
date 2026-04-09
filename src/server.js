import { readFile } from "node:fs/promises";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const DOCS_URL = process.env.SCREEPS_DOCS_URL || "https://arena.screeps.com/docs";
const REFRESH_MS = Number(process.env.SCREEPS_DOCS_REFRESH_MS || 10 * 60 * 1000);
const INDEX_FILE = process.env.SCREEPS_DOCS_INDEX || "docs-index.json";

const server = new Server(
  { name: "screeps-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

let cache = { at: 0, text: "", lines: [] };

async function loadLocalIndex() {
  try {
    const raw = await readFile(INDEX_FILE, "utf8");
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

function decodeEntities(text) {
  return text
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function htmlToText(html) {
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<(\/)?(p|div|section|article|header|footer|main|nav|aside|h[1-6]|li|ul|ol|pre|blockquote|tr|table|thead|tbody|tfoot)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\u00a0/g, " ");

  return decodeEntities(cleaned)
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+\n/g, "\n\n")
    .trim();
}

async function loadDocs() {
  const now = Date.now();
  if (cache.text && now - cache.at < REFRESH_MS) return cache;

  const local = await loadLocalIndex();
  if (local) {
    cache = local;
    return cache;
  }

  const response = await fetch(DOCS_URL, { headers: { accept: "text/html" } });
  if (!response.ok) {
    throw new Error(`Failed to fetch docs: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const text = htmlToText(html);
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);

  cache = { at: now, text, lines };
  return cache;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function snippets(lines, query, limit) {
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

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "search_docs",
      description: "Search the Screeps Arena docs and return matching snippets.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search term" },
          limit: { type: "number", description: "Max snippets to return", default: 5 },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
    {
      name: "get_docs",
      description: "Return the cached Screeps Arena docs text or a matching section.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Optional heading or term" },
        },
        additionalProperties: false,
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;
  const docs = await loadDocs();

  if (name === "search_docs") {
    const query = String(args.query || "").trim();
    if (!query) throw new Error("query is required");

    const limit = Math.max(1, Math.min(Number(args.limit || 5), 10));
    const results = snippets(docs.lines, query, limit);
    return {
      content: [
        {
          type: "text",
          text:
            results.length > 0
              ? [`Docs: ${DOCS_URL}`, ...results.map((snippet, index) => `--- Match ${index + 1} ---\n${snippet}`)].join("\n")
              : `Docs: ${DOCS_URL}\nNo matches for: ${query}`,
        },
      ],
    };
  }

  if (name === "get_docs") {
    const query = String(args.query || "").trim();
    if (!query) {
      return { content: [{ type: "text", text: `Docs: ${DOCS_URL}\n\n${docs.text}` }] };
    }

    const results = snippets(docs.lines, query, 1);
    return {
      content: [
        {
          type: "text",
          text: results.length > 0 ? `Docs: ${DOCS_URL}\n\n${results[0]}` : `Docs: ${DOCS_URL}\nNo match for: ${query}`,
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
