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

本文是对个人项目 [SpineViewer](https://github.com/ww-rm/SpineViewer) 的介绍, 一个使用 `C#` 实现的桌面工具, 支持多版本多骨骼的 Spine 动画查看和导出, 并且支持方便的面板参数调整.

<!-- more -->

![preview.jpg](/static/image/spineviewer/preview.jpg)

## 安装

前往 [Release](https://github.com/ww-rm/SpineViewer/releases) 界面下载压缩包.

软件需要安装依赖框架 [.NET 桌面运行时 8.0.x](https://dotnet.microsoft.com/zh-cn/download/dotnet/8.0).

也可以下载带有 `SelfContained` 后缀的压缩包, 可以独立运行.

## 功能

- 支持不同版本 Spine 查看
    - [x] `v3.6.x`
    - [x] `v3.7.x`
    - [x] `v3.8.x`
    - [x] `v4.0.x`
    - [x] `v4.1.x`
    - [x] `v4.2.x`
    - [ ] `v4.3.x`
- 支持多骨骼文件动画预览
- 支持每个骨骼独立参数设置
- 支持动画PNG帧序列导出
- 支持缩放旋转等导出画面设置
- Coming soon...

## 使用方法

### 骨骼导入

**文件**菜单可以选择**打开**或者**批量打开**进行骨骼文件导入.

### 骨骼调整

在**模型列表**中选择一项或多项, 将会在**模型参数**面板显示可供调节的参数.

**模型列表**右键菜单可以对列表项进行增删调整, 也可以使用鼠标左键拖动调整顺序.

### 画面调整

**预览画面**支持的鼠标操作:

- 左键可以对骨骼进行拖动
- 右键对画面进行拖动
- 滚轮进行画面缩放

除此之外, 也可以通过**画面参数**面板调节导出和预览时的画面参数.

在**功能**菜单中, 可以重置同步所有骨骼动画时间.

### 动画导出

**文件**菜单中选择**导出**可以将目前加载的所有骨骼动画按照预览时的画面进行PNG帧序列导出.

可以在每个骨骼的**模型参数**中查看动画完整时长.

## 后话

算是第二次写 Winforms 应用了~~于毕设的百忙之中抽空完成~~, 不得不感概, GPT 真的大大改善代码体验, 以前找个文档可以要翻老半天, 而且不熟悉的话找到的还不规范, 极容易掉坑, 现在有 GPT 之类的加成, 拿着代码片段和需求一问, 几乎直接就能跑了, 只能说科技改变生活啊, 对一些简单的开源项目太有帮助了.

这是在原有项目 [DesktopSprite](https://github.com/ww-rm/DesktopSprite) 上改出来的, 起因是有人留 Issue 说是否可以增加骨骼数量上限. 其实自己也一直很膈应这件事, 因为之前第一次写 Winforms 应用, 压根不怎么会写, 对控件库甚至语法都不是很熟悉, 所以很多地方写的很死, 都是手动摆出来了多少个控件然后支持操作.

不过这次用上 `PropertyGrid` 和 `ListView` 之后, 不管是使用上还是代码上体验都好了很多, 而且也做了不同控件和对话框的封装, 项目结构确实远好于之前~~果然代码还是得多写~~, 希望能收获几个 star 吧.
