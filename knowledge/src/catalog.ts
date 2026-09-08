/** Hugo owns content rendering; the 3D application consumes only this contract. */
export interface Article {
  id: string;
  title: string;
  url: string;
  summary: string;
  content: string;
  columns: string[];
  tags: string[];
  date: string;
  minutes: number;
}

export interface Catalog {
  version: 1;
  articles: Article[];
}

export function parseCatalog(input: unknown): Catalog {
  if (!input || typeof input !== "object") throw new Error("Invalid catalog");
  const catalog = input as Catalog;
  if (catalog.version !== 1 || !Array.isArray(catalog.articles))
    throw new Error("Unsupported catalog version");
  const ids = new Set<string>();
  for (const article of catalog.articles) {
    if (!article || ["id", "title", "url", "summary", "content", "date"].some(
      key => typeof article[key as keyof Article] !== "string",
    ) || !article.id || !article.title || !article.url.startsWith("/") || article.url.startsWith("//") ||
      !Array.isArray(article.columns) || !article.columns.every(c => typeof c === "string" && c.trim()) ||
      !Array.isArray(article.tags) || !article.tags.every(t => typeof t === "string") ||
      !Number.isFinite(article.minutes) || ids.has(article.id))
      throw new Error("Invalid or duplicate article in catalog");
    ids.add(article.id);
  }
  if (!catalog.articles.length) throw new Error("The knowledge base has no published articles");
  return catalog;
}

export function rootColumn(article: Article): string {
  return article.columns[0]?.split("/")[0] || "Unfiled";
}

export function matchesColumn(article: Article, path: string): boolean {
  return !path || article.columns.some(c => c === path || c.startsWith(path + "/"));
}

export function searchArticles(articles: Article[], query: string, column = ""): Article[] {
  const words = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return articles.filter(article => matchesColumn(article, column) && words.every(word =>
    [article.title, article.summary, article.content, ...article.tags, ...article.columns]
      .join(" ").toLocaleLowerCase().includes(word),
  ));
}
