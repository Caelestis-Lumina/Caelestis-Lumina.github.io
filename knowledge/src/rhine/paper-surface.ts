import * as THREE from 'three';

/** Fixed geometry: the cassette opening clips the page without stretching its vertices. */
export class PaperSurface extends THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> {
  readonly opening = new THREE.Plane(new THREE.Vector3(0, 1, 0), 10000);
  constructor() {
    super(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({
      color: '#f5f2ec', side: THREE.DoubleSide, toneMapped: false, fog: false,
    }));
    this.material.clippingPlanes = [this.opening];
    this.frustumCulled = false;
    this.visible = false;
  }
  dispose() { this.geometry.dispose(); this.material.dispose(); }
}
