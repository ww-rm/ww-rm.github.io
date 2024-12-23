---
title: 网页预览碧蓝航线动态立绘
categories:
  - "码记"
tags:
  - "spine"
  - "spine-js"
  - "碧蓝航线"
  - "Azur Lane"
  - "动态立绘"
  - "前端"
date: 2024-12-22 16:25:16
---

恰逢最近[碧蓝航线新版本更新](https://wiki.biligame.com/blhx/2024%E5%B9%B412%E6%9C%8819%E6%97%A510:00%E6%B8%AF%E5%8C%BA%E6%94%B9%E5%BB%BA), 又双叒叕增加了一批新船立绘和角色皮肤, 本人作为前指挥官~~兼LSP~~, 最近也没啥事, 于是又下回来用以前的资源爽抽了一波.

虽然氪金是不可能再氪了, 但是包还是能拆的, 刚好最近闲着, 再加上之前有使用 Spine 运行时的经验, 决定写个在线预览动绘的网页挂在博客上.

成品见[碧蓝航线动态立绘在线预览 (持续更新)](https://ww-rm.github.io/azurlane/), 页面上有使用说明, 可以在线预览动态皮肤 (不是 Live2D), 皮肤资源也会不定期更新.

<!-- more -->

## 基本思路

### Spine 运行时

主要还是用官方的运行时库 [spine-ts](https://github.com/EsotericSoftware/spine-runtimes/tree/3.8/spine-ts), 剩下的就是写一个大概的前端页面, 提供交互功能.

官方例子挺详细的, 而且源码也都有, 不过这里提一嘴建议直接用 `webgl` 版本, 最开始写的时候图简单用的 `canvas` 版本, 但是 `canvas` 版本既不支持 premultiplyAlpha, 也不支持 clipping, 而且性能也堪忧.

官方库主要是封装了利用 `webgl` 渲染的过程, 所以我们只需要处理资源加载以及画面显示位置等等.

### 资源接口

拆包拆出来的动态立绘资源将近 1 GB, 不过还是可以老办法, 开个新仓库并且部署 pages 功能, 这样子就能在网站域名子路径下访问资源了, 也不会污染其他仓库.

仓库见 [azurlane_spinepainting](https://github.com/ww-rm/azurlane_spinepainting), 里面的资源应该是可以通过以 `https://ww-rm.github.io/azurlane_spinepainting/` 为前缀的链接访问到的, 就是速度有点慢, 加上资源本身也大, 加载一个皮肤很可能要个一两分钟, 同时由于不可抗力还可能访问失败, 强烈建议科学上网访问.

### 前端页面

说实话几乎没怎么写过前端, 因此 gpt 简直救我狗命, 不然不知道要写到猴年马月去了.

一番思索决定在现有的 Markdown 文件里写 html, 不单独写页面, 这样能有效利用博客现成的主题.

页面大概分上下两部分, 第一部分是 `船名_皮肤名` 这样的链接列表, 第二部分是一个 `canvas` 元素的预览画面, 用户可以通过点击皮肤链接来加载并切换下面的预览画面.

皮肤列表用 js 动态生成, 不过也还是需要自己在代码里固定一个映射表, 提供名称以及资源位置啥的.

预览界面几乎是原封不动照着 [spine-webgl](https://github.com/EsotericSoftware/spine-runtimes/blob/3.8/spine-ts/webgl/example/index.html) 的样例实现的, 但是重新封装了部分功能, 例如支持多个骨骼按序渲染, 并且调整了画面参数.

预览画面也实现了一些交互功能, 例如 PC 上可以用鼠标拖动缩放, 移动设备也可以用手势动作进行拖动缩放, 也支持选择查看模型下不同的动画.~~毕竟部分动绘皮肤也有特触.~~

## 页面效果

最后的效果大概长这样:

![page-preview.jpg](https://ww-rm.github.io/static/image/spinejs-azurlane/page-preview.jpg)

![page-preview1.gif](https://ww-rm.github.io/static/image/spinejs-azurlane/canvas-preview1.gif)

![page-preview2.gif](https://ww-rm.github.io/static/image/spinejs-azurlane/canvas-preview2.gif)

![page-preview3.gif](https://ww-rm.github.io/static/image/spinejs-azurlane/canvas-preview3.gif)

## 源码

也算是个小的前端项目? 源码都在博客仓库的 [source/azurlane](https://github.com/ww-rm/ww-rm.github.io/tree/main/source/azurlane) 路径下 (未来可能会挪位置, 但是反正都在这个仓库).

基本上都是和 gpt 交互然后改出来的代码, 不得不说 gpt 真是写前端利器.

## 相关资源

立绘资源在仓库 [azurlane_spinepainting](https://github.com/ww-rm/azurlane_spinepainting).

不过网页端功能和性能都有限, 这里趁机推销一下自己的小项目 [DeskSpine](https://github.com/ww-rm/DeskSpine), 目前还没彻底完工~~咕咕咕~~, 但是基本功能已经差不多了~~能用~~, 是我基于过去项目 [DesktopSprite](https://ww-rm.github.io/posts/2023/08/30/desktopsprite/) 用 C# 重写的, 使用方法上也差不多, 但是比之前性能好上很多~~bug也少很多~~, 也增加了一些更好用的功能, 欢迎有兴趣的指挥官前来体验.    
