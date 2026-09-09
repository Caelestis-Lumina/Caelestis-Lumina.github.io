import { Dialog } from "./dialog.ts";
import { element } from "./dom.ts";
import type { Article } from "./catalog.ts";

/** Embed the real Hugo page so MathJax, code tools, anchors and comments stay intact. */
export class ArticleReader extends Dialog {
  private frame: HTMLIFrameElement;
  private status: HTMLElement;
  private loadedURL = "";
  private pendingAnchor = "";
  private timeout?: ReturnType<typeof setTimeout>;
  private connectedDocuments = new WeakSet<Document>();
  article?: Article;

  constructor(private articles: Article[], private follow: (article: Article, anchor: string) => void) {
    super("article-reader", "文章阅读器");
    this.root.innerHTML = `<header class="dialog-header"><div><span>READING ROOM</span><h2 id="reader-title"></h2></div>
      <div class="reader-tools"><a id="reader-original" target="_blank" rel="noopener">独立文章页 ↗</a><button id="reader-share">复制场景链接</button><button data-close aria-label="关闭阅读，返回档案">返回档案 <kbd>ESC</kbd></button></div></header>
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

  show(article: Article, anchor = "") {
    this.article = article;
    this.pendingAnchor = anchor;
    element("#reader-title", this.root).textContent = article.title;
    element<HTMLAnchorElement>("#reader-original", this.root).href = article.url;
    element("#reader-share", this.root).textContent = "复制场景链接";
    super.open();
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
      this.status.textContent = "正文载入较慢，可以通过右上角的独立文章页继续阅读。";
    }, 15000);
  }

  private loaded() {
    const doc = this.frame.contentDocument;
    // The initial about:blank load and superseded requests are not article failures.
    if (!doc || doc.URL === "about:blank" || !this.loadedURL ||
      new URL(doc.URL).pathname !== new URL(this.loadedURL, location.href).pathname) return;
    if (!doc || !doc.querySelector(".post-single")) {
      this.status.textContent = "正文未能载入，请打开独立文章页。";
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
      if (!link || event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) return;
      const url = new URL(link.href);
      const article = this.articles.find(a => new URL(a.url, location.href).pathname === url.pathname);
      if (url.origin === location.origin && article) {
        if (article.url === this.article?.url && url.hash) return;
        event.preventDefault();
        this.follow(article, url.hash);
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
