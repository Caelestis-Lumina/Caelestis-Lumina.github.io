import {test} from "node:test";
import assert from "node:assert/strict";
import {resolveDestination} from "../src/site-navigation.ts";
import {parseRoute, routeHash} from "../src/routes.ts";
import type {Article, SitePage} from "../src/catalog.ts";

test("Hugo permalinks resolve articles, nested columns and Unicode tags within a project site", () => {
  const base = new URL("https://example.test/blog/");
  const article: Article = {id: "/blog/posts/a/", url: "/blog/posts/a/", title: "A", columns: ["Robotics", "Robotics/Dynamics"], tags: ["机器人"], summary: "", content: "", date: "", minutes: 1};
  const pages: SitePage[] = [
    {url: "/blog/columns/robotics/dynamics/", title: "Dynamics", term: "Robotics/Dynamics", kind: "columns"},
    {url: "/blog/tags/%E6%9C%BA%E5%99%A8%E4%BA%BA/", title: "机器人", term: "机器人", kind: "tags"},
    {url: "/blog/about/", title: "关于", term: "", kind: "page"},
  ];
  const resolve = (url: string) => resolveDestination(new URL(url, base), base, [article], pages);
  assert.deepEqual(resolve("posts/a/#equation"), {kind: "article", article, anchor: "#equation"});
  assert.deepEqual(resolve("columns/robotics/dynamics/"), {kind: "index", column: "Robotics/Dynamics"});
  assert.deepEqual(resolve("tags/机器人/"), {kind: "index", tag: "机器人"});
  assert.deepEqual(resolve("search/?q=dds"), {kind: "index", query: "dds"});
  assert.equal(resolve("about/")?.kind, "page");
  assert.equal(resolve("classic/")?.kind, "home");
  assert.equal(resolve("https://external.test/blog/posts/a/"), null);
  assert.equal(resolve("/posts/a/"), null);
});

test("site-page history preserves nested fragments and rejects protocol-relative destinations", () => {
  const route = {article: "/posts/a/", view: "archive" as const, page: "/about/#致谢"};
  assert.deepEqual(parseRoute(routeHash(route)), route);
  assert.equal(parseRoute("#page=//external.test&view=page"), null);
});
