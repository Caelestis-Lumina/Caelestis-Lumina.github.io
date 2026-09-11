import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve, join, sep } from "node:path";
import { parseCatalog } from "../src/catalog.ts";

// Checks the actual Hugo artifact, including project-site base paths.
const output = resolve(process.argv[2] || "public");
const html = readFileSync(join(output, "index.html"), "utf8");
const base = html.match(/name=["']?knowledge-base["']?\s+content=["']?([^\s"'>]+)/)?.[1];
assert.ok(base?.startsWith("/"), "Homepage must declare the site base path");
function localFile(url) {
  const path = new URL(url, "https://site.test").pathname;
  assert.ok(path.startsWith(base), `URL escapes site base: ${url}`);
  const target = resolve(output, decodeURIComponent(path.slice(base.length)));
  assert.ok(target === output || target.startsWith(output + sep), `URL escapes output: ${url}`);
  return path.endsWith("/") ? join(target, "index.html") : target;
}

const catalog = parseCatalog(JSON.parse(readFileSync(join(output, "knowledge-index.json"), "utf8")));
for (const article of catalog.articles) {
  const page = readFileSync(localFile(article.url), "utf8");
  assert.match(page, /class=["']?post-single/, `Missing article: ${article.id}`);
  assert.ok(page.includes("cl-knowledge-reader-ready"), `Missing reader handshake: ${article.id}`);
  assert.ok(page.includes("knowledge-reader"), `Missing reading layout: ${article.id}`);
}
const manifest = JSON.parse(readFileSync("data/knowledge.json", "utf8"));
for (const entry of Object.values(manifest)) {
  for (const file of [entry.file, ...(entry.css || []), ...(entry.assets || [])])
    assert.ok(existsSync(join(output, "knowledge", file)), `Missing bundled asset: ${file}`);
  if (entry.isEntry) assert.ok(html.includes(entry.file), "Homepage references a stale entry bundle");
}
for (const name of ["archive-cassette", "archive-assembly"]) {
  const model = readFileSync(join(output, "rhine/assets", `${name}.glb`));
  assert.equal(model.subarray(0, 4).toString(), "glTF", "Model is not a binary glTF asset");
  assert.equal(model.readUInt32LE(8), model.length, "Model asset is truncated");
}
for (const path of ["classic/", "posts/", "columns/", "tags/", "search/", "about/", "index.xml", "sitemap.xml"])
  assert.ok(existsSync(localFile(base + path)), `Existing blog route is missing: ${path}`);
assert.ok(html.includes("application/ld+json"), "Homepage schema metadata is missing");
const classic = readFileSync(localFile(base + "classic/"), "utf8");
assert.ok(classic.includes("home-portal") && classic.includes("home-page"), "Classic homepage layout is missing");
assert.ok(classic.includes("data-view-mode") && classic.includes("js/view-mode.min."), "Classic mode switch is missing");
assert.ok(!classic.includes("three-renderer"), "Classic pages must not load the WebGL renderer");
const preloadPath = classic.match(/name=["']?knowledge-preload["']?\s+content=["']?([^\s"'>]+)/)?.[1];
assert.ok(preloadPath, "Classic pages need an idle preload manifest");
const preload = JSON.parse(readFileSync(localFile(preloadPath), "utf8"));
for (const url of preload) assert.ok(existsSync(localFile(url)), `Preload asset is missing: ${url}`);
for (const entry of Object.values(manifest))
  assert.ok(preload.some(url => url.endsWith('/knowledge/' + entry.file)), "Preload manifest references a stale build");
assert.ok(html.includes('entry-classic') && html.includes('data-view-redirect'), "Loading screen must allow classic navigation and skip redirected entry scripts");
for (const page of catalog.pages || []) assert.ok(existsSync(localFile(page.url)), `Site navigation target is missing: ${page.url}`);
console.log(`Verified ${catalog.articles.length} article routes, both GLB models, bundled assets and existing blog routes at ${base}`);
