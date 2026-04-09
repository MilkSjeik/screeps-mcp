# screeps-mcp

Lean MCP server for Screeps Arena docs.

## Tools
- `search_docs(query, limit?)` - return matching snippets from the docs.
- `get_docs(query?)` - return the full cached docs text or a single matching snippet.

## Run
```bash
npm install
npm start
```

## Index
```bash
npm run index
```

This writes `docs-index.json`, which the server will prefer over live fetches.

## Config
- `SCREEPS_DOCS_URL` defaults to `https://arena.screeps.com/docs`.
- `SCREEPS_DOCS_REFRESH_MS` controls the in-memory cache TTL.

## Notes
- This server fetches the docs live and keeps a small cache in memory.
- It is intentionally generic enough to reuse for other docs URLs.

## Client setup
OpenCode or Claude can point at this server with stdio transport. Example config:

```json
{
  "mcpServers": {
    "screeps": {
      "command": "node",
      "args": ["/absolute/path/to/screeps-mcp/src/server.js"],
      "env": {
        "SCREEPS_DOCS_INDEX": "/absolute/path/to/screeps-mcp/docs-index.json"
      }
    }
  }
}
```

If your client supports a dedicated config file, reuse the same fields.
