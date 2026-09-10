import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {readingPose, ReadingShot} from '../src/rhine/reading-shot.ts';
import {groupAssembly} from '../src/rhine/assembly.ts';
import {PaperSurface} from '../src/rhine/paper-surface.ts';

test('blank page stays flat and untextured throughout extraction and return', () => {
  const paper = new PaperSurface();
  const vertices = paper.geometry.attributes.position;
  const original = Array.from(vertices.array);
  for (const progress of [.2, .5, .8, 1, .8, .5, .2]) {
    paper.opening.constant = progress;
    for (let i = 0; i < vertices.count; i++) {
      assert.equal(vertices.getZ(i), 0);
      assert.ok(Math.abs(vertices.getX(i)) === .5, 'page edges must remain straight');
    }
    assert.equal(paper.material.map, null, 'no article thumbnail during flight');
    assert.deepEqual(Array.from(vertices.array), original, 'extraction must not stretch any vertices');
  }
  assert.equal(vertices.getY(vertices.count - 1), -.5);
  paper.dispose();
});

test('paper is extracted after centering and opening, then approaches the screen', () => {
  assert.deepEqual(readingPose(0), {lift:0, center:0, open:0, paper:0, approach:0});
  assert.equal(readingPose(.3).paper, 0);
  assert.equal(readingPose(.5).center, 1);
  assert.equal(readingPose(.8).open, 1);
  assert.equal(readingPose(.8).paper, 1);
  assert.deepEqual(readingPose(1), {lift:1, center:1, open:1, paper:1, approach:1});
});

test('paper lands at the reader bounds and reversing restores the exact model pose', () => {
  const camera = new THREE.PerspectiveCamera(4.6, 16/9, .1, 300);
  camera.position.set(-20, 18, 70);
  camera.lookAt(0, 2, 0);
  camera.updateMatrixWorld(true);
  const scene = new THREE.Scene();
  const source = new THREE.Group();
  source.position.set(-3, 0, 0);
  source.rotation.y = .4;
  const model = new THREE.Group();
  const groups = groupAssembly(model);
  const shot = new ReadingShot(model, groups, scene);
  shot.begin(source, camera);
  for (const t of [.61,.65,.7,.75,.8,.85,.9,.95]) {
    shot.set(t); shot.update(camera,{width:1280,height:720});
    assert.ok(Math.abs(shot.paper.scale.x / shot.paper.scale.y - 16/9) < 1e-8, 'page must keep its aspect ratio during flight');
    const sheet = shot.bounds(camera,{left:0,top:0,width:1280,height:720});
    assert.ok(sheet.top >= 0, `sheet clipped above viewport at ${t}`);
    assert.ok(sheet.top + sheet.height <= 720, `sheet clipped below viewport at ${t}`);
  }
  shot.set(1);
  shot.update(camera, {width:1280,height:720});
  const rect = shot.bounds(camera, {left:0,top:0,width:1280,height:720});
  assert.ok(Math.abs(rect.left - 25.6) < .001);
  assert.ok(Math.abs(rect.top - 14.4) < .001);
  assert.ok(Math.abs(rect.width - 1228.8) < .001);
  assert.ok(shot.paper.visible);
  for (const t of [.85,.6,.2,0]) { shot.set(t); shot.update(camera,{width:1280,height:720}); }
  assert.ok(model.position.distanceTo(source.position) < 1e-8);
  assert.ok(model.quaternion.angleTo(source.quaternion) < 1e-7);
  assert.equal(shot.paper.visible, false);
  assert.equal(groups.get('cover')!.position.length(), 0);
  shot.dispose();
  assert.equal(scene.children.length, 0);
});
