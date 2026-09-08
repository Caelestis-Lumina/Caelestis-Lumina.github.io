# 三维知识库

本轮在 `codex/rhinelab-motion` 分支开发，阶段性提交；GitHub Pages 仍只在 main 推送时部署。

## 模块边界

- Hugo：Markdown、专栏继承、文章页面和 `knowledge-index.json` 内容契约。
- `knowledge/src/catalog.ts`：内容契约校验与全文检索。
- `knowledge/src/navigation.ts`：真实文章与专栏、选择记忆、子专栏筛选。无 DOM / Three.js 依赖。
- `knowledge/src/rhine/`：来自 RhineLabUI 的模型渲染、材质、灯光与时间轴；适配范围记在来源说明中。
- 界面控制、阅读器、地址状态各自独立；场景不承担文章渲染。

## 构建

需要 Node.js 24、pnpm 11.19.0、Hugo Extended 0.165.0。

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm build
hugo --minify
```

本地预览先执行 `pnpm build`，再执行 `hugo server -D`。前端开发时另开终端运行 `pnpm watch`，Hugo 会监测 `static/knowledge` 的产物变动。

前端产物由 Vite 生成到 `static/knowledge`，不提交生成文件。必须先构建前端再构建 Hugo；独立文章和列表仍由原有模板生成。

## 内容约定

一级专栏对应档案列，子专栏用于筛选；无专栏文章归到 Unfiled。文章 ID 使用已有永久链接，新增文章或调整排序不改变已有 ID。每列数量可以不同；循环的视觉副本不计入文章总数。

文章链接、日期、阅读时长、标签和专栏均来自 Hugo；不复制维护第二份文章。搜索索引包含全文，正文在用户打开阅读器时加载。
