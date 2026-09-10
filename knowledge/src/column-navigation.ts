import {element, escapeHTML} from "./dom.ts";
import {ArchiveCatalog} from "./navigation.ts";
import {rootColumn} from "./catalog.ts";
import {ColumnCarousel, columnWindow, nearestColumn} from "./column-carousel.ts";
import type {ArchiveNavigation} from "./rhine/archive-loop.ts";

/** A bounded strip and a complete select share the scene's catalog selection. */
export class ColumnNavigation {
  private host = element("#column-tabs");
  private select = element<HTMLSelectElement>("#top-column");
  private buttons = new Map<number, HTMLButtonElement>();
  private counts: number[];
  private carousel: ColumnCarousel;
  private frame = 0;
  private lastTime = 0;
  private pointer: number | null = null;
  private suppressClick = false;
  private reduced = false;
  private restoreFocus = false;

  constructor(private catalog: ArchiveCatalog, private navigate: (direction: number) => void) {
    this.carousel = new ColumnCarousel(catalog.columns.length);
    const counts = new Map<string, number>();
    catalog.articles.forEach(article => counts.set(rootColumn(article), (counts.get(rootColumn(article)) || 0) + 1));
    this.counts = catalog.columns.map(column => counts.get(column) || 0);
    this.select.innerHTML = catalog.columns.map((column, lane) =>
      `<option value="${lane}">${escapeHTML(column)} · ${this.counts[lane]} 篇</option>`).join("");
    this.select.addEventListener("change", () => {
      const offset = nearestColumn(Number(this.select.value), this.carousel.target, catalog.columns.length) - this.carousel.target;
      if (offset) this.navigate(offset);
    });
    this.host.addEventListener("click", event => {
      if (this.suppressClick) { event.preventDefault(); event.stopPropagation(); this.suppressClick = false; return; }
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-column-position]");
      if (!button) return;
      const offset = Number(button.dataset.columnPosition) - this.carousel.target;
      if (offset) this.navigate(offset);
    });
    this.host.addEventListener("pointerdown", event => {
      if (!event.isPrimary || event.button !== 0 || this.pointer !== null) return;
      this.pointer = event.pointerId;
      this.suppressClick = false;
      cancelAnimationFrame(this.frame);
      this.carousel.begin(event.clientX, this.host.getBoundingClientRect().width / 5.6);
    });
    // Capture after the drag threshold so a stationary press remains a click.
    window.addEventListener("pointermove", event => {
      if (event.pointerId !== this.pointer) return;
      const offset = this.carousel.move(event.clientX);
      if (this.carousel.dragging) {
        if (!this.host.hasPointerCapture(event.pointerId)) this.host.setPointerCapture(event.pointerId);
        this.host.dataset.dragging = "true";
        this.suppressClick = true;
        if (offset) this.navigate(offset);
        this.render();
      }
    });
    window.addEventListener("pointerup", event => { if (event.pointerId === this.pointer) this.endDrag(); });
    window.addEventListener("pointercancel", event => { if (event.pointerId === this.pointer) this.endDrag(); });
    this.host.addEventListener("lostpointercapture", () => this.endDrag());
    window.addEventListener("blur", () => this.endDrag());
    window.addEventListener("resize", () => this.endDrag());
    document.addEventListener("visibilitychange", () => { if (document.hidden) this.endDrag(); });
    this.host.addEventListener("keydown", () => { this.suppressClick = false; });
  }

  update(animated: boolean, navigation?: ArchiveNavigation) {
    this.restoreFocus ||= this.host.contains(document.activeElement) && !this.carousel.dragging;
    this.reduced = !animated;
    const {lane} = this.catalog.location(this.catalog.selected);
    const direction = navigation && "axis" in navigation && navigation.axis === "lane" ? navigation.direction : undefined;
    this.carousel.select(lane, direction);
    this.select.value = String(lane);
    element("#column-name").textContent = this.catalog.columns[lane];
    for (const action of ["column-prev", "column-next"])
      element<HTMLButtonElement>(`[data-action="${action}"]`).disabled = this.catalog.columns.length < 2;
    if (!animated && !this.carousel.dragging) this.carousel.position = this.carousel.target;
    this.render();
    this.animate();
  }

  private endDrag() {
    if (this.pointer === null) return;
    const pointer = this.pointer;
    this.pointer = null;
    this.carousel.end();
    delete this.host.dataset.dragging;
    if (this.host.hasPointerCapture(pointer)) this.host.releasePointerCapture(pointer);
    this.animate();
  }

  private animate() {
    cancelAnimationFrame(this.frame);
    if (this.carousel.dragging || this.carousel.position === this.carousel.target) return;
    this.lastTime = performance.now();
    const tick = (time: number) => {
      const moving = this.carousel.settle(time - this.lastTime, this.reduced);
      this.lastTime = time;
      this.render();
      if (moving) this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  private render() {
    const items = columnWindow(this.carousel.position, this.catalog.columns.length);
    const visible = new Set(items.map(item => item.index));
    for (const [index, button] of this.buttons) {
      if (visible.has(index)) continue;
      this.restoreFocus ||= document.activeElement === button && !this.carousel.dragging;
      button.remove();
      this.buttons.delete(index);
    }
    for (const {index, lane, distance} of items) {
      let button = this.buttons.get(index);
      if (!button) {
        button = document.createElement("button");
        button.type = "button";
        button.dataset.columnPosition = String(index);
        button.innerHTML = `<span class="column-order">${String(lane + 1).padStart(2, "0")}</span><strong>${escapeHTML(this.catalog.columns[lane])}</strong><span class="column-count">${this.counts[lane]} 篇</span>`;
        this.buttons.set(index, button);
        this.host.append(button);
      }
      const depth = Math.abs(distance);
      const selected = index === this.carousel.target;
      const hidden = depth > 2.5;
      button.style.transform = `translate3d(${distance * 100 - 50}%,0,0) scale(${1 - Math.min(depth, 3) * .045})`;
      button.style.opacity = String(Math.max(0, 1 - depth * .26));
      button.style.filter = `blur(${Math.max(0, depth - 1) * 1.1}px)`;
      button.inert = hidden;
      button.setAttribute("aria-hidden", String(hidden));
      button.setAttribute("aria-pressed", String(selected));
      button.tabIndex = selected ? 0 : -1;
      if (selected && !hidden && this.restoreFocus) {
        button.focus({preventScroll: true});
        this.restoreFocus = false;
      }
    }
  }
}
