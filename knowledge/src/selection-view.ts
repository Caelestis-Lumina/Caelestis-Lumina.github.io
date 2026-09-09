import { createRollingNumber } from "@kitlangton/rolling-number";
import { ScrubTitle } from "./rhine/scrub-title.ts";
import { element, escapeHTML } from "./dom.ts";
import { ArchiveCatalog } from "./navigation.ts";
import type { ArchiveNavigation } from "./rhine/archive-loop.ts";
import { ColumnNavigation } from "./column-navigation.ts";

export class SelectionView {
  private title = new ScrubTitle(element("#selected-title"));
  private number = createRollingNumber(element("#selected-number"), { value: 1, format: { minimumIntegerDigits: 2 }, duration: 460 });
  private columns: ColumnNavigation;
  private code = createRollingNumber(element("#selected-code"), { value: 1, format: { minimumIntegerDigits: 3 }, duration: 460 });
  private lastLane = -1;
  constructor(private catalog: ArchiveCatalog) { this.columns = new ColumnNavigation(catalog); }

  update(animated: boolean, navigation?: ArchiveNavigation) {
    const { selected, articles, columns } = this.catalog;
    const article = articles[selected];
    const { lane } = this.catalog.location(selected);
    const files = this.catalog.files(lane);
    const direction = navigation && "axis" in navigation ? navigation.direction > 0 ? "up" : "down" : "auto";
    this.title.update(article.title, animated);
    this.code.update({ value: selected + 1, animated, direction });
    this.number.update({ value: files.indexOf(selected) + 1, animated, direction });
    this.columns.update();
    element("#selected-clearance").textContent = `${article.minutes} MIN READ`;
    element("#archive-category").textContent = columns[lane];
    element(".count-total").textContent = String(files.length).padStart(2, "0");
    element("#object-id").textContent = `NO.${String(selected + 1).padStart(3, "0")}`;
    // Window the tick strip; it must not grow with the entire knowledge base.
    const position = files.indexOf(selected);
    const start = Math.max(0, Math.min(position - 4, files.length - 9));
    element("#file-ticks").innerHTML = files.slice(start, start + 9).map(index =>
      `<button data-select="${index}" class="${index === selected ? "selected" : ""}" aria-pressed="${index === selected}" aria-label="${escapeHTML(articles[index].title)}" title="${escapeHTML(articles[index].title)}"></button>`,
    ).join("");
    const filter = element<HTMLSelectElement>("#subcolumn");
    if (lane !== this.lastLane) {
      filter.innerHTML = '<option value="">全部子专栏</option>' + this.catalog.subcolumns(lane).map(path =>
        `<option value="${escapeHTML(path)}">${escapeHTML(path.split("/").slice(1).join(" / "))}</option>`,
      ).join("");
      this.lastLane = lane;
    }
    filter.value = this.catalog.filterPath(lane);
    element<HTMLButtonElement>('[data-action="prev"]').disabled = files.length < 2;
    element<HTMLButtonElement>('[data-action="next"]').disabled = files.length < 2;
    element("#hover-label").hidden = true;
  }
  reset() { this.title.reset(); }
  detail() {
    const article = this.catalog.articles[this.catalog.selected];
    element("#detail-content").innerHTML = `
      <div class="detail-kicker"><span>KNOWLEDGE ARCHIVE</span><span>${escapeHTML(article.date)}</span></div>
      <h2>${escapeHTML(article.title)}</h2>
      <p class="detail-path">${escapeHTML(article.columns.at(-1) || "Unfiled")}</p>
      <div class="detail-rule"></div>
      <p class="article-abstract">${escapeHTML(article.summary)}</p>
      <div class="article-tags">${article.tags.map(t => `<button data-action="tag:${escapeHTML(encodeURIComponent(t))}">${escapeHTML(t)}</button>`).join("")}</div>
      <div class="article-actions"><button data-action="read">展开阅读 <span>↗</span></button>
      </div>
      <p class="reading-note">${article.minutes} 分钟阅读 · 公式、代码与完整正文</p>`;
  }
}
