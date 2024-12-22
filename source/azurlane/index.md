---
title: 碧蓝航线动态立绘在线预览 (持续更新)
type: azurlane-spinepainting
---

{% note info **点击展开使用说明** %}

**使用方法**

- 页面分两部分, 第一部分是皮肤列表, 第二部分是预览界面
- 在下方皮肤列表中点击想要预览的动态皮肤, 等待资源加载完毕后即可查看预览
- 可以配合 `Ctrl-F` 来直接查找对应舰娘名以及皮肤名

**注意事项**

- 游戏内资源体积较大, 建议科学上网进行加载, 否则可能点击链接之后需要**非常长的加载时间**
- 所有资源均可在仓库 [azurlane_spinepainting](https://github.com/ww-rm/azurlane_spinepainting) 内进行查看和下载
- 网页功能性能有限, 推荐使用本地工具 [DeskSpine](https://github.com/ww-rm/DeskSpine), 可以设置动态桌面壁纸, 并支持画面导出

{% endnote %}

{% raw %}
<link rel="stylesheet" href="index.css">
{% endraw %}

## 皮肤列表 (点击名称切换预览)

{% raw %}
<div class="filter-skin">
    <!-- 对shipnames-container里的内容进行筛选，被筛选到的元素会被高亮，元素是a标签，如果文本包含给定的筛选内容就是命中 -->
    <label>筛选:</label>
    <input type="text" id="filter-skin-input" placeholder="输入关键字高亮筛选">
</div>
<div id="shipnames-container"></div>
{% endraw %}

## 预览界面 (可以进行拖放)

{% raw %}
<div class="control-panel">
    <div class="control-item">
        <label>当前预览:</label>
        <span id="current-shipname">无</span>
    </div>
    <div class="control-item">
        <label>动画设置:</label>
        <select id="animation-select"></select>
    </div>
    <div class="control-item">
        <label>背景设置:</label>
        <input type="radio" id="bgcolor-light" name="bgcolor" value="light">
        <label for="bgcolor-light">浅色</label>
        <input type="radio" id="bgcolor-dark" name="bgcolor" value="dark">
        <label for="bgcolor-dark">深色</label>
    </div>
</div>
<canvas id="canvas-spine"></canvas>
{% endraw %}

{% raw %}
<script src="/js/third-party/spine38/spine-webgl.js"></script>
<script src="index.js"></script>
{% endraw %}

## 本地辅助工具

~~推销一下自己的项目~~

所有资源均可在仓库 [azurlane_spinepainting](https://github.com/ww-rm/azurlane_spinepainting) 内进行查看和下载.

开源项目 [DeskSpine](https://github.com/ww-rm/DeskSpine), 是一个 Windows 平台下的 Spine 桌宠软件, 可以设置动态桌面壁纸, 并支持逐帧画面导出, 详情可以阅读项目介绍, 欢迎下载体验.
