import "@kitlangton/rolling-number/styles.css";
import "./rhine/reference.css";
import "./styles.css";
import { parseCatalog } from "./catalog.ts";
import { KnowledgeApp } from "./app.ts";
import { element, siteURL } from "./dom.ts";

async function start() {
  try {
    const response = await fetch(element<HTMLMetaElement>('meta[name="knowledge-index"]').content);
    if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
    const app = new KnowledgeApp(parseCatalog(await response.json()));
    await app.start();
  } catch (error) {
    console.error("Knowledge base could not start", error);
    const host = document.querySelector("#loading") || element("#stage");
    host.classList.remove("loaded");
    host.innerHTML = '<div class="error-state"><h2>暂时无法打开三维知识库</h2><p>可以重新连接，或继续浏览完整的文章列表。</p><button onclick="location.reload()">重新连接 ↗</button> <a>浏览文章 ↗</a></div>';
    element<HTMLAnchorElement>("a", host).href = siteURL("posts/");
  }
}
void start();
