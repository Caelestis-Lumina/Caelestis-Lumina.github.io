# Full-Stack Blog (Hugo + PaperMod + GitHub Pages)

基于 Hugo 与 PaperMod 的技术博客，支持 Markdown 写作与 GitHub Actions 自动部署到 GitHub Pages。首页为基于 RhineLabUI 资产构建的三维知识库；独立文章、专栏树与标签页继续使用 Hugo 模板。

三维模块、内容契约、操作方式与验证记录见 [三维知识库说明](docs/knowledge-base.md)，资产来源见 [SOURCES](knowledge/SOURCES.md)。

## 注意事项

博文中，井号标题和加粗符号和公式不能同时出现在同一语句中，否则会导致构建报错

## 项目结构

```text
.
├── .github/workflows/pages.yml
├── .gitmodules
├── assets/css/extended/custom.css
├── content
│   ├── _index.md
│   ├── about.md
│   └── posts/hello.md
├── hugo.toml
└── themes/PaperMod   # git submodule
```

## 本地运行

1. 安装 Hugo Extended 0.165.0、Node.js 24 和 pnpm 11.19.0，与部署流水线保持一致。
2. 初始化主题 submodule：

   ```bash
   git submodule update --init --recursive
   ```

3. 构建三维界面并启动本地预览：

   ```bash
   pnpm install --frozen-lockfile
   pnpm test
   pnpm build
   hugo server -D
   ```

4. 浏览器打开 `http://localhost:1313/`。前端开发时可另开终端运行 `pnpm watch`。

## 多级专栏

文章可以通过斜杠设置多级专栏。为保证每一级都能独立访问，请从父级到叶级依次填写：

```toml
columns = ["控制", "控制/机器人学", "控制/机器人学/动力学"]
```

文章页会显示可逐级返回的专栏路径，`/columns/` 页面会自动生成可折叠的完整专栏树。

## 部署到 GitHub Pages

1. 打开仓库 `Settings -> Pages`。
2. 在 `Build and deployment` 中选择 `Source: GitHub Actions`。
3. 推送到 `main` 分支后自动触发部署。
4. 也可在 `Actions` 页面手动触发 `workflow_dispatch`。

## 个人站 vs 项目站

- 个人站（当前配置）：
  - URL: `https://Caelestis-Lumina.github.io/`
  - `hugo.toml`:

    ```toml
    baseURL = "https://Caelestis-Lumina.github.io/"
    ```

- 项目站（若仓库名不是 `Caelestis-Lumina.github.io`）：
  - URL: `https://Caelestis-Lumina.github.io/<repo>/`
  - 将 `hugo.toml` 改为：

    ```toml
    baseURL = "https://Caelestis-Lumina.github.io/<repo>/"
    ```

## 自定义域名（可选）

1. 在仓库 `Settings -> Pages` 配置 `Custom domain`。
2. 在仓库根目录添加 `CNAME` 文件，内容为你的域名（例如 `blog.example.com`）。
3. 同步更新 `hugo.toml` 的 `baseURL` 为你的自定义域名。

## 从 0 到上线（最短命令清单）

```bash
# 1) 克隆仓库
git clone https://github.com/Caelestis-Lumina/Caelestis-Lumina.github.io.git
cd Caelestis-Lumina.github.io

# 2) 拉取主题
git submodule update --init --recursive

# 3) 本地预览（可选）
pnpm install --frozen-lockfile
pnpm build
hugo server -D

# 4) 提交并推送（触发部署）
git add .
git commit -m "init blog with Hugo + PaperMod"
git push origin main
```
