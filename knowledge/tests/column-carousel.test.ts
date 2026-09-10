import {test} from "node:test";
import assert from "node:assert/strict";
import {ColumnCarousel, columnWindow, nearestColumn} from "../src/column-carousel.ts";
import {ArchiveCatalog, wrap} from "../src/navigation.ts";

test("column window stays bounded, centered and unique from one to ten thousand columns", () => {
  for (const count of [1, 2, 3, 5, 6, 8, 10000]) {
    for (const position of [-2, -.51, 0, .49, count - 1, count + .6]) {
      const items = columnWindow(position, count);
      assert.equal(items.length, Math.min(count, 7));
      assert.equal(new Set(items.map(item => item.lane)).size, items.length);
      assert.ok(items.every(item => item.lane >= 0 && item.lane < count));
      assert.ok(items.some(item => item.index === Math.round(position)));
      if (Number.isInteger(position) && count >= 5)
        assert.deepEqual(items.filter(item => Math.abs(item.distance) <= 2).map(item => item.distance), [-2, -1, 0, 1, 2]);
    }
  }
});

test("last/first selection continues forward or backward without reversing the strip", () => {
  const rail = new ColumnCarousel(8);
  rail.select(7, -1);
  assert.equal(rail.target, -1);
  rail.select(0, 1);
  assert.equal(rail.target, 0);
  rail.select(1, 1);
  assert.equal(rail.target, 1);
  assert.equal(nearestColumn(7, 0, 8), -1);
  const pair = new ColumnCarousel(2);
  pair.select(1, -1);
  assert.equal(pair.target, -1);
});

test("drag follows the pointer, crosses several columns and reverses without becoming a click", () => {
  const rail = new ColumnCarousel(8);
  rail.begin(500, 100);
  assert.equal(rail.move(496), 0);
  assert.equal(rail.dragging, false);
  let delta = rail.move(230);
  assert.equal(delta, 3);
  rail.select(wrap(rail.target + delta, 8), delta);
  assert.equal(rail.position, 2.7);
  delta = rail.move(610);
  assert.equal(delta, -4);
  rail.select(wrap(rail.target + delta, 8), delta);
  assert.equal(rail.target, -1);
  assert.equal(rail.end(), true);
  for (let i = 0; i < 90; i++) rail.settle(16, false);
  assert.equal(rail.position, -1);
  rail.begin(100, 100);
  rail.move(103);
  assert.equal(rail.end(), false);
});

test("long jumps have bounded travel, cancellation settles, and reduced motion snaps", () => {
  const rail = new ColumnCarousel(10000);
  rail.select(4000);
  assert.equal(rail.target - rail.position, 3);
  rail.settle(16, true);
  assert.equal(rail.position, 4000);
  rail.begin(200, 100);
  rail.move(175);
  rail.end();
  rail.settle(16, true);
  assert.equal(rail.position, rail.target);
  const single = new ColumnCarousel(1);
  single.begin(0, 100);
  assert.equal(single.move(-500), 0);
  assert.equal(single.position, 0);
});

test("dropdown-style jumps retain the catalog's selected article and child filter", () => {
  const articles = Array.from({length: 20}, (_, i) => ({
    id: `/posts/${i}/`, url: `/posts/${i}/`, title: String(i), summary: "", content: "", tags: [], date: "2026-09-11", minutes: 1,
    columns: [`Column ${String(Math.floor(i / 2)).padStart(2, '0')}`, `Column ${String(Math.floor(i / 2)).padStart(2, '0')}/Child ${i % 2}`],
  }));
  const catalog = new ArchiveCatalog(articles);
  const rail = new ColumnCarousel(catalog.columns.length);
  catalog.filter(0, 'Column 00/Child 1');
  const remembered = catalog.selected;
  for (const lane of [9, 5, 0]) {
    const delta = nearestColumn(lane, rail.target, rail.count) - rail.target;
    catalog.stepLane(delta);
    rail.select(catalog.location(catalog.selected).lane, delta);
  }
  assert.equal(catalog.selected, remembered);
  assert.equal(catalog.filterPath(0), 'Column 00/Child 1');
});
