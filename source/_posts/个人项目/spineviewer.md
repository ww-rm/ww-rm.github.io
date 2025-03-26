---
title: SpineViewer 简单好用的 Spine 查看&导出工具
categories:
  - "个人项目"
tags:
  - "Spine"
  - "SpineViewer"
  - "Winforms"
date: 2025-03-04 12:31:15
---

*所见即所得* 的 Spine 文件查看&导出程序.

项目地址: [https://github.com/ww-rm/SpineViewer](https://github.com/ww-rm/SpineViewer)

![previewer](/static/image/spineviewer/preview.jpg)

<!-- more -->

## 安装

前往 [Release](https://github.com/ww-rm/SpineViewer/releases) 界面下载压缩包.

软件需要安装依赖框架 [.NET 桌面运行时 8.0.x](https://dotnet.microsoft.com/zh-cn/download/dotnet/8.0).

也可以下载带有 `SelfContained` 后缀的压缩包, 可以独立运行.

## 导出格式支持

- 单帧画面
- 帧序列
- GIF 动图
- MKV
- MP4
- MOV
- WebM
- ...

更多格式正在施工 :rocket::rocket::rocket:

## 使用方法

### 骨骼导入

有 3 种模式导入骨骼文件:

- 拖放/粘贴需要导入的骨骼文件/目录到模型列表
- 从文件菜单里批量打开骨骼文件
- 从文件菜单选择单个模型打开

### 预览内容调整

模型列表支持右键菜单以及部分快捷键, 并且可以多选进行模型参数的批量调整.

预览画面除了使用面板进行参数设置外, 支持部分鼠标动作:

- 左键可以选择和拖拽模型, 按下 `Ctrl` 键可以实现多选, 与左侧列表选择是联动的.
- 右键对整体画面进行拖动.
- 滚轮进行画面缩放.
- 仅渲染选中模式, 在该模式下, 预览画面仅包含被选中的模型, 并且只能通过左侧列表改变选中状态.

预览画面下方按钮支持对画面时间进行调整, 可以当作一个简易的播放器.

### 预览内容导出

导出遵循 "所见即所得" 原则, 即实时预览的画面就是你导出的画面.

导出有以下几个关键参数:

- 仅渲染选中. 这个参数不仅影响预览模式, 也影响导出, 如果仅渲染选中, 那么在导出时只有被选中的模型会被考虑, 忽略其他模型.
- 输出文件夹. 这个参数某些时候可选, 当不提供时, 则将输出产物输出到每个模型各自的模型文件夹, 否则输出产物全部输出到提供的输出文件夹.
- 导出单个. 默认是每个模型独立导出, 即对模型列表进行批量操作, 如果选择仅导出单个, 那么被导出的所有模型将在同一个画面上被渲染, 输出产物只有一份.

### 更多

更为详细的使用方法和说明见 [Wiki](https://github.com/ww-rm/SpineViewer/wiki), 有使用上的问题或者 BUG 可以提个 [Issue](https://github.com/ww-rm/SpineViewer/issues).

---

*如果你觉得这个项目不错请给个 :star:, 并分享给更多人知道! :)*

[![Stargazers over time](https://starchart.cc/ww-rm/SpineViewer.svg?variant=adaptive)](https://starchart.cc/ww-rm/SpineViewer)
