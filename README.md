# screeps-mcp

Lean MCP server for Screeps Arena docs.

## Tools
- `search_docs(query, limit?)` - return matching snippets from the docs.
- `get_docs(query?)` - return the full cached docs text or a single matching snippet.

## Run
```bash
bun install
bun run start
```

## Index
```bash
bun run index
```

This writes `docs-index.json`, which the server will prefer over live fetches.

## Config
- `SCREEPS_DOCS_URL` defaults to `https://arena.screeps.com/docs`.
- `SCREEPS_DOCS_REFRESH_MS` controls the in-memory cache TTL.

## Notes
- This server fetches the docs live and keeps a small cache in memory.
- It is intentionally generic enough to reuse for other docs URLs.

## Client setup
OpenCode can point at this server with stdio transport. Use `bun` directly, not `bun x`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "screeps": {
      "type": "local",
      "command": ["bun", "../screeps-mcp/src/server.js"],
      "environment": {
        "SCREEPS_DOCS_INDEX": "../screeps-mcp/docs-index.json"
      }
    }
  }
}
```

If you run OpenCode from a different directory, adjust the relative paths accordingly.
