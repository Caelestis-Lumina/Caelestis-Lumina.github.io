import { Dialog } from "./dialog.ts";
import { element, escapeHTML } from "./dom.ts";
import { rootColumn, searchArticles, type Article } from "./catalog.ts";

export class ArchiveSearch extends Dialog {
  private query: HTMLInputElement;
  private column: HTMLSelectElement;
  private results: HTMLElement;
  constructor(private articles: Article[], private choose: (article: Article) => void) {
    super("archive-search", "检索知识档案");
    this.root.innerHTML = `<header class="dialog-header"><div><span>ARCHIVE INDEX</span><h2>检索知识档案</h2></div><button data-close aria-label="关闭搜索">关闭 <kbd>ESC</kbd></button></header>
      <div class="search-controls"><label>全文搜索<input id="archive-search" type="search" placeholder="标题、正文、标签…" autocomplete="off"></label>
      <label>专栏<select id="search-column"><option value="">全部专栏</option>${[...new Set(articles.map(rootColumn))].sort().map(c => `<option>${escapeHTML(c)}</option>`).join("")}</select></label></div>
      <p class="search-count" role="status"></p><div class="search-results"></div>`;
    this.query = element("#archive-search", this.root);
    this.column = element("#search-column", this.root);
    this.results = element(".search-results", this.root);
    this.query.addEventListener("input", () => this.render());
    this.column.addEventListener("change", () => this.render());
    this.root.addEventListener("click", event => {
      const target = (event.target as HTMLElement).closest<HTMLElement>("[data-result]");
      if (!target) return;
      const article = this.articles[Number(target.dataset.result)];
      this.close();
      this.choose(article);
    });
    this.query.addEventListener("keydown", event => {
      if (event.key === "ArrowDown") { event.preventDefault(); this.results.querySelector<HTMLButtonElement>("button")?.focus(); }
      if (event.key === "Enter") { event.preventDefault(); this.results.querySelector<HTMLButtonElement>("button")?.click(); }
    });
    this.results.addEventListener("keydown", event => {
      if (!["ArrowDown", "ArrowUp"].includes(event.key)) return;
      event.preventDefault();
      const buttons = [...this.results.querySelectorAll<HTMLButtonElement>("button")];
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
      buttons[Math.max(0, Math.min(buttons.length - 1, index + (event.key === "ArrowDown" ? 1 : -1)))]?.focus();
    });
  }
  override open() { this.render(); super.open(); this.query.focus(); }
  private render() {
    const matches = searchArticles(this.articles, this.query.value, this.column.value);
    const shown = matches.slice(0, 150);
    element(".search-count", this.root).textContent = `${matches.length} 篇文章${matches.length > shown.length ? " · 显示前 150 篇，请继续缩小搜索范围" : ""}`;
    this.results.innerHTML = shown.length ? shown.map(article => `<button data-result="${this.articles.indexOf(article)}">
      <span class="result-meta">${escapeHTML(rootColumn(article))} / ${article.date}</span><strong>${escapeHTML(article.title)}</strong>
      <span class="result-summary">${escapeHTML(article.summary)}</span><span class="result-open">定位档案 ↗</span></button>`).join("") :
      '<p class="search-empty">没有找到匹配的档案。试试更短的关键词，或切换到全部专栏。</p>';
  }
}
