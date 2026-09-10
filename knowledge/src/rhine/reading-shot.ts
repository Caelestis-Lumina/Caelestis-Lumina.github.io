import * as THREE from 'three';
import {PaperSurface} from './paper-surface.ts';

const segment = (t: number, start: number, end: number) => {
  const x = THREE.MathUtils.clamp((t - start) / (end - start), 0, 1);
  return x * x * x * (10 + x * (-15 + 6 * x));
};

/** One reversible timeline. Segment overlap keeps each movement flowing into the next. */
export function readingPose(t: number) {
  return {lift: segment(t, 0, .24), center: segment(t, .1, .43),
    open: segment(t, .36, .61), paper: segment(t, .53, .8), approach: segment(t, .65, 1)};
}

export class ReadingShot {
  readonly paper = new PaperSurface();
  private start = new THREE.Vector3();
  private orientation = new THREE.Quaternion();
  private center = new THREE.Vector3();
  private up = new THREE.Vector3();
  private forward = new THREE.Vector3();
  private cameraOrientation = new THREE.Quaternion();
  private cameraPosition = new THREE.Vector3();
  private point = new THREE.Vector3();
  private landing = new THREE.Vector3();
  private depth = 1;
  private fieldOfView = 6;
  active = false;
  dirty = true;
  private progress = 0;
  private mouth = new THREE.Mesh(new THREE.PlaneGeometry(4.35, .035),
    new THREE.MeshBasicMaterial({color: '#796c59', transparent: true, opacity: 0, depthWrite: false}));
  private model: THREE.Group;
  private groups: Map<string, THREE.Group>;
  private scene: THREE.Scene;

  constructor(model: THREE.Group, groups: Map<string, THREE.Group>, scene: THREE.Scene) {
    this.model = model;
    this.groups = groups;
    this.scene = scene;
    this.paper.visible = false;
    this.mouth.position.set(0, 3.4, .34);
    model.add(this.mouth);
    scene.add(this.paper);
  }

  begin(source: THREE.Group, camera: THREE.PerspectiveCamera) {
    source.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    this.start.copy(source.position);
    this.orientation.copy(source.quaternion);
    this.cameraOrientation.copy(camera.quaternion);
    this.cameraPosition.copy(camera.position);
    this.fieldOfView = camera.fov;
    this.up.set(0, 1, 0).applyQuaternion(camera.quaternion);
    this.forward.set(0, 0, -1).applyQuaternion(camera.quaternion);
    this.point.set(0, 1.85, 0).applyMatrix4(source.matrixWorld).sub(camera.position);
    this.depth = Math.max(10, this.point.dot(this.forward));
    this.center.copy(camera.position).addScaledVector(this.forward, this.depth - 2);
    this.active = true;
    this.dirty = true;
  }

  set(value: number) { this.dirty ||= value !== this.progress; this.progress = value; }

  update(camera: THREE.PerspectiveCamera, viewport: {width: number; height: number}) {
    const p = readingPose(this.progress);
    // Give the rising sheet headroom before it travels toward the lens.
    camera.fov = this.fieldOfView * (1 + .55 * p.center);
    camera.updateProjectionMatrix();
    this.point.copy(this.start).addScaledVector(this.up, .8 * p.lift);
    this.landing.copy(this.center).addScaledVector(this.up, -2.2);
    this.model.position.copy(this.point).lerp(this.landing, p.center);
    this.model.quaternion.copy(this.orientation).slerp(this.cameraOrientation, p.center);
    this.model.visible = true;
    for (const name of ['cover', 'fasteners']) {
      const group = this.groups.get(name)!;
      // Rotate around the left edge of the cassette instead of sliding its lid away.
      const angle = -1.12 * p.open;
      group.rotation.y = angle;
      group.position.set(-2.5 + 2.5 * Math.cos(angle), 0, -2.5 * Math.sin(angle));
    }
    this.mouth.material.opacity = .22 * p.open * (1 - p.approach);
    this.model.updateMatrixWorld(true);
    // A real sheet slides out of the top of the opened cassette before approaching the lens.
    this.point.set(0, 1.875 + p.paper * 3.05, .32 + p.approach * .8).applyMatrix4(this.model.matrixWorld);
    const near = this.depth * .3;
    this.landing.copy(this.cameraPosition).addScaledVector(this.forward, near);
    this.paper.position.copy(this.point).lerp(this.landing, p.approach);
    this.paper.quaternion.copy(this.model.quaternion).slerp(this.cameraOrientation, p.approach);
    const height = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * near;
    const widthFraction = Math.min(1760 / viewport.width, .96);
    this.paper.scale.set(THREE.MathUtils.lerp(4.3, height * camera.aspect * widthFraction, p.approach),
      THREE.MathUtils.lerp(3.05, height * .96, p.approach), 1);
    this.paper.setExtraction(p.paper, p.approach);
    this.paper.visible = p.paper > 0;
    this.paper.updateMatrixWorld(true);
    this.dirty = false;
  }

  bounds(camera: THREE.Camera, viewport: {left: number; top: number; width: number; height: number}) {
    this.paper.updateMatrixWorld(true);
    const positions = this.paper.geometry.attributes.position;
    const points = Array.from({length: positions.count}, (_, i) =>
      new THREE.Vector3().fromBufferAttribute(positions, i).applyMatrix4(this.paper.matrixWorld).project(camera));
    const x = points.map(p => viewport.left + (p.x + 1) * viewport.width / 2);
    const y = points.map(p => viewport.top + (1 - p.y) * viewport.height / 2);
    return {left: Math.min(...x), top: Math.min(...y), width: Math.max(...x)-Math.min(...x), height: Math.max(...y)-Math.min(...y)};
  }

  dispose() {
    this.scene.remove(this.paper);
    this.paper.dispose();
    this.model.remove(this.mouth);
    this.mouth.geometry.dispose();
    this.mouth.material.dispose();
  }

  reset(camera: THREE.PerspectiveCamera) {
    if (this.active) { camera.fov = this.fieldOfView; camera.updateProjectionMatrix(); }
    this.active = false;
    this.progress = 0;
    this.paper.visible = false;
    this.model.visible = false;
  }
}
