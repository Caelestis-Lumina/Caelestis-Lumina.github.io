import * as THREE from 'three';
import {PaperSurface} from './paper-surface.ts';
import {readingPose} from '../reading-motion.ts';
import {smooth} from './motion.ts';

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
  private pivot = new THREE.Vector3();
  private orbit = new THREE.Quaternion();
  private orbitAxis = new THREE.Vector3(0, 1, 0);
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
    this.pivot.copy(camera.position).addScaledVector(this.forward, this.depth);
    this.center.copy(camera.position).addScaledVector(this.forward, this.depth - 2);
    this.active = true;
    this.dirty = true;
  }

  set(value: number) { this.dirty ||= value !== this.progress; this.progress = value; }

  update(camera: THREE.PerspectiveCamera, viewport: {width: number; height: number}) {
    const p = readingPose(this.progress);
    // One orbit moves the entire archive throughout the shot, including lid/page motion.
    const travel = smooth(this.progress);
    this.orbit.setFromAxisAngle(this.orbitAxis, -.055 * travel);
    camera.position.copy(this.cameraPosition).sub(this.pivot).applyQuaternion(this.orbit).add(this.pivot);
    camera.quaternion.copy(this.orbit).multiply(this.cameraOrientation);
    camera.fov = this.fieldOfView * (1 + .55 * travel);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
    this.up.set(0, 1, 0).applyQuaternion(camera.quaternion);
    this.forward.set(0, 0, -1).applyQuaternion(camera.quaternion);
    this.center.copy(camera.position).addScaledVector(this.forward, this.depth - 2);
    this.point.copy(this.start).addScaledVector(this.up, .8 * p.lift);
    this.landing.copy(this.center).addScaledVector(this.up, -2.2);
    this.model.position.copy(this.point).lerp(this.landing, p.center);
    this.model.quaternion.copy(this.orientation).slerp(camera.quaternion, p.center);
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
    const widthFraction = Math.min(1760 / viewport.width, .96);
    const pageRatio = viewport.width * widthFraction / (viewport.height * .96);
    const sourceHeight = Math.min(3.05, 4.3 / pageRatio);
    this.point.set(0, 3.4 - sourceHeight / 2 + p.paper * sourceHeight, .32).applyMatrix4(this.model.matrixWorld);
    const near = this.depth * .3;
    this.point.sub(camera.position);
    const sourceDepth = Math.max(near, this.point.dot(this.forward));
    const distance = 1 / THREE.MathUtils.lerp(1 / sourceDepth, 1 / near, p.approach);
    this.point.addScaledVector(this.forward, -sourceDepth);
    this.landing.copy(camera.position).addScaledVector(this.forward, distance)
      .addScaledVector(this.point, (1 - p.approach) * distance / sourceDepth);
    this.paper.position.copy(this.landing);
    this.paper.quaternion.copy(this.model.quaternion).slerp(camera.quaternion, p.approach);
    const height = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * near;
    // Interpolate apparent size, so perspective cannot accelerate the last few frames.
    const sheetHeight = THREE.MathUtils.lerp(sourceHeight / sourceDepth, height * .96 / near, p.approach) * distance;
    this.paper.scale.set(sheetHeight * pageRatio, sheetHeight, 1);
    this.point.set(0, 3.4, .32).applyMatrix4(this.model.matrixWorld);
    this.paper.opening.normal.set(0, 1, 0).applyQuaternion(this.model.quaternion);
    this.paper.opening.constant = -this.paper.opening.normal.dot(this.point);
    if (p.paper >= 1) this.paper.opening.constant = 10000;
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
    if (this.active) {
      camera.position.copy(this.cameraPosition); camera.quaternion.copy(this.cameraOrientation);
      camera.fov = this.fieldOfView; camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
    }
    this.active = false;
    this.progress = 0;
    this.paper.visible = false;
    this.model.visible = false;
  }
}
