import {wrap} from "./navigation.ts";

/** Unbounded coordinates preserve the direction across the first/last column. */
export function nearestColumn(lane: number, position: number, count: number) {
  return lane + Math.round((position - lane) / count) * count;
}

/** Five primary positions and two fading buffers, independent of catalog size. */
export function columnWindow(position: number, count: number) {
  if (count < 1) return [];
  const center = Math.round(position);
  const used = new Set<number>();
  return Array.from({length: 7}, (_, i) => center + i - 3)
    .sort((a, b) => Math.abs(a - position) - Math.abs(b - position))
    .filter(index => {
      const lane = wrap(index, count);
      if (used.has(lane)) return false;
      used.add(lane);
      return true;
    })
    .sort((a, b) => a - b)
    .map(index => ({index, lane: wrap(index, count), distance: index - position}));
}

export class ColumnCarousel {
  position = 0;
  target = 0;
  private origin = 0;
  private startX = 0;
  private width = 1;
  dragging = false;
  readonly count: number;
  constructor(count: number) { this.count = count; }

  select(lane: number, direction?: number) {
    this.target = direction !== undefined && wrap(this.target + direction, this.count) === lane
      ? this.target + direction : nearestColumn(lane, this.target, this.count);
    if (!this.dragging && Math.abs(this.target - this.position) > 3)
      this.position = this.target - Math.sign(this.target - this.position) * 3;
  }

  begin(x: number, slotWidth: number) {
    this.startX = x;
    this.origin = this.position;
    this.width = Math.max(1, slotWidth);
    this.dragging = false;
  }

  move(x: number) {
    if (!this.dragging && Math.abs(x - this.startX) < 8) return 0;
    this.dragging = true;
    this.position = this.count > 1 ? this.origin - (x - this.startX) / this.width : this.target;
    return Math.round(this.position) - this.target;
  }

  end() {
    const wasDragging = this.dragging;
    this.dragging = false;
    return wasDragging;
  }

  settle(dt: number, reduced: boolean) {
    if (this.dragging) return false;
    this.position += (this.target - this.position) * (1 - Math.exp(-dt / 85));
    if (reduced || Math.abs(this.target - this.position) < .001) this.position = this.target;
    return this.position !== this.target;
  }
}
