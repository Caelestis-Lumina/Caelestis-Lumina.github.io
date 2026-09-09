import type { Article, SitePage } from "./catalog.ts";

export type SiteDestination =
  | {kind: "article"; article: Article; anchor: string}
  | {kind: "home"}
  | {kind: "index"; column?: string; tag?: string; query?: string}
  | {kind: "page"; page: SitePage; anchor: string};

/** Match Hugo's actual permalinks, including Unicode terms and project-site prefixes. */
export function resolveDestination(url: URL, base: URL, articles: Article[], pages: SitePage[]): SiteDestination | null {
  if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) return null;
  const normalize = (path: string) => { try { return decodeURIComponent(path).replace(/\/$/, ""); } catch { return path; } };
  const path = normalize(url.pathname);
  const article = articles.find(a => normalize(a.url) === path);
  if (article) return {kind: "article", article, anchor: url.hash};
  const relative = url.pathname.slice(base.pathname.length).replace(/\/$/, "");
  if (!relative || relative === "classic") return {kind: "home"};
  if (["posts", "search", "columns", "tags"].includes(relative))
    return {kind: "index", query: url.searchParams.get("q") || ""};
  const page = pages.find(p => normalize(p.url) === path);
  if (page?.kind === "columns") {
    const column = articles.flatMap(a => a.columns).find(c => c.toLocaleLowerCase() === page.term.toLocaleLowerCase());
    return column ? {kind: "index", column} : {kind: "page", page, anchor: url.hash};
  }
  if (page?.kind === "tags") {
    const tag = articles.flatMap(a => a.tags).find(t => t.toLocaleLowerCase() === page.term.toLocaleLowerCase());
    return tag ? {kind: "index", tag} : {kind: "page", page, anchor: url.hash};
  }
  return page ? {kind: "page", page, anchor: url.hash} : null;
}
