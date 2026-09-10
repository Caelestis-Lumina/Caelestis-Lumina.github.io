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
    resetReadingAssembly() { this.currentReadingSpread = 0; },
    clearReadingAssembly() { this.currentReadingSpread = 0; }, readingBounds: () => ({left: 0, top: 0, width: 100, height: 100})};
  const app = {root: node(), prefs: {reduced: true}, renderingScene: scene};
  const reader = {root: node(), isOpen: false, shows: 0, closes: 0, prepare() {}, openSurface() { this.isOpen = true; }, show() { this.isOpen = true; this.shows++; },
    close() { this.isOpen = false; }, beginHandoff() {}, endHandoff() {}, followSurface() {}, onClose() { this.closes++; }};
  return {app, reader, scene, release, flow: new ReadingFlow(app as unknown as KnowledgeApp, reader as unknown as ArticleReader)};
}
const article = {url: "/posts/a/", title: "A"} as Article;

test('surface handoff overlaps the moving page, with no text until arrival or after cancellation', async () => {
  for (const cancel of [false, true]) {
    const frames = new Map<number, FrameRequestCallback>();
    let id = 0;
    Object.assign(globalThis, {requestAnimationFrame: (callback: FrameRequestCallback) => {frames.set(++id, callback); return id;},
      cancelAnimationFrame: (key: number) => frames.delete(key)});
    const advance = (time: number) => {for (const [key, callback] of [...frames.entries()]) {frames.delete(key); callback(time);}};
    const {flow, reader, release, app, scene} = setup();
    app.prefs.reduced = false;
    release();
    const opening = flow.open(article);
    await Promise.resolve();
    advance(performance.now() + 1900);
    assert.equal(reader.isOpen, true);
    assert.ok(scene.currentReadingSpread < 1, 'reader must join before the 3D motion ends');
    assert.equal(reader.shows, 0, 'no article loading or decoding during the blank handoff');
    if (cancel) flow.reset();
    advance(performance.now() + 2300);
    await opening;
    assert.equal(reader.shows, cancel ? 0 : 1);
    assert.equal(reader.isOpen, !cancel);
  }
});

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

test('closing moves the 3D page while the reader is still fading, then finishes the shared return', async () => {
  const frames = new Map<number, FrameRequestCallback>();
  let id = 0;
  Object.assign(globalThis, {requestAnimationFrame: (callback: FrameRequestCallback) => {frames.set(++id, callback); return id;},
    cancelAnimationFrame: (key: number) => frames.delete(key)});
  const advance = (time: number) => {for (const [key, callback] of [...frames.entries()]) {frames.delete(key); callback(time);}};
  const {flow, reader, release, app, scene} = setup();
  release(); await flow.open(article);
  app.prefs.reduced = false;
  const start = performance.now();
  const closing = flow.close();
  advance(start + 200);
  assert.ok(scene.currentReadingSpread < 1 && scene.currentReadingSpread > .8);
  assert.equal(reader.isOpen, true);
  advance(start + 500);
  assert.equal(reader.isOpen, false);
  assert.equal(flow.busy, true);
  advance(start + 2000); await closing;
  assert.equal(flow.active, false);
  assert.equal(scene.currentReadingSpread, 0);
});

test('Escape midway through a shot reverses it without opening the reader late', async () => {
  const frames = new Map<number, FrameRequestCallback>();
  let id = 0;
  Object.assign(globalThis, {requestAnimationFrame: (callback: FrameRequestCallback) => {frames.set(++id, callback); return id;},
    cancelAnimationFrame: (key: number) => frames.delete(key)});
  const {flow, reader, scene, release, app} = setup();
  app.prefs.reduced = false;
  release();
  const opening = flow.open(article);
  await Promise.resolve();
  const first = [...frames.entries()][0];
  frames.delete(first[0]);
  first[1](performance.now() + 900);
  assert.ok(scene.currentReadingSpread > .4 && scene.currentReadingSpread < .7);
  assert.equal(reader.shows, 0);
  const closing = flow.close(true);
  await Promise.resolve();
  for (const [key, callback] of [...frames.entries()]) {frames.delete(key); callback(performance.now() + 2000);}
  await Promise.all([opening, closing]);
  assert.equal(reader.shows, 0);
  assert.equal(scene.currentReadingSpread, 0);
  assert.equal(app.root.inert, false);
});
