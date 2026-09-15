import {test} from 'node:test';
import assert from 'node:assert/strict';
import {damp, INSPECTION_LIFT, readyToRead} from '../src/rhine/motion.ts';

test('reading cannot capture the source until physical extraction and camera settle', () => {
  assert.equal(readyToRead({value: 3.2, velocity: 1}, 1), false, 'visible detail text is not physical clearance');
  assert.equal(readyToRead({value: INSPECTION_LIFT, velocity: 1}, 1), false, 'a moving source is not ready');
  assert.equal(readyToRead({value: INSPECTION_LIFT, velocity: 0}, .9), false);
  for (const fps of [15, 30, 60, 120]) {
    const lift = {value: .4, velocity: 0};
    let frames = 0;
    while (!readyToRead(lift, 1) && frames++ < fps * 5) damp(lift, INSPECTION_LIFT, 4.2, 1 / fps);
    assert.ok(readyToRead(lift, 1), `extraction must finish at ${fps} fps`);
    assert.ok(lift.value > 4.035);
  }
});
