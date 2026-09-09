export type ArchiveStep = {axis: "lane" | "row"; direction: number};

/** Screen-pixel gesture state; independent of DOM, rendering and content counts. */
export class ArchiveGesture {
  private origin = {x: 0, y: 0};
  private previous = {x: 0, y: 0};
  private stride = {lane: 80, row: 44};
  private remainder = 0;
  private axis: ArchiveStep["axis"] | null = null;
  private active = false;
  get dragging() { return this.axis !== null; }

  begin(x: number, y: number, width: number, height: number) {
    this.reset();
    this.active = true;
    this.origin = this.previous = {x, y};
    this.stride = {lane: Math.max(48, Math.min(100, width * .065)), row: Math.max(32, Math.min(60, height * .06))};
  }
  move(x: number, y: number): ArchiveStep | null {
    if (!this.active) return null;
    if (!this.axis) {
      const dx = x - this.origin.x, dy = y - this.origin.y;
      if (Math.hypot(dx, dy) < 8) return null;
      this.axis = Math.abs(dx) >= Math.abs(dy) ? "lane" : "row";
    }
    this.remainder += this.axis === "lane" ? this.previous.x - x : this.previous.y - y;
    this.previous = {x, y};
    const direction = Math.trunc(this.remainder / this.stride[this.axis]);
    this.remainder -= direction * this.stride[this.axis];
    return direction ? {axis: this.axis, direction} : null;
  }
  end(): boolean {
    const click = this.active && !this.dragging;
    this.reset();
    return click;
  }
  reset() { this.active = false; this.axis = null; this.remainder = 0; }
}
