import { test } from "node:test";
import assert from "node:assert/strict";
import { ArchiveRoutes, parseRoute, routeHash } from "../src/routes.ts";

test("scene links round-trip stable article URLs without interpreting their fragments", () => {
  const route = {article: "/blog/posts/中文 & geometry/", view: "read" as const};
  assert.deepEqual(parseRoute(routeHash(route)), route);
  assert.equal(parseRoute("#ordinary-heading"), null);
  assert.equal(parseRoute("#article=/posts/a/&view=unknown"), null);
});

test("closing a reader only goes back when the previous entry is that article's detail", () => {
  const location = {hash: ""};
  const history = {state: {} as {knowledgeRead?: boolean}, backs: 0,
    pushState(state: {knowledgeRead: boolean}, _title: string, hash: string) { this.state = state; location.hash = hash; },
    replaceState(state: {knowledgeRead: boolean}, title: string, hash: string) { this.pushState(state, title, hash); },
    back() { this.backs++; },
  };
  Object.assign(globalThis, {location, history, window: {addEventListener() {}}});
  const routes = new ArchiveRoutes();
  routes.save({article: "a", view: "detail"});
  routes.save({article: "a", view: "read"}, true);
  routes.closeReader({article: "a", view: "detail"});
  assert.equal(history.backs, 1);
  // Following a link inside article A creates article B's reader. Close returns to B, not A.
  routes.save({article: "b", view: "read"}, true);
  routes.closeReader({article: "b", view: "detail"});
  assert.equal(history.backs, 1);
  assert.deepEqual(parseRoute(location.hash), {article: "b", view: "detail"});
  // Directly opened share links have no synthetic previous page to navigate back to.
  history.state = {};
  location.hash = routeHash({article: "c", view: "read"});
  routes.closeReader({article: "c", view: "detail"});
  assert.equal(history.backs, 1);
  assert.deepEqual(parseRoute(location.hash), {article: "c", view: "detail"});
});
