# Esteliel.github.io
GitHub Pages 静态站点，使用 Jekyll 公共布局。

所有页面通过 `_layouts/default.html` 加载底部跳鱼和水波动画。动画提取自
`nudoo.github.io-master/Better_Alist/fish.js` 和 `alist.css`，保留原有鱼形、
水波物理效果、200px 高度与 0.5 透明度，使用原生 JavaScript，无 CDN 或 jQuery 依赖。
站点底色用于衬托原版浅色动画；装饰层不会拦截页面点击，后台标签页暂停动画，
系统启用“减少动态效果”时显示静态水面。

新增 HTML 或 Markdown 页面时，文件开头必须保留 Jekyll front matter，例如：

```html
---
title: 关于
---
<h1>关于</h1>
<p>页面正文。</p>
```

`_config.yml` 为页面默认指定 `default` 布局，无需逐页引入鱼的资源。
页面只写正文；自定义布局应继承 `default`。没有 front matter 的独立 HTML
会被 Jekyll 原样复制，因此应按上述格式创建页面才能应用全站样式。
资源路径使用 `relative_url`，可通过 `baseurl` 适配子目录部署。

公共样式位于 `assets/css/site.css`；鱼的独立样式和脚本位于
`assets/css/fish.css`、`assets/js/fish.js`。可在 `.fish-container` 中调整
`--fish-color`、`height`、`opacity`。

在 GitHub Pages 中选择从仓库分支根目录发布，由 GitHub 构建 Jekyll。
本地已安装 Jekyll 时可运行 `jekyll serve` 预览；直接打开源 HTML 不会解析布局。
