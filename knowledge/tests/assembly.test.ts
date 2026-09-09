import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import * as THREE from "three";
import {PARTS, groupAssembly, spreadAssembly} from "../src/rhine/assembly.ts";
import {glassRevealAtHeight} from "../src/rhine/glass-reveal.ts";

test("updated GLB supplies every assembly group used by the reading transition", () => {
  const binary = readFileSync(new URL("../../static/rhine/assets/archive-assembly.glb", import.meta.url));
  const json = JSON.parse(binary.subarray(20, 20 + binary.readUInt32LE(12)).toString());
  const model = new THREE.Group();
  for (const node of json.nodes.filter((node: {mesh?: number}) => node.mesh !== undefined)) {
    const child = new THREE.Object3D();
    child.userData.assemblyPart = node.extras?.assemblyPart;
    model.add(child);
  }
  const count = model.children.length;
  const groups = groupAssembly(model);
  assert.equal([...groups.values()].reduce((sum, g) => sum + g.children.length, 0), count);
  for (const part of PARTS) assert.ok(groups.get(part.id)!.children.length > 0, part.id);
  spreadAssembly(groups, 1);
  assert.ok(groups.get("cover")!.position.z > groups.get("carrier")!.position.z);
  spreadAssembly(groups, 0);
  for (const group of groups.values()) assert.ok(group.position.z === 0);
});
test("glass reveal clears from top to bottom with fully frosted and clear endpoints", () => {
  for (const height of [0, .2, .5, .8, 1]) {
    assert.equal(glassRevealAtHeight(0, height), 0);
    assert.equal(glassRevealAtHeight(1, height), 1);
  }
  assert.ok(glassRevealAtHeight(.5, .8) > glassRevealAtHeight(.5, .2));
});
