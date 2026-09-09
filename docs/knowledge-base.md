# 三维知识库

本轮在 `codex/rhinelab-motion` 分支开发，阶段性提交；GitHub Pages 仍只在 main 推送时部署。

## 模块边界

- Hugo：Markdown、专栏继承、文章页面和 `knowledge-index.json` 内容契约。
- `knowledge/src/catalog.ts`：内容契约校验与全文检索。
- `knowledge/src/navigation.ts`：真实文章与专栏、选择记忆、子专栏筛选。无 DOM / Three.js 依赖。
- `knowledge/src/rhine/`：来自 RhineLabUI 的模型渲染、材质、灯光与时间轴；适配范围记在来源说明中。
- `app.ts` / `selection-view.ts` / `boot-controller.ts`：场景生命周期、选中文章的展示及开场控制。
- `features.ts`：协调搜索、阅读、设置和按需加载的模型查看器。
- `reader.ts` / `dialog.ts`：同源文章阅读、模态焦点和退出操作。Hugo 页末发出就绪消息，避免等外部公式、图片和评论资源全部完成才显示正文。
- `routes.ts`：场景链接及浏览器历史。正文内换篇与关闭阅读分别处理，避免关闭时误回上一篇文章。
- `search.ts` / `settings.ts` / `preferences.ts`：搜索界面、显示设置及可失效的本地偏好存储。

## 构建

需要 Node.js 24、pnpm 11.19.0、Hugo Extended 0.165.0。

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm build
hugo --minify
pnpm check:site
```

本地预览先执行 `pnpm build`，再执行 `hugo server -D`。前端开发时另开终端运行 `pnpm watch`，Hugo 会监测 `static/knowledge` 的产物变动。

前端产物由 Vite 生成到 `static/knowledge`，构建清单同步写入 `data/knowledge.json` 让 Hugo 监测并引用最新散列文件名；两者都不提交。Vite 禁用默认的 `publicDir`，避免把 Hugo 的 `public` 产物递归复制进前端目录。必须先构建前端再构建 Hugo；独立文章和列表仍由原有模板生成。

Three.js 核心、渲染器、博客界面拆成不同缓存块；独立模型查看器按需载入。打开阅读、搜索、设置和模型查看器时暂停主场景绘制，页面进入后台也停止动画帧调度。

## 内容约定

一级专栏对应档案列，子专栏用于筛选；无专栏文章归到 Unfiled。文章 ID 使用已有永久链接，新增文章或调整排序不改变已有 ID。每列数量可以不同；循环的视觉副本不计入文章总数。

文章链接、日期、阅读时长、标签和专栏均来自 Hugo；不复制维护第二份文章。搜索索引包含全文，正文在用户打开阅读器时加载。

## 操作

- 左右方向键切专栏，上下方向键翻阅；每列保留本次访问的选择。子专栏筛选只影响当前列。
- Enter / ACCESS FILE 抽取档案，展开阅读打开完整正文，Esc 逐层返回。
- `/` 打开全文检索；输入多个词表示同时匹配。选中搜索结果后在阵列中定位，再抽取阅读。
- 360° 查看器支持拖动、缩放、拆解和重组。
- 首次完成资源载入后播放开场，支持跳过和重播；记录已访问状态。减少动态效果会跳过开场，系统偏好始终优先。
- 阅读器可复制场景链接；独立文章永久链接继续有效。前进/后退可以恢复阅读与摘要状态。

## 验证

`pnpm test` 覆盖不等长专栏、单篇专栏、首尾循环、筛选、全文搜索、超过 32 篇的列、288 个渲染槽位、场景链接及阅读历史。

`pnpm check:site` 检查真实 Hugo 产物：所有文章页面和阅读器就绪信号、散列资源、GLB 完整性、原有列表/标签/搜索路由及首页结构化数据。可传入构建目录，例如 `pnpm check:site .verification/production`。

2026-09-09 浏览器验证：原版模型与阵列、切列和单篇列、搜索“牛顿 汇总”、公式阅读、正文内换篇、关闭返回对应档案、浏览器前进/后退、直接阅读链接、模型拆解/重组/退出、子专栏筛选、画质和减少动态效果设置。

桌面优先，尚未做移动端专用交互。MiSans 两个原始字重合计约 9.94 MB，两个 GLB 合计约 2.72 MB；首访资源体积是保留原版资产的代价。MathJax 和评论仍沿用博客现有的外部服务；它们失败时不阻止正文显示。WebGL 初始化失败或未启用 JavaScript 时提供普通文章入口。
