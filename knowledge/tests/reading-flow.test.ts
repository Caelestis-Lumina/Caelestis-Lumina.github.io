import {test} from "node:test";
import assert from "node:assert/strict";
import {ReadingFlow} from "../src/reading-flow.ts";
import type {KnowledgeApp} from "../src/app.ts";
import type {ArticleReader} from "../src/reader.ts";
import type {Article} from "../src/catalog.ts";

function setup() {
  const node = () => ({hidden: false, dataset: {}, inert: false, textContent: "", innerHTML: "", className: "",
    querySelector: () => ({hidden: false, addEventListener() {}, focus() {}}), addEventListener() {}});
  Object.assign(globalThis, {document: {createElement: node, body: {append() {}}, addEventListener() {}}});
  let release!: () => void;
  const preparation = new Promise<void>(resolve => release = resolve);
  const scene = {detailVisibility: 1, currentReadingSpread: 0, prepareReadingAssembly: () => preparation,
    setReadingSpread(value: number) { this.currentReadingSpread = value; },
    clearReadingAssembly() { this.currentReadingSpread = 0; }, readingBounds: () => ({left: 0, top: 0, width: 100, height: 100})};
  const app = {root: node(), prefs: {reduced: true}, renderingScene: scene};
  const reader = {root: node(), isOpen: false, shows: 0, closes: 0, prepare() {}, show() { this.isOpen = true; this.shows++; },
    close() { this.isOpen = false; }, morph: async () => true, onClose() { this.closes++; }};
  return {app, reader, scene, release, flow: new ReadingFlow(app as unknown as KnowledgeApp, reader as unknown as ArticleReader)};
}
const article = {url: "/posts/a/", title: "A"} as Article;

test("closing during model loading invalidates the pending open and prevents a late reader", async () => {
  const {flow, reader, scene, release, app} = setup();
  const opening = flow.open(article);
  assert.equal(flow.busy, true);
  await flow.close(true);
  release();
  await opening;
  assert.equal(reader.shows, 0);
  assert.equal(reader.closes, 1);
  assert.equal(scene.currentReadingSpread, 0);
  assert.equal(app.root.inert, false);
});
test("reading ends with spread parts and closing reassembles before restoring input", async () => {
  const {flow, reader, scene, release, app} = setup();
  release();
  await flow.open(article);
  assert.equal(reader.isOpen, true);
  assert.equal(scene.currentReadingSpread, 1);
  assert.equal(flow.busy, false);
  await flow.close(true);
  assert.equal(reader.isOpen, false);
  assert.equal(scene.currentReadingSpread, 0);
  assert.equal(app.root.inert, false);
  assert.equal(reader.closes, 1);
});
test("route reset cancels old model requests without writing a close history entry", async () => {
  const {flow, reader, release} = setup();
  const old = flow.open(article);
  flow.reset();
  release();
  await old;
  assert.equal(reader.shows, 0);
  assert.equal(reader.closes, 0);
  assert.equal(flow.active, false);
});
