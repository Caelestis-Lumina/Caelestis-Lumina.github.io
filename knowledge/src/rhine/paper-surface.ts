import * as THREE from 'three';

/** A rigid blank page, clipped at the cassette mouth as it slides out. */
export class PaperSurface extends THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> {
  private rest: Float32Array;
  constructor() {
    const geometry = new THREE.PlaneGeometry(1, 1, 1, 8);
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count * 3).fill(1), 3));
    super(geometry, new THREE.MeshBasicMaterial({color: '#f5f2ec', side: THREE.DoubleSide,
      vertexColors: true, toneMapped: false, fog: false}));
    this.rest = new Float32Array(geometry.attributes.position.array);
    this.frustumCulled = false;
    this.visible = false;
  }

  setExtraction(extraction: number, approach: number) {
    const positions = this.geometry.attributes.position;
    const colors = this.geometry.attributes.color;
    const mouth = .5 - extraction;
    for (let i = 0; i < positions.count; i++) {
      const x = this.rest[i * 3], y = this.rest[i * 3 + 1];
      positions.setXYZ(i, x, Math.max(y, mouth), 0);
      const contact = Math.exp(-Math.max(0, y - mouth) * 32) * .24 * (1 - approach) * (1 - extraction);
      colors.setXYZ(i, 1 - contact, 1 - contact, 1 - contact);
    }
    positions.needsUpdate = true;
    colors.needsUpdate = true;
  }

  dispose() { this.geometry.dispose(); this.material.dispose(); }
}
