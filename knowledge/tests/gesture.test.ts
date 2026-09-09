import {test} from "node:test";
import assert from "node:assert/strict";
import {ArchiveGesture} from "../src/archive-gesture.ts";

test("small pointer jitter remains a click; a drag cannot become a click by returning to its origin", () => {
  const gesture = new ArchiveGesture();
  gesture.begin(100, 100, 1000, 800);
  assert.equal(gesture.move(103, 104), null);
  assert.equal(gesture.end(), true);
  gesture.begin(100, 100, 1000, 800);
  gesture.move(120, 100);
  gesture.move(100, 100);
  assert.equal(gesture.end(), false);
});
test("dragging navigates repeatedly, locks the first axis and supports direction reversal", () => {
  const gesture = new ArchiveGesture();
  gesture.begin(500, 300, 1000, 800);
  assert.deepEqual(gesture.move(430, 310), {axis: "lane", direction: 1});
  assert.deepEqual(gesture.move(300, 600), {axis: "lane", direction: 2});
  assert.deepEqual(gesture.move(370, 600), {axis: "lane", direction: -1});
  assert.equal(gesture.end(), false);
  gesture.begin(200, 300, 1000, 800);
  assert.deepEqual(gesture.move(202, 202), {axis: "row", direction: 2});
  assert.equal(gesture.end(), false);
});
test("cancellation clears movement and leaves the next touch independent of the old gesture", () => {
  const gesture = new ArchiveGesture();
  gesture.begin(0, 0, 390, 844);
  assert.deepEqual(gesture.move(-60, 0), {axis: "lane", direction: 1});
  gesture.reset();
  assert.equal(gesture.move(-300, 0), null);
  assert.equal(gesture.end(), false);
  gesture.begin(10, 20, 390, 844);
  assert.equal(gesture.end(), true);
});
