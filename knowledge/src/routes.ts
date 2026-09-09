export type ArchiveRoute = { article: string; view: "archive" | "detail" | "read"; page?: string };
export function parseRoute(hash: string): ArchiveRoute | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const article = params.get("article");
  const view = params.get("view");
  const page = params.get("page");
  if (page?.startsWith("/") && !page.startsWith("//") && view === "page")
    return {article: article || "", view: "archive", page};
  return article && (view === "archive" || view === "detail" || view === "read") ? {article, view} : null;
}
export function routeHash(route: ArchiveRoute): string {
  return "#" + new URLSearchParams(route.page ? {...route, view: "page"} : route).toString();
}

export class ArchiveRoutes {
  onChange?: (route: ArchiveRoute | null) => void;
  constructor() { window.addEventListener("popstate", () => this.onChange?.(parseRoute(location.hash))); }
  save(route: ArchiveRoute, push = false) {
    const hash = routeHash(route);
    if (hash === location.hash) return;
    const previous = parseRoute(location.hash);
    const canReturn = push && route.view === "read" && previous?.view === "detail" && previous.article === route.article;
    history[push ? "pushState" : "replaceState"]({knowledgeRead: canReturn}, "", hash);
  }
  closeReader(route: ArchiveRoute) {
    if (history.state?.knowledgeRead) history.back();
    else this.save({...route, view: "detail"});
  }
}
