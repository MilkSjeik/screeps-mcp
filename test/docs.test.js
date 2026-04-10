import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { htmlToText, loadLocalIndex, snippets } from "../src/docs.js";

describe("docs helpers", () => {
  it("converts html to plain text", () => {
    const text = htmlToText("<div>Hello <strong>&amp; world</strong></div><p>Next line</p>");

    assert.equal(text, "Hello & world\nNext line");
  });

  it("loads a local docs index", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "screeps-mcp-"));
    const file = path.join(dir, "docs-index.json");
    await writeFile(file, JSON.stringify({ text: "alpha\n beta \n\n gamma " }), "utf8");

    const index = await loadLocalIndex(file);

    assert.ok(index);
    assert.equal(index.text, "alpha\n beta \n\n gamma ");
    assert.deepEqual(index.lines, ["alpha", "beta", "gamma"]);
  });

  it("returns contextual snippets for matches", () => {
    const results = snippets(["one", "two match", "three", "four match", "five"], "match", 2);

    assert.deepEqual(results, [
      "one\ntwo match\nthree\nfour match",
      "two match\nthree\nfour match\nfive",
    ]);
  });
});
