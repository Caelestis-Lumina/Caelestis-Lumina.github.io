import "@kitlangton/rolling-number/styles.css";
import "./rhine/reference.css";
import "./styles.css";
import "./workspace.css";
import { parseCatalog } from "./catalog.ts";
import { KnowledgeApp } from "./app.ts";
import { element, siteURL } from "./dom.ts";
import { KnowledgeFeatures } from "./features.ts";

async function start() {
  try {
    const response = await fetch(element<HTMLMetaElement>('meta[name="knowledge-index"]').content);
    if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
    const catalog = parseCatalog(await response.json());
    const app = new KnowledgeApp(catalog);
    await app.start();
    new KnowledgeFeatures(app, catalog.pages || []);
  } catch (error) {
    console.error("Knowledge base could not start", error);
    const host = document.querySelector("#loading") || element("#stage");
    host.classList.remove("loaded");
    host.innerHTML = '<div class="error-state"><h2>暂时无法打开三维知识库</h2><p>可以重新连接，或切换到经典视图继续浏览。</p><button onclick="location.reload()">重新连接 ↗</button> <a data-view-mode="classic">切换经典视图 ↗</a></div>';
    element<HTMLAnchorElement>("a", host).href = siteURL("classic/");
  }
}
void start();
