import {element, escapeHTML} from "./dom.ts";
import {ArchiveCatalog} from "./navigation.ts";
import {rootColumn} from "./catalog.ts";

/** Persistent buttons keep keyboard focus while the scene and selection animate. */
export class ColumnNavigation {
  private buttons: HTMLButtonElement[];
  constructor(private catalog: ArchiveCatalog) {
    const host = element("#column-tabs");
    host.innerHTML = catalog.columns.map((column, lane) => {
      const count = catalog.articles.filter(a => rootColumn(a) === column).length;
      return `<button data-column="${lane}" aria-pressed="false"><span class="column-order">${String(lane + 1).padStart(2, "0")}</span><strong>${escapeHTML(column)}</strong><span class="column-count">${count} 篇</span></button>`;
    }).join("");
    this.buttons = [...host.querySelectorAll<HTMLButtonElement>("button")];
  }
  update() {
    const {lane} = this.catalog.location(this.catalog.selected);
    this.buttons.forEach((button, index) => button.setAttribute("aria-pressed", String(index === lane)));
    element("#column-name").textContent = this.catalog.columns[lane];
  }
}
