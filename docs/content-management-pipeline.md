# 博文、专栏与标签维护流程

本文记录本博客在本地新增、修改、删除博文（Posts）、专栏（Columns）和标签（Tags）的标准流程。

## 1. 基本原理

- 博文文件位于 `content/posts/`，每篇博文对应一个 Markdown 文件。
- 专栏和标签不是单独维护的数据文件，而是 Hugo 根据每篇博文顶部的 front matter 自动汇总生成。
- 专栏使用 `columns` 字段，并通过 `/` 表示层级。
- 标签使用 `tags` 字段，不区分层级。
- 修改内容后，本地 Hugo 会自动刷新；推送到 `main` 后由 GitHub Actions 构建并部署。

一篇文章的基本结构如下：

```toml
+++
title = "文章标题"
date = 2026-08-29T12:00:00+08:00
draft = true
description = "用于文章列表、搜索和 SEO 的简短摘要。"
article_status = "permanent"
applicable_versions = ["all"]
comments = true
columns = ["机器人学", "机器人学/运动学"]
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
New-Item -ItemType File -Path "content/posts/my-new-post.md"
```

文件名建议：

- 使用简短、稳定、可读的英文小写名称。
- 用连字符或下划线分隔单词，例如 `robot-kinematics.md`。
- 文件名将影响文章 URL；发布后尽量不要修改，以免旧链接失效。

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
- `columns`：文章所属的专栏路径，具体规则见下文。
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
draft = true
```

改为：

```toml
draft = false
```

然后执行发布前检查和 Git 提交流程。

## 3. 修改博文

直接编辑对应的 `content/posts/*.md` 文件并保存。Hugo 本地服务器通常会自动刷新页面。

如果只修改标题、摘要、专栏或标签，只需更新文章顶部的 front matter；搜索索引、文章列表、专栏页和标签页会在构建时自动更新。

如果必须修改已经发布的文件名，应同时检查：

- 其他文章中是否存在指向旧 URL 的链接。
- README 或外部文档中是否引用了旧 URL。
- 是否需要为旧地址配置重定向。

## 4. 删除博文

先确认目标文件，再删除，例如：

```powershell
Get-Item -LiteralPath "content/posts/my-old-post.md"
Remove-Item -LiteralPath "content/posts/my-old-post.md"
```

删除后检查：

- 首页和 Posts 页面中已经没有该文章。
- 搜索结果中已经没有该文章。
- 其他文章没有继续链接到被删除的 URL。
- 仅被该文章使用的专栏或标签是否已自动消失。

如果只是暂时不希望公开，优先将 `draft` 改为 `true`，而不是删除文件。

## 5. 新增或调整 Columns

### 5.1 新增一级专栏

在文章 front matter 中加入：

```toml
columns = ["嵌入式"]
```

只要至少一篇非草稿文章引用它，Hugo 就会自动生成对应的专栏入口。

### 5.2 推荐的机器人全栈知识树

Columns 表示一篇文章在知识体系中的主要位置，Tags 表示可以跨越不同方向的关键词。每篇文章原则上只选择一条最主要的 Columns 路径，避免同一篇文章在多个树枝中重复出现。

| 一级专栏 | 建议的下级方向 | 收录范围 |
| --- | --- | --- |
| 理论基础 | 数学与几何、概率与估计、理论力学 | 跨模块复用的数学、几何和力学基础 |
| 机器人学 | 运动学、静力学、动力学 | 机器人本体的建模、分析与参数辨识 |
| 感知 | 计算机视觉、点云、传感器融合 | 从传感器数据中获取环境与目标信息 |
| 定位与建图 | 状态估计、SLAM、地图 | 位姿估计、定位、建图与多传感器融合 |
| 规划 | 路径规划、轨迹规划、任务规划 | 从任务目标到可执行路径和轨迹 |
| 控制 | 控制基础、最优控制、轨迹跟踪、柔顺控制 | 闭环控制、优化控制与机器人交互控制 |
| 驱动与执行 | 电机控制、执行器、功率电子 | 从控制指令到机械运动的执行链路 |
| 嵌入式 | MCU、实时系统、通信总线 | 底层硬件、固件、实时性和现场总线 |
| 系统集成 | ROS2、Linux 与容器、通信与部署 | 模块互联、运行环境、部署和整机联调 |
| 软件工程 | C++、测试、工具链、性能优化 | 支撑机器人软件质量和可维护性的通用工程能力 |

这是一棵长期使用的知识树，不要求立刻填满。Hugo 只会展示至少被一篇文章引用的专栏，因此暂时没有文章的“定位与建图”“驱动与执行”“嵌入式”等方向不会出现空白入口；以后新增相关文章时，按上表建立路径即可。

### 5.3 新增多级专栏

本博客要求从父级到最深层级逐级列出完整路径。例如文章属于“机器人学 → 动力学 → 参数辨识”：

```toml
columns = [
  "机器人学",
  "机器人学/动力学",
  "机器人学/动力学/参数辨识"
]
```

不要只写：

```toml
columns = ["机器人学/动力学/参数辨识"]
```

否则父级节点可能缺少独立的聚合信息，专栏树、逐级进入和路径导航的表现可能不完整。

### 5.4 将文章移动到另一个专栏

替换该文章的整个 `columns` 数组。例如移动到“系统集成 → ROS2 → 通信与中间件”：

```toml
columns = [
  "系统集成",
  "系统集成/ROS2",
  "系统集成/ROS2/通信与中间件"
]
```

### 5.5 重命名或删除专栏

专栏没有独立的删除按钮。需要在所有文章中修改或移除对应路径。

先查找引用：

```powershell
rg -n '机器人学/运动学' content/posts
```

然后逐篇修改 `columns`。当没有任何文章引用某个专栏名称时，该专栏会在下一次构建时自动消失。

重命名多级专栏时，必须同步修改所有后代路径。例如把 `机器人学/动力学` 改为 `机器人学/动力学建模`，也要修改：

```text
机器人学/动力学/牛顿-欧拉法
机器人学/动力学/参数辨识
```

否则 Hugo 会把新旧名称视为不同的专栏分支。

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

查找所有专栏声明：

```powershell
rg -n '^columns\s*=' content/posts
```

查找所有标签声明：

```powershell
rg -n '^tags\s*=' content/posts
```

查找某个专栏或标签被哪些文章引用：

```powershell
rg -n '机器人学' content/posts
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
