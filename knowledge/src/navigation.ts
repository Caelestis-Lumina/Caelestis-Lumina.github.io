import { rootColumn, matchesColumn, type Article } from "./catalog.ts";

export const wrap = (value: number, count: number) => ((value % count) + count) % count;

/** Content indices are stable. Visual positions may repeat to form an endless array. */
export class ArchiveCatalog {
  readonly columns: string[];
  private lanes: number[][];
  private memory = new Map<number, number>();
  private filters = new Map<number, string>();
  selected = 0;
  readonly articles: Article[];

  constructor(articles: Article[]) {
    this.articles = articles;
    if (!articles.length) throw new Error("Cannot navigate an empty catalog");
    this.columns = [...new Set(articles.map(rootColumn))].sort();
    this.lanes = this.columns.map(column => articles.flatMap((a, i) => rootColumn(a) === column ? [i] : []));
    this.lanes.forEach((files, lane) => this.memory.set(lane, files[0]));
  }

  files(lane: number): number[] {
    const normalized = wrap(lane, this.columns.length);
    return this.lanes[normalized].filter(i => matchesColumn(this.articles[i], this.filters.get(normalized) || ""));
  }

  location(index: number) {
    const lane = this.columns.indexOf(rootColumn(this.articles[index]));
    return { lane, row: 12 + this.files(lane).indexOf(index) };
  }

  select(index: number): number {
    if (!this.articles[index]) throw new Error("Unknown archive");
    const lane = this.columns.indexOf(rootColumn(this.articles[index]));
    if (!this.files(lane).includes(index)) this.filters.delete(lane);
    this.selected = index;
    this.memory.set(lane, index);
    return index;
  }

  stepRow(direction: number): number {
    const files = this.files(this.location(this.selected).lane);
    return this.select(files[wrap(files.indexOf(this.selected) + direction, files.length)]);
  }

  stepLane(direction: number): number {
    const lane = wrap(this.location(this.selected).lane + direction, this.columns.length);
    const files = this.files(lane);
    const remembered = this.memory.get(lane)!;
    return this.select(files.includes(remembered) ? remembered : files[0]);
  }

  filter(lane: number, path: string): boolean {
    // Reject empty results before mutating the scene's data source.
    if (!this.lanes[lane]?.some(i => matchesColumn(this.articles[i], path))) return false;
    this.filters.set(lane, path);
    if (this.location(this.selected).lane === lane && !this.files(lane).includes(this.selected))
      this.select(this.files(lane)[0]);
    return true;
  }

  filterPath(lane: number): string { return this.filters.get(lane) || ""; }
  subcolumns(lane: number): string[] {
    return [...new Set(this.lanes[lane].flatMap(i => this.articles[i].columns))]
      .filter(c => c.includes("/")).sort();
  }
}
