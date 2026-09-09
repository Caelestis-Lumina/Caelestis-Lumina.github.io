import type {KnowledgeApp} from "./app.ts";
import type {Article} from "./catalog.ts";
import type {ArticleReader} from "./reader.ts";
import {tween} from "./transition.ts";

/** Owns the reversible handoff from the physical cassette to the reading surface. */
export class ReadingFlow {
  private controller = new AbortController();
  private phase: "idle" | "opening" | "reading" | "closing" = "idle";
  private status = document.createElement("div");
  private app: KnowledgeApp;
  private reader: ArticleReader;
  constructor(app: KnowledgeApp, reader: ArticleReader) {
    this.app = app;
    this.reader = reader;
    this.status.className = "reading-transition-status";
    this.status.hidden = true;
    this.status.innerHTML = '<span role="status"></span><button>取消 <kbd>ESC</kbd></button>';
    document.body.append(this.status);
    this.status.querySelector("button")!.addEventListener("click", () => void this.close(true));
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && this.busy) { event.preventDefault(); void this.close(true); }
    });
  }
  get busy() { return this.phase === "opening" || this.phase === "closing"; }
  get active() { return this.phase !== "idle"; }
  private begin(phase: "opening" | "closing") {
    this.controller.abort();
    this.controller = new AbortController();
    this.setPhase(phase);
    return this.controller.signal;
  }
  private setPhase(phase: typeof this.phase) {
    this.phase = phase;
    this.app.root.dataset.readingTransition = phase;
    this.app.root.inert = this.busy;
    this.status.hidden = !this.busy;
    this.status.querySelector("span")!.textContent = phase === "opening" ? "正在展开档案…" : "正在重组档案…";
    this.status.querySelector<HTMLButtonElement>("button")!.hidden = phase === "closing";
  }
  async open(article: Article, anchor = "") {
    const continuing = this.reader.isOpen && this.phase === "reading";
    const signal = this.begin("opening");
    this.reader.prepare(article, anchor);
    try { await this.app.renderingScene.prepareReadingAssembly(); }
    catch (error) { console.warn("Reading animation unavailable; continuing with article", error); }
    if (signal.aborted) return;
    // Direct links can reach this flow before the extraction camera has settled.
    const started = performance.now();
    while (this.app.renderingScene.detailVisibility < .99 && performance.now() - started < 8000) {
      if (!await tween(50, signal, () => {})) return;
    }
    const from = this.app.renderingScene.currentReadingSpread;
    if (!await tween(this.app.prefs.reduced || continuing ? 0 : 650, signal,
      progress => this.app.renderingScene.setReadingSpread(from + (1 - from) * progress))) return;
    this.reader.show(article, anchor);
    if (!continuing && !await this.reader.morph(this.app.renderingScene.readingBounds(), true, this.app.prefs.reduced, signal)) return;
    if (!signal.aborted) {
      this.setPhase("reading");
      this.reader.root.querySelector<HTMLIFrameElement>("iframe")?.focus();
    }
  }
  async close(notify = false) {
    if (this.phase === "closing") return;
    const signal = this.begin("closing");
    if (this.reader.isOpen && !await this.reader.morph(this.app.renderingScene.readingBounds(), false, this.app.prefs.reduced, signal)) return;
    this.reader.close(false);
    const from = this.app.renderingScene.currentReadingSpread;
    if (!await tween(this.app.prefs.reduced ? 0 : 550 * from, signal,
      progress => this.app.renderingScene.setReadingSpread(from * (1 - progress)))) return;
    this.app.renderingScene.clearReadingAssembly();
    this.setPhase("idle");
    this.app.root.querySelector<HTMLButtonElement>('[data-action="read"]')?.focus({preventScroll: true});
    if (notify) this.reader.onClose?.();
  }
  reset() {
    this.controller.abort();
    this.reader.close(false);
    this.app.renderingScene.clearReadingAssembly();
    this.setPhase("idle");
  }
}
