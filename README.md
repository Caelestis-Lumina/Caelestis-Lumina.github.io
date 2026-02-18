# Full-Stack Blog (Hugo + PaperMod + GitHub Pages)

基于 Hugo 与 PaperMod 的技术博客模板，支持 Markdown 写作与 GitHub Actions 自动部署到 GitHub Pages。

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

1. 安装 Hugo（Extended 版本，推荐 `>= 0.140`）。
2. 初始化主题 submodule：

   ```bash
   git submodule update --init --recursive
   ```

3. 启动本地预览：

   ```bash
   hugo server -D
   ```

4. 浏览器打开 `http://localhost:1313/`。

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
hugo server -D

# 4) 提交并推送（触发部署）
git add .
git commit -m "init blog with Hugo + PaperMod"
git push origin main
```
