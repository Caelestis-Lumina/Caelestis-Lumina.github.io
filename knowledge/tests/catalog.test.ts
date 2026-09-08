import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCatalog, searchArticles, type Article } from "../src/catalog.ts";
import { ArchiveCatalog } from "../src/navigation.ts";

const article = (id: string, column: string): Article => ({
  id, url: `/posts/${id}/`, title: id, columns: [column.split("/")[0], column],
  tags: ["控制"], content: "inverse dynamics 推导", summary: "", date: "2026-09-09", minutes: 3,
});
const articles = [article("a", "A/one"), article("b", "A/two"), article("c", "B/only"),
  ...Array.from({length: 45}, (_, i) => article(`c${i}`, "C/many"))];

test("uneven columns loop in both directions and remember selection", () => {
  const catalog = new ArchiveCatalog(articles);
  assert.equal(catalog.stepRow(-1), 1);
  assert.equal(catalog.stepLane(1), 2);
  assert.equal(catalog.stepRow(1), 2);
  assert.equal(catalog.stepLane(-1), 1);
  catalog.stepLane(-1);
  assert.equal(catalog.stepRow(-1), 47);
  assert.equal(catalog.stepRow(1), 3);
});
test("filtering never leaves an empty lane; search selection clears incompatible filter", () => {
  const catalog = new ArchiveCatalog(articles);
  assert.equal(catalog.filter(0, "A/two"), true);
  assert.equal(catalog.selected, 1);
  assert.equal(catalog.filter(0, "missing"), false);
  assert.deepEqual(catalog.files(0), [1]);
  catalog.select(0);
  assert.equal(catalog.filterPath(0), "");
});
test("full-text search combines words and nested column filters", () => {
  assert.deepEqual(searchArticles(articles, "inverse 控制", "A/one").map(a => a.id), ["a"]);
  assert.equal(searchArticles(articles, "not here").length, 0);
});
test("catalog rejects duplicate IDs, unsafe links, empty or malformed data", () => {
  assert.equal(parseCatalog({version: 1, articles}).articles.length, 48);
  for (const entries of [[], [articles[0], articles[0]], [{...articles[0], url: "//example.com"}],
    [{...articles[0], columns: [42]}]])
    assert.throws(() => parseCatalog({version: 1, articles: entries}));
});
