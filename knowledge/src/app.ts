import { ArchiveScene } from "./rhine/scene.ts";
import { connectCatalog } from "./rhine/data.ts";
import type { ArchiveNavigation } from "./rhine/archive-loop.ts";
import { ArchiveCatalog } from "./navigation.ts";
import type { Catalog } from "./catalog.ts";
import { BootController } from "./boot-controller.ts";
import { Preferences, readPreference, writePreference } from "./preferences.ts";
import { SelectionView } from "./selection-view.ts";
import { element, siteURL } from "./dom.ts";
import { logo } from "./rhine/brand.ts";
import shell from "./shell.html?raw";

type Mode = "boot" | "archive" | "detail";

export class KnowledgeApp {
  readonly catalog: ArchiveCatalog;
  readonly prefs = new Preferences();
  private scene!: ArchiveScene;
  private stage = element("#stage");
  private boot!: BootController;
  private view!: SelectionView;
  private mode: Mode = "boot";
  private ready = false;
  private frameId = 0;
  private lastFrame = 0;
  private fpsFrames = 0;
  private fpsStart = 0;
  private onAction?: (action: string) => boolean;
  private overlayOpen: () => boolean = () => false;
  onStateChange?: (push: boolean) => void;
  suspendScene: () => boolean = () => false;

  constructor(data: Catalog) {
    this.catalog = new ArchiveCatalog(data.articles);
    connectCatalog(this.catalog);
    this.stage.innerHTML = shell.replaceAll("__LOGO__", logo);
    this.stage.querySelectorAll<HTMLAnchorElement>("[data-site-link]").forEach(link => link.href = siteURL(link.dataset.siteLink!));
    this.boot = new BootController(this.stage, () => this.enterArchive());
    this.view = new SelectionView(this.catalog);
    this.view.update(false);
    this.stage.dataset.mode = "boot";
    this.stage.dataset.boot = "access";
    ["#archive-ui", ".system-nav", ".system-footer"].forEach(selector => {
      element(selector).inert = true;
      element(selector).setAttribute("aria-hidden", "true");
    });
    element<HTMLButtonElement>("#skip").disabled = true;
    element("#loading").setAttribute("role", "status");
    this.fit();
    window.addEventListener("resize", () => this.fit());
    document.addEventListener("visibilitychange", () => this.schedule());
    window.addEventListener("pagehide", () => cancelAnimationFrame(this.frameId));
    window.addEventListener("pageshow", () => { if (this.ready) this.schedule(); });
    this.prefs.systemMotion.addEventListener("change", () => this.applyPreferences());
    this.stage.addEventListener("click", event => {
      const target = (event.target as HTMLElement).closest<HTMLElement>("[data-action], [data-select], [data-column]");
      if (!target || !this.ready) return;
      if (target.dataset.column !== undefined) {
        const current = this.catalog.location(this.catalog.selected).lane;
        const offset = Number(target.dataset.column) - current;
        if (offset) this.select(this.catalog.stepLane(offset));
      }
      else if (target.dataset.select !== undefined) this.select(Number(target.dataset.select));
      else this.action(target.dataset.action!);
    });
    element<HTMLSelectElement>("#subcolumn").addEventListener("change", event => {
      const { lane } = this.catalog.location(this.catalog.selected);
      if (this.catalog.filter(lane, (event.target as HTMLSelectElement).value))
        this.select(this.catalog.selected);
    });
    document.addEventListener("keydown", event => this.keydown(event));
  }

  get currentMode() { return this.mode; }
  get renderingScene() { return this.scene; }
  get root() { return this.stage; }
  registerActions(handler: (action: string) => boolean, overlayOpen: () => boolean) {
    this.onAction = handler;
    this.overlayOpen = overlayOpen;
  }

  async start() {
    this.scene = new ArchiveScene(element("#three-scene"));
    this.scene.renderer.domElement.addEventListener("webglcontextlost", event => {
      event.preventDefault();
      this.ready = false;
      cancelAnimationFrame(this.frameId);
      element("#loading").classList.remove("loaded");
      element("#loading").innerHTML = '<div class="error-state"><h2>图形连接已中断</h2><p>请重新载入以恢复三维场景。</p><button onclick="location.reload()">重新载入 ↗</button></div>';
    });
    await this.scene.load();
    // Font loading must not hold the scene hostage; redraw the label when ready.
    void document.fonts.load("700 20px MiSans").then(() => this.scene.refreshLabel()).catch(() => {});
    this.scene.onSelect = (index, cell) => {
      if (this.mode === "archive" && !this.overlayOpen()) this.select(index, cell ? { cell } : undefined);
    };
    this.scene.onNavigate = ({axis, direction}) => {
      if (this.mode !== "archive" || this.overlayOpen()) return;
      const index = axis === "lane" ? this.catalog.stepLane(direction) : this.catalog.stepRow(direction);
      this.select(index, {axis, direction});
    };
    this.scene.onHover = index => {
      const label = element("#hover-label");
      label.hidden = index === null || this.mode !== "archive";
      if (index !== null) {
        element("#hover-code").textContent = String(index + 1).padStart(3, "0");
        element("#hover-title").textContent = " / " + this.catalog.articles[index].title;
      }
    };
    this.ready = true;
    element<HTMLButtonElement>("#skip").disabled = false;
    this.applyPreferences();
    this.select(0);
    element("#loading").classList.add("loaded");
    this.boot.start();
    if (readPreference<boolean>("visited", false) === true || this.prefs.reduced || location.hash)
      this.enterArchive();
    else this.setMode("boot");
    this.schedule();
  }

  applyPreferences() {
    this.scene?.setReduced(this.prefs.reduced);
    this.scene?.setQuality(this.prefs.quality);
    this.stage.dataset.reduced = String(this.prefs.reduced);
    document.documentElement.dataset.reduced = String(this.prefs.reduced);
    this.view?.update(false);
    if (this.ready && this.prefs.reduced && this.mode === "boot") this.enterArchive();
  }

  select(index: number, navigation?: ArchiveNavigation) {
    if (this.mode === "detail") this.setMode("archive");
    this.catalog.select(index);
    this.scene.select(index, navigation);
    this.view.update(!this.prefs.reduced && this.mode === "archive", navigation);
    this.onStateChange?.(false);
  }
  openDetail() {
    this.setMode("detail");
    element("#detail-content").focus({ preventScroll: true });
  }
  enterArchive() {
    writePreference("visited", true);
    this.setMode("archive");
    // Cinematic startup uses five physical lanes; reconnect to the selected content.
    this.scene.select(this.catalog.selected);
  }
  returnToArchive() { this.setMode("archive"); element(".file-title").focus(); }
  replay() {
    if (this.prefs.reduced) { this.enterArchive(); return; }
    this.setMode("boot");
    this.boot.start();
  }

  private setMode(mode: Mode) {
    this.mode = mode;
    this.stage.dataset.mode = mode;
    for (const [selector, active] of [["#boot", mode === "boot"], ["#archive-ui", mode === "archive"],
      [".system-nav", mode !== "boot"], [".system-footer", mode !== "boot"]] as const) {
      element(selector).inert = !active;
      element(selector).setAttribute("aria-hidden", String(!active));
    }
    element("#detail-ui").hidden = mode !== "detail";
    this.scene.setMode(mode === "boot" ? "hidden" : mode);
    this.view.reset();
    if (mode !== "boot") this.boot.reset();
    if (mode === "detail") {
      this.view.detail();
      element("#detail-content").inert = true;
    }
    this.onStateChange?.(mode === "detail");
  }

  private action(action: string) {
    if (this.onAction?.(action)) return;
    if (action === "skip") this.enterArchive();
    if (action === "open") this.openDetail();
    if (action === "back") this.returnToArchive();
    if (action === "replay") this.replay();
    const moves: Record<string, ["row" | "lane", number]> = {
      prev: ["row", -1], next: ["row", 1], "column-prev": ["lane", -1], "column-next": ["lane", 1],
    };
    const move = moves[action];
    if (move) {
      const [axis, direction] = move;
      const index = axis === "row" ? this.catalog.stepRow(direction) : this.catalog.stepLane(direction);
      this.select(index, { axis, direction });
    }
  }

  private keydown(event: KeyboardEvent) {
    if (!this.ready || event.defaultPrevented || this.overlayOpen() || event.altKey || event.ctrlKey || event.metaKey ||
      (event.target as HTMLElement).closest("input, select, textarea, [contenteditable=true]")) return;
    if (this.mode === "boot") {
      if (["Enter", "Escape"].includes(event.key)) { event.preventDefault(); this.enterArchive(); }
      return;
    }
    if (event.key === "Enter" && (event.target as HTMLElement).closest("button, a")) return;
    const action = ({ArrowLeft: "column-prev", ArrowRight: "column-next", ArrowUp: "prev", ArrowDown: "next",
      Enter: "open", Escape: "back", "/": "search"} as Record<string, string>)[event.key];
    if (action) { event.preventDefault(); this.action(action); }
  }

  private fit() {
    const scale = Math.min(innerWidth / 1920, innerHeight / 1080);
    this.stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
    this.scene?.resize();
  }
  private schedule() {
    cancelAnimationFrame(this.frameId);
    if (this.ready && !document.hidden) this.frameId = requestAnimationFrame(time => this.frame(time));
  }
  private frame(ms: number) {
    const cinema = this.mode === "boot" ? this.boot.update(ms / 1000) : undefined;
    if (!this.suspendScene()) this.scene.update(ms / 1000, cinema);
    if (this.mode === "detail") {
      const content = element("#detail-content");
      content.style.opacity = String(this.scene.detailVisibility);
      content.style.transform = `translateY(${(1 - this.scene.detailVisibility) * 18}px)`;
      const waiting = content.inert;
      content.inert = this.scene.detailVisibility < 0.95;
      if (waiting && !content.inert && !this.overlayOpen()) content.focus({ preventScroll: true });
    }
    if (Math.floor(ms / 1000) !== this.lastFrame) {
      this.lastFrame = Math.floor(ms / 1000);
      element("#clock").textContent = new Date().toLocaleTimeString("en-GB");
    }
    this.fpsFrames++;
    if (ms - this.fpsStart > 1000) {
      element("#three-scene").dataset.fps = String(Math.round(this.fpsFrames * 1000 / (ms - this.fpsStart)));
      this.fpsStart = ms;
      this.fpsFrames = 0;
    }
    this.schedule();
  }
}
