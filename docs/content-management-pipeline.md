# 博文、专栏与标签维护流程

本文记录本博客在本地新增、修改、删除博文（Posts）、专栏（Columns）和标签（Tags）的标准流程。

## 1. 基本原理

- 博文按英文知识树存放在 `content/posts/` 的多级目录中，每篇博文对应一个 Markdown 文件。
- Columns 由最末级目录中的 `_index.md` 通过 Hugo `cascade` 统一提供；普通文章不再重复填写 `columns`。
- Tags 仍由每篇文章 front matter 中的 `tags` 字段维护。
- `hugo.toml` 固定使用 `/posts/:contentbasename/` 作为文章永久链接，因此在 Columns 目录间移动文章不会改变已发布 URL。
- 标签使用 `tags` 字段，不区分层级。
- 文章标题、章节层级、公式说明和术语排版遵循 [文章写作与排版规范](article-style-guide.md)。
- 修改内容后，本地 Hugo 会自动刷新；推送到 `main` 后由 GitHub Actions 构建并部署。

一篇文章的基本结构如下：

```toml
+++
title = "文章标题"
date = 2026-08-29T12:00:00+08:00
draft = false
description = "用于文章列表、搜索和 SEO 的简短摘要。"
article_status = "permanent"
applicable_versions = ["all"]
comments = true
tags = ["运动学", "机器人", "线性代数"]
+++

## 正文第一个标题

从这里开始撰写正文。
```

> `+++` 是 TOML front matter 的边界，不能遗漏。日期建议保留 `+08:00` 时区。

## 2. 新增博文

### 2.1 创建文件

在仓库根目录执行：

```powershell
New-Item -ItemType File -Path "content/posts/Robotics/Kinematics/my-new-post.md"
```

文件名建议：

- 使用简短、稳定、可读的英文小写名称。
- 用连字符或下划线分隔单词，例如 `robot-kinematics.md`。
- 目录决定 Columns，文件名决定文章 URL 的最后一级；发布后可以移动目录，但尽量不要修改文件名。

也可以直接复制一篇已有文章，再清空正文并修改 front matter。

### 2.2 填写 front matter

复制上面的基本结构并修改：

- `title`：页面显示的文章标题，可以使用中文。
- `date`：发布日期和时间。
- `draft`：写作期间设为 `true`，正式发布前改为 `false`。
- `description`：一到两句话的摘要，不建议重复标题。
- `article_status`：内容维护状态；长期有效的文章使用 `permanent`。
- `applicable_versions`：适用版本；不限定版本时使用 `["all"]`。
- `comments`：是否允许在文章底部显示 Giscus 评论区。
- Columns：不在文章中填写，由文章所在目录的 `_index.md` 自动继承，具体规则见下文。
- `tags`：与文章主题直接相关的关键词。

### 2.3 本地预览草稿

```powershell
hugo server -D --port 1314
```

浏览器打开：

```text
http://localhost:1314/
```

`-D` 会让草稿文章也出现在本地站点中。如果 1314 端口被占用，可以换成其他端口。

### 2.4 正式发布

确认文章无误后，将：

```toml
draft = false
```

改为：

```toml
draft = false
```

然后执行发布前检查和 Git 提交流程。

## 3. 修改博文

直接编辑对应的 `content/posts/**/*.md` 文件并保存。Hugo 本地服务器通常会自动刷新页面。

如果修改标题、摘要或标签，只需更新文章顶部的 front matter。要修改专栏，应把文章移动到新的 Columns 目录；搜索索引、文章列表、专栏页和标签页会在构建时自动更新。

如果必须修改已经发布的文件名，应同时检查：

- 其他文章中是否存在指向旧 URL 的链接。
- README 或外部文档中是否引用了旧 URL。
- 是否需要为旧地址配置重定向。

## 4. 删除博文

先确认目标文件，再删除，例如：

```powershell
Get-Item -LiteralPath "content/posts/Robotics/Kinematics/my-old-post.md"
Remove-Item -LiteralPath "content/posts/Robotics/Kinematics/my-old-post.md"
```

删除后检查：

- 首页和 Posts 页面中已经没有该文章。
- 搜索结果中已经没有该文章。
- 其他文章没有继续链接到被删除的 URL。
- 仅被该文章使用的专栏或标签是否已自动消失。

如果只是暂时不希望公开，优先将 `draft` 改为 `true`，而不是删除文件。

## 5. 新增或调整 Columns

### 5.1 目录与 Columns 的关系

文章文件只负责正文和文章级元数据，Columns 由同目录的 `_index.md` 集中声明。例如：

```text
content/posts/
└── Robotics/
    └── Dynamics/
        └── Parameter-Identification/
            ├── _index.md
            └── Dynamic_Parameter_Identification.md
```

对应的 `_index.md` 内容为：

```toml
+++
title = "Parameter Identification"
[build]
render = "never"
[cascade]
columns = [
  "Robotics",
  "Robotics/Dynamics",
  "Robotics/Dynamics/Parameter Identification"
]
+++
```

`cascade` 会把这条 Columns 路径自动提供给目录中的所有文章。`render = "never"` 避免把源码目录额外发布成一套与 Columns 重复的网页。

### 5.2 当前英文知识树

| 一级目录 / Column | 当前下级方向 | 收录范围 |
| --- | --- | --- |
| `Foundations` | Mathematics and Geometry、Theoretical Mechanics | 数学、几何和力学基础 |
| `Machine-Learning` / `Machine Learning` | 暂不细分 | 机器学习原理、模型训练、评估与实践 |
| `Robotics` | Kinematics、Statics、Dynamics | 机器人本体建模、分析与参数辨识 |
| `Perception` | Computer Vision | 视觉、点云和传感器数据处理 |
| `Localization-and-Mapping` | State Estimation、SLAM、Maps | 预留给定位、状态估计与建图 |
| `Planning` | Trajectory Planning | 路径、轨迹与任务规划 |
| `Control` | Control Fundamentals、Optimal Control、Trajectory Tracking | 闭环、优化与交互控制 |
| `Drives-and-Actuation` | Motor Control、Actuators、Power Electronics | 预留给驱动器、执行器与功率级 |
| `Embedded-Systems` | MCU、Real-Time Systems、Fieldbus | 预留给固件、实时系统和现场总线 |
| `Systems-Integration` | ROS2、Linux and Containers | 模块互联、部署和整机联调 |
| `Software-Engineering` | C++、Testing、Tooling | 软件质量、工具链和性能工程 |

没有文章的预留方向不需要创建空目录；第一次加入相关文章时再创建对应目录和 `_index.md`。

机器学习专栏已建立 `content/posts/Machine-Learning/_index.md`。将文章 Markdown 放入该目录即可自动继承 `Machine Learning`，无需在文章中重复填写 `columns`。当前没有正式文章，经典专栏列表和三维档案列会在加入第一篇非草稿文章后自动显示该专栏。

### 5.3 新增文章到现有 Column

直接在目标最末级目录中创建 Markdown 文件，无需填写 `columns`：

```powershell
New-Item -ItemType File -Path "content/posts/Robotics/Kinematics/jacobian-basics.md"
```

### 5.4 新增 Column

1. 使用纯英文目录名，单词之间用连字符，例如 `Embedded-Systems/Real-Time-Systems`。
2. 在最末级目录中创建 `_index.md`。
3. 在 `_index.md` 的 `[cascade]` 中从一级到最深层逐级列出完整 Columns 路径。
4. 把文章放入该目录，并运行 `hugo server -D` 检查 Columns 页面。

### 5.5 移动文章到另一个 Column

将 Markdown 文件移动到已经带有 `_index.md` 的目标目录即可，不要在文章内添加 `columns`。例如：

```powershell
Move-Item `
  -LiteralPath "content/posts/Robotics/Kinematics/jacobian-basics.md" `
  -Destination "content/posts/Control/Trajectory-Tracking/jacobian-basics.md"
```

全局 permalink 规则会继续使用文件名生成 URL，因此只移动目录不会改变 `/posts/jacobian-basics/`。

### 5.6 重命名或删除 Column

重命名时，同时修改英文目录名和该目录 `_index.md` 中的完整 Columns 路径。删除最后一篇文章后，可以删除对应的 `_index.md` 和空目录；下一次构建时专栏入口会自动消失。

## 6. 新增、修改或删除 Tags

### 6.1 新增标签

将标签加入文章的 `tags` 数组：

```toml
tags = ["机器人", "ROS2", "DDS"]
```

标签会自动出现在文章页和 Tags 页面中。

建议遵守以下约定：

- 同一概念始终使用同一种写法，例如固定使用 `ROS2`，不要同时出现 `ROS 2`。
- 避免过于宽泛或只使用一次且没有检索价值的标签。
- 英文缩写保持常见大小写；中文标签保持简短。

### 6.2 重命名或合并标签

先查找所有引用，例如：

```powershell
rg -n '"ROS 2"' content/posts
```

将所有文章中的旧标签统一替换为新标签。旧名称无人引用后会自动消失。

### 6.3 删除标签

从所有相关文章的 `tags` 数组中删除该名称。当引用数变为零时，对应标签页会在重新构建后消失。

文章可以没有标签，此时使用：

```toml
tags = []
```

## 7. 发布前检查

### 7.1 文章状态与评论

当前文章默认使用：

```toml
article_status = "permanent"
applicable_versions = ["all"]
comments = true
```

页面会显示 `Permanent（永久） · All versions（全部版本）`。如果某篇文章只适用于特定版本，可以改成：

```toml
article_status = "maintained"
applicable_versions = ["ROS2 Jazzy", "Ubuntu 24.04"]
```

`comments = true` 只表示该文章允许评论；站点级 Giscus 仍由 `hugo.toml` 中的 `[params.giscus]` 控制。关闭站点级 `enabled` 可以一次性隐藏所有文章的评论区。

### 7.2 构建检查

停止本地服务器不是必需的。另开一个 PowerShell 窗口，在仓库根目录执行：

```powershell
hugo --gc --minify
```

命令应正常结束且没有 `ERROR`。生成的 `public/` 是构建产物，不应手动编辑。

### 7.3 页面检查清单

至少检查：

1. 首页是否显示正确的最新文章与统计。
2. `/posts/` 是否包含目标文章。
3. 文章标题、摘要、正文、目录和路径导航是否正确。
4. `/columns/` 的专栏树是否能逐级展开和进入。
5. `/tags/` 是否显示正确的标签。
6. `/search/` 是否只返回一条对应文章记录。
7. 手机宽度下正文、目录和导航是否可用。

### 7.4 检查 Git 变更

```powershell
git status --short
git diff --check
git diff
```

确认没有误删其他文章、没有提交 `public/` 等临时构建文件，也没有意外修改主题 submodule。

## 8. 提交与部署

```powershell
git add content docs
git status --short
git commit -m "content: add or update post"
git push origin main
```

推送到 `main` 后，GitHub Actions 会自动构建并发布 GitHub Pages。可以在仓库的 Actions 页面查看部署状态。

如果本次还修改了布局、样式或配置，不要只执行 `git add content docs`；应先检查变更，再按实际文件加入暂存区，例如：

```powershell
git add hugo.toml layouts assets content docs
```

## 9. 常用排查命令

查找所有目录级 Columns 声明：

```powershell
rg -n '^columns\s*=' content/posts -g '_index.md'
```

查找所有标签声明：

```powershell
rg -n '^tags\s*=' content/posts
```

查找某个专栏或标签被哪些文章引用：

```powershell
rg -n 'Robotics/Dynamics' content/posts -g '_index.md'
```

列出全部博文文件：

```powershell
rg --files content/posts
```

查看 Hugo 版本：

```powershell
hugo version
```

如果 `hugo` 无法识别，重新打开 PowerShell，让安装程序写入的 PATH 生效；仍然无效时，检查 Hugo Extended 的安装位置是否已经加入系统 PATH。
