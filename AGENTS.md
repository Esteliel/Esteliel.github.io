# 项目协作约束

## 适用范围与工作方式

- 本文件约束本仓库内的修改；遵循用户明确要求，更具体的目录约定可补充本文件。
- 开始修改前阅读 `README.md`、相关源码与配置，检查 Git 状态和 diff，保留已有的无关修改。
- 使用中文沟通和编写项目说明；代码命名沿用所在文件的风格，避免顺手进行全文件格式化。
- 默认使用 Windows / PowerShell 命令。仅在任务明确包含提交、推送或发布时执行相应操作。

## 技术栈与目录边界

- 本项目是 GitHub Pages 静态站点，使用 Jekyll、Liquid、原生 HTML/CSS/JavaScript；从仓库分支根目录发布，由 GitHub 构建。
- 当前主仓库没有 `package.json`、`Gemfile` 或自动化测试配置。常规页面修改沿用现有模式，不为小改动引入前端框架、打包器、CDN 或运行时依赖。
- `_config.yml` 管理站点信息、默认布局和发布排除项；`_layouts/default.html` 管理公共文档结构、导航和资源加载。
- `index.html` 是首页；`nav/`、`tools/`、`gallery/`、`about/` 是主站页面；`404.html` 保留 `/404.html` 固定地址。
- `assets/css/site.css` 是全站样式，`assets/css/navigation.css` 是导航页样式；`assets/css/fish.css` 与 `assets/js/fish.js` 实现公共底部动画。
- `tools/crop/` 是本地图片裁剪工具，页面、样式、逻辑分别位于 `index.html`、`styles.css`、`app.js`。
- `/blog/` 和 `/prompts/` 是独立站点入口。本地同名目录被主仓库 `.gitignore` 忽略，可能包含独立 Git 仓库；默认不修改、清理或强制加入主仓库。任务涉及其中内容时，先确认目标仓库并读取其自身约定。
- `tools/prompts/index.html` 仅保留旧地址到 `/prompts/` 的迁移跳转，不在这里恢复提示词应用或引入其后端配置。
- 以主仓库 `git ls-files` 判断受版本控制的项目内容，不因本地存在额外目录就将其视为主站模块。

## 页面与资源约定

- 新增需要公共布局的 HTML 或 Markdown 页面必须以 Jekyll front matter 开头，至少包含 `title`，页面内容只写正文。
- `_config.yml` 已为页面默认设置 `layout: default`；不要在正文重复写 `html`、`head`、`body` 或重复加载公共资源。自定义布局应继承 `default`。
- 页面专用 CSS/JS 通过 front matter 的 `stylesheet`、`script` 指定，由公共布局加载；当前各支持一个路径，不要直接改成数组而不调整布局。

```yaml
---
title: 页面标题 · Esteliel
stylesheet: /tools/example/styles.css
script: /tools/example/app.js
---
```

- 不需要专用资源时省略对应字段。`home: true` 仅用于首页，启用居中内容布局；所有页面均保留公共顶部导航。
- `assets/css/brand.css` 定义三站公共配色、字体、品牌标识和导航样式，在页面专用样式之后加载。涉及公共视觉规则时，同步主站、`blog/`、`prompts/` 三个仓库中的同名文件，保持内容一致；各站通过本地资源独立部署。
- 站内链接与模板中的资源路径使用 `relative_url`，例如 `{{ '/tools/crop/' | relative_url }}`，兼容 `baseurl` 子目录部署。普通 `.js`、`.css` 默认不经过 Liquid 处理，不直接向其中写模板表达式。
- 调整导航时检查首页 `index.html` 与公共布局中的两套入口；新增工具时同步维护 `tools/index.html`。
- 新标签页链接保留 `rel="noopener noreferrer"`；交互控件使用合适的语义标签、可访问名称和可见焦点，保留键盘操作。
- 页面样式限定在自身容器或专用类名下，避免污染其他页面；沿用现有深色视觉和响应式布局，检查窄屏与文字换行。
- 协作文档和本地构建产物不应作为站点内容发布；新增相关文件时检查 Jekyll `exclude`，不要提交 `_site/` 或 `.jekyll-cache/` 等生成内容。

## 功能不变量

- 公共跳鱼和水波动画只由默认布局加载一次，保持原生 JavaScript 实现，不引入 jQuery 或 CDN。
- 除非任务明确调整视觉，保留鱼形、水波效果、200px 高度及 0.5 透明度；装饰层保持 `aria-hidden`、不拦截点击，并为正文保留适当底部空间。
- 保留后台标签页暂停动画、系统“减少动态效果”下显示静态水面，以及打印时隐藏装饰的行为。
- 图片裁剪在浏览器本地处理，不上传用户图片或加入远程处理服务。保持 JPG、PNG、WEBP 输入支持和多选区导出能力。
- 修改裁剪逻辑时区分原图坐标、Canvas 预览尺寸与 CSS 显示尺寸；选区须在原图边界内，导出以原图像素为准。
- 保留选区拖动、角点缩放、坐标输入和键盘微调；更换图片、重新生成结果与离开页面时注意释放不再使用的对象 URL。
- 不向静态页面或仓库写入私密凭据、访问令牌或用户图片。

## 验证与交付

- 按改动范围选择最小必要验证，不将未执行的检查描述为通过。
- 文档或配置修改：核对路径、命令与当前代码一致，检查最终 diff，并运行 `git diff --check`。
- JavaScript 修改：本机有 Node.js 时，对改动脚本运行语法检查，例如 `node --check tools/crop/app.js` 或 `node --check assets/js/fish.js`；语法检查不能替代浏览器功能验证。
- 页面、布局或 Jekyll 配置修改：本机已安装 Jekyll 时运行 `jekyll build`，通过 `jekyll serve` 预览；直接打开源 HTML 或仅用静态服务器托管源目录无法验证 Liquid 与布局解析。
- 公共布局、路径或全站样式变动时，检查首页、普通内容页、工具页、404 及旧提示词入口；路径改动还需检查非空 `baseurl` 构建后的链接和资源。
- 动画变动时检查点击穿透、后台暂停、减少动态效果和窄屏展示；裁剪变动时检查图片导入、默认对半、增删选区、拖动/缩放、坐标/比例/键盘调整、生成和下载结果。
- 缺少 Jekyll 或浏览器验证条件时，说明已完成的检查与未验证项，不为一次小改动擅自引入整套构建或测试设施。
- 交付时简要说明关键改动、验证结果与限制；仅当项目结构、关键入口或构建方式实质变化时同步更新相关说明。
