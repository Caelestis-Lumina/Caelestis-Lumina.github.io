import * as THREE from 'three';
import type {Article} from '../catalog.ts';

/** A small deformable sheet. Hidden rows collapse at the cassette mouth until extracted. */
export class PaperSurface extends THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> {
  private rest: Float32Array;
  private texture?: THREE.CanvasTexture;
  constructor() {
    const geometry = new THREE.PlaneGeometry(1, 1, 16, 32);
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count * 3).fill(1), 3));
    super(geometry, new THREE.MeshBasicMaterial({color: '#f5f2ec', side: THREE.DoubleSide,
      vertexColors: true, toneMapped: false, fog: false}));
    this.rest = new Float32Array(geometry.attributes.position.array);
    this.frustumCulled = false;
    this.visible = false;
  }

  deform(extraction: number, approach: number) {
    const positions = this.geometry.attributes.position;
    const colors = this.geometry.attributes.color;
    const mouth = .5 - extraction;
    const curl = Math.sin(Math.PI * extraction * .65) * (1 - approach) ** 2;
    for (let i = 0; i < positions.count; i++) {
      const x = this.rest[i * 3], y = this.rest[i * 3 + 1];
      const visibleY = Math.max(y, mouth);
      const lead = y + .5;
      // Leading edge lifts first; the tail follows, then the whole sheet relaxes flat.
      positions.setXYZ(i, x + .025 * curl * lead * lead,
        visibleY, curl * (.15 * lead * lead + .035 * x * x));
      const contact = Math.exp(-Math.max(0, y - mouth) * 32) * .24 * (1 - approach) * (1 - extraction);
      const shade = 1 - contact - .035 * curl * lead;
      colors.setXYZ(i, shade, shade, shade);
    }
    positions.needsUpdate = true;
    colors.needsUpdate = true;
  }

  setArticle(article: Pick<Article, 'title' | 'summary' | 'date' | 'columns'>) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 768;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 1024, 768);
    ctx.fillStyle = '#897454'; ctx.font = '18px MiSans, sans-serif';
    ctx.fillText(`${article.columns[0]?.split('/')[0] || 'ARCHIVE'}  /  ${article.date.slice(0, 10)}`, 72, 96);
    ctx.fillRect(72, 126, 880, 1);
    const wrap = (text: string, y: number, limit: number, lineHeight: number) => {
      let line = '', lines = 0;
      for (const char of Array.from(text)) {
        if (ctx.measureText(line + char).width > 880) {
          ctx.fillText(line, 72, y); y += lineHeight; line = ''; lines++;
          if (lines >= limit) return;
        }
        line += char;
      }
      if (line) ctx.fillText(line, 72, y);
    };
    ctx.fillStyle = '#332f28'; ctx.font = '600 38px MiSans, sans-serif';
    wrap(article.title, 198, 3, 54);
    ctx.fillStyle = '#7b7469'; ctx.font = '24px MiSans, sans-serif';
    wrap(article.summary.replace(/\s+/g, ' ').slice(0, 180), 416, 5, 40);
    this.texture?.dispose();
    this.texture = new THREE.CanvasTexture(canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.material.map = this.texture;
    this.material.needsUpdate = true;
  }

  dispose() { this.texture?.dispose(); this.geometry.dispose(); this.material.dispose(); }
}
