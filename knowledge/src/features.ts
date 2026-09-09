import type { KnowledgeApp } from "./app.ts";
import { ArchiveSearch } from "./search.ts";
import { ArticleReader } from "./reader.ts";
import { Settings } from "./settings.ts";
import { ArchiveRoutes, parseRoute, type ArchiveRoute } from "./routes.ts";
import type { Article } from "./catalog.ts";
import type { ModelViewer } from "./rhine/model-viewer.ts";
import { element } from "./dom.ts";

/** Feature coordination lives here; rendering never needs to know about URL or DOM readers. */
export class KnowledgeFeatures {
  private routes = new ArchiveRoutes();
  private search: ArchiveSearch;
  private reader: ArticleReader;
  private settings: Settings;
  private viewer?: ModelViewer;
  private viewerLoading = false;
  private restoring = false;

  constructor(private app: KnowledgeApp) {
    this.search = new ArchiveSearch(app.catalog.articles, article => {
      app.select(app.catalog.articles.indexOf(article));
      element(".file-title").focus();
    });
    this.reader = new ArticleReader(app.catalog.articles, (article, anchor) => this.read(article, anchor));
    this.reader.onClose = () => this.routes.closeReader(this.route("detail"));
    this.settings = new Settings(app.prefs, () => app.applyPreferences(), () => app.replay());
    app.registerActions(action => this.action(action), () => this.isOverlayOpen());
    app.suspendScene = () => this.isOverlayOpen();
    app.onFrame = time => this.viewer?.update(time);
    window.addEventListener("resize", () => this.viewer?.resize());
    app.onStateChange = push => {
      if (!this.restoring && app.currentMode !== "boot")
        this.routes.save(this.route(app.currentMode), push);
    };
    this.routes.onChange = route => this.restore(route);
    this.restore(parseRoute(location.hash));
  }

  private isOverlayOpen() { return this.search.isOpen || this.reader.isOpen || this.settings.isOpen || Boolean(this.viewer?.isOpen); }
  private route(view: ArchiveRoute["view"]): ArchiveRoute {
    return {article: this.app.catalog.articles[this.app.catalog.selected].id, view};
  }
  private action(action: string): boolean {
    if (action === "search") this.search.open();
    else if (action === "settings") this.settings.open();
    else if (action === "read") this.read(this.app.catalog.articles[this.app.catalog.selected]);
    else if (action === "model-viewer") void this.openViewer();
    else return false;
    return true;
  }
  private read(article: Article, anchor = "") {
    this.restoring = true;
    if (this.app.catalog.articles[this.app.catalog.selected] !== article)
      this.app.select(this.app.catalog.articles.indexOf(article));
    if (this.app.currentMode !== "detail") this.app.openDetail();
    this.restoring = false;
    this.reader.show(article, anchor);
    this.routes.save(this.route("read"), true);
  }
  private restore(route: ArchiveRoute | null) {
    this.restoring = true;
    this.search.close(false);
    this.settings.close(false);
    this.reader.close(false);
    this.viewer?.close();
    const index = route ? this.app.catalog.articles.findIndex(a => a.id === route.article) : -1;
    if (index >= 0) {
      if (index !== this.app.catalog.selected) this.app.select(index);
      if (route!.view === "archive") this.app.returnToArchive();
      else {
        if (this.app.currentMode !== "detail") this.app.openDetail();
        if (route!.view === "read") this.reader.show(this.app.catalog.articles[index]);
      }
    } else if (this.app.currentMode !== "boot") this.app.returnToArchive();
    this.restoring = false;
    if (index < 0 && this.app.currentMode !== "boot") this.routes.save(this.route("archive"));
  }
  private async openViewer() {
    if (this.viewerLoading) return;
    this.viewerLoading = true;
    const selected = this.app.catalog.selected;
    try {
      const { ModelViewer } = await import("./rhine/model-viewer.ts");
      if (this.app.currentMode !== "detail" || this.app.catalog.selected !== selected || this.isOverlayOpen()) return;
      this.viewer ??= new ModelViewer(this.app.root, () => {});
      const article = this.app.catalog.articles[this.app.catalog.selected];
      this.viewer.open(`X-${String(this.app.catalog.selected + 1).padStart(3, "0")}`, article.title,
        () => this.app.renderingScene.createAssemblyModel(), this.app.prefs.reduced);
    } catch (error) {
      console.error("Model viewer could not open", error);
      element("#toast").textContent = "模型查看器未能载入，请重试。";
    } finally { this.viewerLoading = false; }
  }
}
