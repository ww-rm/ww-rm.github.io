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

- 游戏内资源体积较大, 建议科学上网进行加载
- 所有资源均可在仓库 [azurlane_spinepainting](https://github.com/ww-rm/azurlane_spinepainting) 内进行查看和下载
- 网页功能性能有限, 推荐使用本地工具 [DeskSpine](https://github.com/ww-rm/DeskSpine), 可以设置动态桌面壁纸, 并支持画面导出

{% endnote %}

{% raw %}
<style>
  #shipnames-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 10px;
    max-width: 100%;
    max-height: 300px;
    overflow-y: auto;
    padding: 10px;
  }

  #canvas-spine {
    width: 100%;
    height: auto;
    aspect-ratio: 1;
  }
</style>
{% endraw %}

## 皮肤列表 (点击名称切换预览)

{% raw %}
<div id="shipnames-container"></div>
{% endraw %}

## 预览界面 (可以进行拖放)

{% raw %}
<canvas id="canvas-spine"></canvas>
{% endraw %}

{% raw %}
<script src="/js/third-party/spine38/spine-webgl.js"></script>
<script src="index.js"></script>
{% endraw %}
