import * as THREE from "three";

// Depths and grouping reused from RhineLabUI's exploded model viewer.
export const PARTS = [
  {id: "fasteners", label: "紧固件", en: "FASTENERS", depth: 2.75},
  {id: "cover", label: "透明盖板", en: "OPTICAL COVER", depth: 1.85},
  {id: "optical-lenses", label: "折射环组", en: "REFRACTIVE RINGS", depth: .75},
  {id: "optical-core", label: "光学核心", en: "OPTICAL CORE", depth: -.15},
  {id: "substrate", label: "信息基板", en: "SUBSTRATE", depth: -1.1},
  {id: "carrier", label: "背板与框架", en: "CARRIER", depth: -2.05},
] as const;
export function groupAssembly(model: THREE.Group): Map<string, THREE.Group> {
  const groups = new Map(PARTS.map(part => [part.id as string, new THREE.Group()]));
  for (const child of [...model.children]) (groups.get(child.userData.assemblyPart) || groups.get("cover"))!.add(child);
  for (const [name, group] of groups) { group.name = name; model.add(group); }
  return groups;
}
export function spreadAssembly(groups: Map<string, THREE.Group>, progress: number) {
  for (const part of PARTS) groups.get(part.id)!.position.z = part.depth * progress;
}
