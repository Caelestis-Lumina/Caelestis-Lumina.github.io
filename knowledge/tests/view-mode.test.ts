import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const script = readFileSync(new URL("../../assets/js/view-mode.js", import.meta.url), "utf8");
function surface(mode: string, path: string, preference?: string, embedded = false, mobile = false) {
  const url = new URL(path, "http://127.0.0.1:1313/blog/");
  const navigations: string[] = [];
  const values = new Map<string, string>(preference ? [["cl-knowledge:view", preference]] : []);
  const handlers: Record<string, Function> = {};
  const storage = {getItem: (key: string) => values.get(key), setItem: (key: string, value: string) => values.set(key, value)};
  const window: {parent?: unknown} = {};
  window.parent = embedded ? {} : window;
  const attributes = new Map<string, string>();
  const context = {URL, URLSearchParams, window, matchMedia: () => ({matches: mobile}), localStorage: storage, sessionStorage: storage,
    location: {href: url.href, pathname: url.pathname, search: url.search, hash: url.hash,
      assign: (href: string) => navigations.push(href), replace: (href: string) => navigations.push(href)},
    document: {
      documentElement: {setAttribute: (key: string, value: string) => attributes.set(key, value)},
      querySelector: (selector: string) => ({content: selector.includes('canonical') ? 'http://localhost:1313/blog/' : selector.includes('surface') ? mode : '/blog/'}),
      querySelectorAll: () => [],
      addEventListener: (name: string, handler: Function) => handlers[name] = handler,
    }};
  runInNewContext(script, context);
  return {navigations, values, attributes, click: (target: object) => handlers.click({target: {closest: () => target}, preventDefault() {}})};
}

test("explicit mode switches keep article context and work under a project-site base path", () => {
  const classic = surface('classic', 'posts/a/#formula', 'classic');
  classic.click({dataset: {viewMode: '3d'}});
  const scene = new URL(classic.navigations[0]);
  assert.equal(scene.origin, 'http://127.0.0.1:1313');
  assert.equal(scene.pathname, '/blog/');
  assert.equal(new URLSearchParams(scene.hash.slice(1)).get('page'), '/blog/posts/a/#formula');
  assert.equal(classic.values.get('cl-knowledge:view'), '3d');
  const archive = surface('3d', '#article=%2Fblog%2Fposts%2Fa%2F&view=read', '3d');
  archive.click({dataset: {viewMode: 'classic'}, href: 'http://127.0.0.1:1313/blog/posts/a/'});
  assert.equal(archive.navigations[0], 'http://127.0.0.1:1313/blog/posts/a/');
  assert.ok(archive.values.get('cl-knowledge:last-scene')?.includes('view=read'));
});

test("remembered modes never redirect embedded documents or override explicit shared scene links", () => {
  assert.deepEqual(surface('classic', 'posts/a/?knowledge-reader=1', '3d', true).navigations, []);
  assert.deepEqual(surface('3d', '#article=a&view=read', 'classic').navigations, []);
  assert.deepEqual(surface('3d', '', 'classic').navigations, ['http://127.0.0.1:1313/blog/classic/']);
  assert.equal(new URL(surface('classic', 'posts/a/', '3d').navigations[0]).pathname, '/blog/');
});

test("mobile first visits choose classic without persisting an automatic preference", () => {
  const first = surface('3d', '', undefined, false, true);
  assert.deepEqual(first.navigations, ['http://127.0.0.1:1313/blog/classic/']);
  assert.equal(first.attributes.get('data-view-redirect'), 'true');
  assert.equal(first.values.has('cl-knowledge:view'), false);
  assert.deepEqual(surface('3d', '', '3d', false, true).navigations, []);
  assert.deepEqual(surface('3d', '', undefined, false, false).navigations, []);
  const article = surface('3d', '#article=%2Fblog%2Fposts%2Fa%2F&view=read', undefined, false, true);
  assert.deepEqual(article.navigations, ['http://127.0.0.1:1313/blog/posts/a/']);
  assert.deepEqual(surface('3d', '#article=%2Fblog%2Fposts%2Fa%2F&view=read', 'classic', false, true).navigations, article.navigations);
  assert.deepEqual(surface('3d', '#page=https://example.com/', undefined, false, true).navigations, ['http://127.0.0.1:1313/blog/classic/']);
});
