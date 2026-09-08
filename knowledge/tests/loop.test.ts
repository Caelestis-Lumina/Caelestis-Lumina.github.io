import { test } from "node:test";
import assert from "node:assert/strict";
import { ArchiveCatalog } from "../src/navigation.ts";
import { connectCatalog } from "../src/rhine/data.ts";
import { fileAtCell, selectionCell, visibleCell, nearestOccurrence } from "../src/rhine/archive-loop.ts";

test("renderer maps repeated cells to actual variable-length lanes", () => {
  const articles = Array.from({length: 53}, (_, i) => ({id: String(i), title: String(i), url: `/posts/${i}/`,
    summary: "", content: "", tags: [], columns: [i < 1 ? "A" : i < 4 ? "B" : "C"], date: "2026-09-09", minutes: 1}));
  const catalog = new ArchiveCatalog(articles);
  connectCatalog(catalog);
  assert.equal(fileAtCell({lane: 0, row: -200}), 0);
  assert.equal(fileAtCell({lane: -1, row: 12}), 4);
  assert.equal(fileAtCell({lane: 2, row: 60}), 52);
  assert.equal(fileAtCell({lane: 2, row: 61}), 4);
  assert.deepEqual(selectionCell(4, {lane: 2, row: 60}, {axis: "row", direction: 1}), {lane: 2, row: 61});
  const cells = Array.from({length: 288}, (_, i) => visibleCell(i, {lane: 2099, row: 4097}));
  assert.equal(new Set(cells.map(c => `${c.lane}:${c.row}`)).size, 288);
  assert.ok(cells.every(c => catalog.articles[fileAtCell(c)]));
  assert.equal(nearestOccurrence(0, 7, 7), 7);
});
