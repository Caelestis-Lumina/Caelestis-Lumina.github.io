import type { KnowledgeApp } from "./app.ts";
import { ArchiveSearch } from "./search.ts";
import { ArticleReader } from "./reader.ts";
import { Settings } from "./settings.ts";
import { ArchiveRoutes, parseRoute, type ArchiveRoute } from "./routes.ts";
import type { Article, SitePage } from "./catalog.ts";
import type { ModelViewer } from "./rhine/model-viewer.ts";
import { element, siteURL } from "./dom.ts";
import { resolveDestination } from "./site-navigation.ts";
import { ReadingFlow } from "./reading-flow.ts";

/** Feature coordination lives here; rendering never needs to know about URL or DOM readers. */
export class KnowledgeFeatures {
  private routes = new ArchiveRoutes();
  private search: ArchiveSearch;
  private reader: ArticleReader;
  private settings: Settings;
  private viewer?: ModelViewer;
  private viewerLoading = false;
  private restoring = false;
  private flow: ReadingFlow;
  private navigationId = 0;

  constructor(private app: KnowledgeApp, private pages: SitePage[]) {
    this.search = new ArchiveSearch(app.catalog.articles, article => {
      app.select(app.catalog.articles.indexOf(article));
      element(".file-title").focus();
    });
    this.reader = new ArticleReader(url => this.navigate(url));
    this.flow = new ReadingFlow(app, this.reader);
    this.reader.requestClose = () => {
      if (this.flow.active) void this.flow.close(true);
      else { this.reader.close(false); this.reader.onClose?.(); }
    };
    this.reader.onClose = () => {
      if (parseRoute(location.hash)?.page) this.routes.save(this.route(app.currentMode === "detail" ? "detail" : "archive"));
      else this.routes.closeReader(this.route("detail"));
    };
    this.search.onClose = () => this.routes.save(this.route(app.currentMode === "detail" ? "detail" : "archive"));
    this.settings = new Settings(app.prefs, () => app.applyPreferences(), () => app.replay(), () => this.navigate(new URL(siteURL("about/"))));
    app.registerActions(action => this.action(action), () => this.isOverlayOpen());
    app.suspendScene = () => !this.flow.busy && this.isOverlayOpen();
    app.onFrame = time => this.viewer?.update(time);
    window.addEventListener("resize", () => this.viewer?.resize());
    app.onStateChange = push => {
      const classic = element<HTMLAnchorElement>('[data-view-mode="classic"]', app.root);
      classic.href = app.currentMode === "detail" ? app.catalog.articles[app.catalog.selected].url : siteURL("classic/");
      if (!this.restoring && app.currentMode !== "boot")
        this.routes.save(this.route(app.currentMode), push);
      if (app.currentMode === "detail") void app.renderingScene.prepareReadingAssembly().catch(() => {});
    };
    this.routes.onChange = route => this.restore(route);
    this.restore(parseRoute(location.hash));
  }

  private isOverlayOpen() { return this.flow.busy || this.search.isOpen || this.reader.isOpen || this.settings.isOpen || Boolean(this.viewer?.isOpen); }
  private route(view: ArchiveRoute["view"]): ArchiveRoute {
    return {article: this.app.catalog.articles[this.app.catalog.selected].id, view};
  }
  private action(action: string): boolean {
    if (action === "search") this.search.open();
    else if (action === "about") this.navigate(new URL(siteURL("about/")));
    else if (action.startsWith("tag:")) {
      const tag = decodeURIComponent(action.slice(4));
      const page = this.pages.find(p => p.kind === "tags" && p.term === tag);
      if (page) this.navigate(new URL(page.url, location.href));
    }
    else if (action === "settings") this.settings.open();
    else if (action === "read") this.read(this.app.catalog.articles[this.app.catalog.selected]);
    else if (action === "model-viewer") void this.openViewer();
    else return false;
    return true;
  }
  private read(article: Article, anchor = "", push = true) {
    this.navigationId++;
    this.restoring = true;
    if (this.app.catalog.articles[this.app.catalog.selected] !== article)
      this.app.select(this.app.catalog.articles.indexOf(article));
    if (this.app.currentMode !== "detail") this.app.openDetail();
    this.restoring = false;
    void this.flow.open(article, anchor);
    this.routes.save(this.route("read"), push);
  }
  private async restore(route: ArchiveRoute | null) {
    const ticket = ++this.navigationId;
    if (this.flow.active && route?.view !== "read") await this.flow.close(false);
    if (ticket !== this.navigationId) return;
    this.flow.reset();
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
        if (route!.view === "read") void this.flow.open(this.app.catalog.articles[index]);
      }
    } else if (this.app.currentMode !== "boot") this.app.returnToArchive();
    if (route?.page) {
      this.navigate(new URL(route.page, location.href), false);
      this.restoring = false;
      return;
    }
    this.restoring = false;
    if (index < 0 && this.app.currentMode !== "boot") this.routes.save(this.route("archive"));
  }
  private async navigate(url: URL, push = true) {
    const ticket = ++this.navigationId;
    const destination = resolveDestination(url, new URL(siteURL("")), this.app.catalog.articles, this.pages);
    if (!destination) {
      this.search.show({query: url.pathname.split("/").filter(Boolean).at(-1) || ""});
      return;
    }
    this.search.close(false);
    if (destination.kind === "article") { this.read(destination.article, destination.anchor, push); return; }
    if (this.flow.active) await this.flow.close(false);
    if (ticket !== this.navigationId) return;
    this.reader.close(false);
    if (destination.kind === "home") { this.app.returnToArchive(); return; }
    if (destination.kind === "index") this.search.show(destination);
    else this.reader.show(destination.page, destination.anchor);
    if (push) this.routes.save({...this.route(this.app.currentMode === "detail" ? "detail" : "archive"), page: url.pathname + url.search + url.hash}, true);
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
