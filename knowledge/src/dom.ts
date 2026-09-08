export function element<T extends HTMLElement = HTMLElement>(selector: string, parent: ParentNode = document): T {
  const node = parent.querySelector<T>(selector);
  if (!node) throw new Error(`Missing interface element: ${selector}`);
  return node;
}
export function escapeHTML(text: string): string {
  return text.replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"})[c]!);
}
export function siteURL(path: string): string {
  const base = new URL(element<HTMLMetaElement>('meta[name="knowledge-base"]').content, location.href);
  return new URL(path, base).href;
}
