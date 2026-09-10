import { Dialog } from "./dialog.ts";
import { element } from "./dom.ts";
import type { Article } from "./catalog.ts";
import { animateElement } from "./transition.ts";
import { ReaderOutline } from "./reader-outline.ts";
import { ReaderReveal } from "./reader-reveal.ts";

type ReadablePage = Pick<Article, "url" | "title"> & Partial<Pick<Article, "summary">>;

/** Embed the real Hugo page so MathJax, code tools, anchors and comments stay intact. */
export class ArticleReader extends Dialog {
  private frame: HTMLIFrameElement;
  private status: HTMLElement;
  private loadedURL = "";
  private pendingAnchor = "";
  private timeout?: ReturnType<typeof setTimeout>;
  private connectedDocuments = new WeakSet<Document>();
  private outline: ReaderOutline;
  private morphVersion = 0;
  private reveal: ReaderReveal;
  article?: ReadablePage;
  requestClose?: () => void;

  constructor(private follow: (url: URL) => void) {
    super("article-reader", "文章阅读器");
    this.root.innerHTML = `<header class="dialog-header"><div><span>READING ROOM</span><h2 id="reader-title"></h2></div>
      <div class="reader-tools"><button id="reader-outline-toggle" aria-expanded="true" aria-controls="reader-outline">目录</button><button id="reader-expand" aria-pressed="false" title="铺满浏览器窗口">全屏阅读</button><a id="reader-original" data-view-mode="classic">切换经典视图</a><button id="reader-share">复制场景链接</button><button data-close aria-label="关闭阅读，返回档案">返回档案 <kbd>ESC</kbd></button></div></header>
      <div class="reader-status" role="status"></div><div class="reader-body"><aside id="reader-outline"><h3>文章目录</h3><nav aria-label="文章目录"></nav></aside><div class="reader-page"><iframe id="article-frame" title="文章正文" referrerpolicy="same-origin"></iframe><div class="reader-reveal" aria-hidden="true" hidden></div></div></div>`;
    this.frame = element("#article-frame", this.root);
    this.status = element(".reader-status", this.root);
    this.outline = new ReaderOutline(element('#reader-outline nav', this.root));
    this.reveal = new ReaderReveal(element('.reader-reveal', this.root));
    element('#reader-expand', this.root).addEventListener('click', () => {
      const expanded = this.root.dataset.expanded !== 'true';
      this.root.dataset.expanded = String(expanded);
      const button = element('#reader-expand', this.root);
      button.setAttribute('aria-pressed', String(expanded));
      button.textContent = expanded ? '退出全屏' : '全屏阅读';
    });
    element('#reader-outline-toggle', this.root).addEventListener('click', () => {
      const outline = element('#reader-outline', this.root);
      outline.hidden = !outline.hidden;
      element('#reader-outline-toggle', this.root).setAttribute('aria-expanded', String(!outline.hidden));
    });
    this.frame.addEventListener("load", () => this.loaded(true));
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
    this.reveal.start(article.title, article.summary || '', document.documentElement.dataset.reduced === 'true' || matchMedia('(prefers-reduced-motion: reduce)').matches);
    this.loadedURL = article.url;
    this.outline.clear();
    this.status.hidden = false;
    this.status.textContent = "正在载入正文…";
    this.frame.style.visibility = "hidden";
    this.frame.dataset.ready = 'false';
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
    this.reveal.finish();
    if (notify && this.requestClose) { this.requestClose(); return; }
    super.close(notify);
  }
  async morph(origin: {left: number; top: number; width: number; height: number}, opening: boolean, reduced: boolean, signal: AbortSignal) {
    const version = ++this.morphVersion;
    const bounds = this.root.getBoundingClientRect();
    const dx = origin.left + origin.width / 2 - bounds.left - bounds.width / 2;
    const dy = origin.top + origin.height / 2 - bounds.top - bounds.height / 2;
    const paper = {transform: `translate(${dx}px, ${dy}px) scale(${Math.max(.01, origin.width / bounds.width)}, ${Math.max(.01, origin.height / bounds.height)})`, opacity: 0};
    const page = {transform: 'none', opacity: 1};
    this.root.dataset.morphing = "true";
    this.root.inert = true;
    const done = await animateElement(this.root, opening ? [paper, page] : [page, paper], reduced ? 0 : opening ? 360 : 240, signal);
    if (version === this.morphVersion) { delete this.root.dataset.morphing; this.root.inert = false; }
    return done;
  }

  private loaded(complete = false) {
    const doc = this.frame.contentDocument;
    // The initial about:blank load and superseded requests are not article failures.
    if (!doc || doc.URL === "about:blank" || !this.loadedURL ||
      new URL(doc.URL).pathname !== new URL(this.loadedURL, location.href).pathname) return;
    if (!doc.querySelector("main")) {
      this.reveal.finish();
      this.status.textContent = "内容未能载入，可以切换经典视图重试。";
      this.loadedURL = "";
      clearTimeout(this.timeout);
      return;
    }
    // Footer handshake means usable HTML; the iframe load event means loading has completed.
    // Cached documents may already be complete when their queued handshake arrives.
    if (complete || doc.readyState === 'complete') this.reveal.finish();
    clearTimeout(this.timeout);
    this.status.hidden = true;
    this.frame.style.visibility = "visible";
    this.frame.dataset.ready = 'true';
    this.outline.connect(doc);
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
