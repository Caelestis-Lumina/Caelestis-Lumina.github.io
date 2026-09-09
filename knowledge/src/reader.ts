import { Dialog } from "./dialog.ts";
import { element } from "./dom.ts";
import type { Article } from "./catalog.ts";
import { tween } from "./transition.ts";

type ReadablePage = Pick<Article, "url" | "title">;

/** Embed the real Hugo page so MathJax, code tools, anchors and comments stay intact. */
export class ArticleReader extends Dialog {
  private frame: HTMLIFrameElement;
  private status: HTMLElement;
  private loadedURL = "";
  private pendingAnchor = "";
  private timeout?: ReturnType<typeof setTimeout>;
  private connectedDocuments = new WeakSet<Document>();
  article?: ReadablePage;
  requestClose?: () => void;

  constructor(private follow: (url: URL) => void) {
    super("article-reader", "文章阅读器");
    this.root.innerHTML = `<header class="dialog-header"><div><span>READING ROOM</span><h2 id="reader-title"></h2></div>
      <div class="reader-tools"><a id="reader-original" data-view-mode="classic">切换经典视图</a><button id="reader-share">复制场景链接</button><button data-close aria-label="关闭阅读，返回档案">返回档案 <kbd>ESC</kbd></button></div></header>
      <div class="reader-status" role="status"></div><iframe id="article-frame" title="文章正文" referrerpolicy="same-origin"></iframe>`;
    this.frame = element("#article-frame", this.root);
    this.status = element(".reader-status", this.root);
    this.frame.addEventListener("load", () => this.loaded());
    window.addEventListener("message", event => {
      if (event.origin === location.origin && event.source === this.frame.contentWindow &&
        event.data?.type === "cl-knowledge-reader-ready") this.loaded();
    });
    element("#reader-share", this.root).addEventListener("click", async () => {
      const button = element<HTMLButtonElement>("#reader-share", this.root);
      try { await navigator.clipboard.writeText(location.href); button.textContent = "链接已复制"; }
      catch { button.textContent = "请复制浏览器地址栏链接"; }
    });
  }

  prepare(article: ReadablePage, anchor = "") {
    this.article = article;
    this.pendingAnchor = anchor;
    element("#reader-title", this.root).textContent = article.title;
    element<HTMLAnchorElement>("#reader-original", this.root).href = article.url;
    element("#reader-share", this.root).textContent = "复制场景链接";
    if (this.loadedURL === article.url) { this.scrollToAnchor(); return; }
    this.loadedURL = article.url;
    this.status.hidden = false;
    this.status.textContent = "正在载入正文…";
    this.frame.style.visibility = "hidden";
    const url = new URL(article.url, location.href);
    url.searchParams.set("knowledge-reader", "1");
    this.frame.src = url.href;
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.status.textContent = "内容载入较慢，请稍候，或切换经典视图继续阅读。";
    }, 15000);
  }

  show(article: ReadablePage, anchor = "") {
    this.prepare(article, anchor);
    super.open();
  }
  override close(notify = true) {
    if (notify && this.requestClose) { this.requestClose(); return; }
    super.close(notify);
  }
  async morph(origin: {left: number; top: number; width: number; height: number}, opening: boolean, reduced: boolean, signal: AbortSignal) {
    const bounds = this.root.getBoundingClientRect();
    const clamp = (value: number, size: number) => Math.max(0, Math.min(size, value));
    const insets = [clamp(origin.top - bounds.top, bounds.height), clamp(bounds.right - origin.left - origin.width, bounds.width),
      clamp(bounds.bottom - origin.top - origin.height, bounds.height), clamp(origin.left - bounds.left, bounds.width)];
    this.root.dataset.morphing = "true";
    const done = await tween(reduced ? 0 : opening ? 450 : 260, signal, progress => {
      const amount = opening ? 1 - progress : progress;
      this.root.style.clipPath = `inset(${insets.map(value => `${value * amount}px`).join(" ")})`;
      this.root.style.opacity = String(1 - amount * .7);
    });
    this.root.style.clipPath = "";
    this.root.style.opacity = "";
    delete this.root.dataset.morphing;
    return done;
  }

  private loaded() {
    const doc = this.frame.contentDocument;
    // The initial about:blank load and superseded requests are not article failures.
    if (!doc || doc.URL === "about:blank" || !this.loadedURL ||
      new URL(doc.URL).pathname !== new URL(this.loadedURL, location.href).pathname) return;
    if (!doc.querySelector("main")) {
      this.status.textContent = "内容未能载入，可以切换经典视图重试。";
      this.loadedURL = "";
      clearTimeout(this.timeout);
      return;
    }
    clearTimeout(this.timeout);
    this.status.hidden = true;
    this.frame.style.visibility = "visible";
    if (this.connectedDocuments.has(doc)) return;
    this.connectedDocuments.add(doc);
    doc.addEventListener("keydown", event => {
      if (event.key === "Escape") { event.preventDefault(); this.close(); }
    });
    doc.addEventListener("click", event => {
      const link = (event.target as HTMLElement).closest<HTMLAnchorElement>("a[href]");
      if (!link || event.defaultPrevented || event.button !== 0 || link.hasAttribute("download")) return;
      const url = new URL(link.href);
      const canonical = document.querySelector<HTMLMetaElement>('meta[name="knowledge-canonical-base"]');
      if (canonical && url.origin === new URL(canonical.content).origin && url.pathname.startsWith(new URL(canonical.content).pathname)) {
        url.protocol = location.protocol;
        url.host = location.host;
      }
      if (url.origin === location.origin && !/\.[a-z0-9]+$/i.test(url.pathname)) {
        if (url.pathname === new URL(this.article!.url, location.href).pathname && url.hash) return;
        event.preventDefault();
        this.follow(url);
      } else { link.target = "_blank"; link.rel = "noopener"; }
    });
    this.scrollToAnchor();
  }

  private scrollToAnchor() {
    if (!this.pendingAnchor) return;
    try { this.frame.contentDocument?.getElementById(decodeURIComponent(this.pendingAnchor.slice(1)))?.scrollIntoView(); }
    catch { /* Malformed external fragments do not prevent reading. */ }
    this.pendingAnchor = "";
  }
}
