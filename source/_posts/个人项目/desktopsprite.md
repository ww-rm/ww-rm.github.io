---
title: 基于 Spine 的碧蓝航线桌宠
categories:
  - "个人项目"
tags:
  - "桌宠"
  - "碧蓝航线"
  - "Spine"
date: 2023-08-30 19:36:29
mathjax: true
---

本文是对个人项目 [DesktopSprite](https://github.com/ww-rm/DesktopSprite) 的介绍, 一个使用 `C++` 实现的原生桌宠程序, 基于 [spine-runtimes v3.6.53](https://github.com/EsotericSoftware/spine-runtimes/releases/tag/3.6.53) 运行库, 可以支持碧蓝航线导出的小人动画资源.

<!-- more -->

## 项目简介

项目地址: [https://github.com/ww-rm/DesktopSprite](https://github.com/ww-rm/DesktopSprite)

这是一个适用于 `Windows` 系统下的桌面精灵, 目前已在 `Win10`, `Win11` 下基本测试通过.

- 轻量的性能监视器: 可以显示电脑占用和网速监视浮窗

![性能浮窗动图](/static/image/desktopsprite/perfmonitor.gif)

- 可自定义桌宠: 支持基于 `spine v3.6.53` 导出的碧蓝航线全角色小人动画

![guanghui_2 动图](/static/image/desktopsprite/guanghui_2.gif)
![biaoqiang_h 动图](/static/image/desktopsprite/biaoqiang_h.gif)
![lafei_h 动图](/static/image/desktopsprite/lafei_h.gif)
![z23_h 动图](/static/image/desktopsprite/z23_h.gif)

## 安装与使用

### 安装

前往 [Release](https://github.com/ww-rm/DesktopSprite/releases) 下载 `Latest` 版本的 `zip` 压缩包, 解压后双击运行里面的 `DesktopSprite.msi` 安装文件进行安装, 可以自定义安装位置.

安装完成后, 开始菜单和桌面都会出现程序启动图标. 双击运行, 通知栏会有程序图标, 首次运行桌面默认会显示自带的碧蓝小人角色, 且有一个性能浮窗.

### 更换角色

右键通知区域程序图标, 可以进入设置界面, 设置对应的 `atlas` 和 `skel/json` 文件, 然后应用/确定设置即可完成更换.

需要注意 `*.atlas`, `*.png`, `*.skel/*.json` 三份文件需要互相匹配, 且 `*.atlas` 和 `*.png` 文件名必须相同 (选择 `atlas` 的时候会自动填入 `png` 文件).

![atlasconfig](/static/image/desktopsprite/atlasconfig.png)

### 详细使用说明

#### 设置面板

![config.png](/static/image/desktopsprite/config.png)

##### 系统设置

- 开机启动: 程序是否开机启动
- 整点报时: 一个小功能, 可以在整点时间弹出通知提醒
- 提示声音: 整点报时是否有声音
- 气泡图标路径: 整点报时气泡通知使用的图标

##### 显示设置

这部分的设置是针对性能浮窗的.

- 显示浮窗: 是在桌面显示浮窗还是隐藏到通知区域图标使用鼠标悬停显示
- 显示占用: 是否在浮窗上显示处理器和内存占用百分比
- 显示网速: 是否在浮窗上显示上传和下载速度
- 深色主题: 设置浮窗主题颜色
- 透明度: 设置浮窗透明度百分比, 0 为完全透明, 100 为完全不透明

##### 精灵设置

这部分的设置是针对桌宠的

- atlas, png, skel 路径: 选择要使用的 SD 小人模型, 三个文件要互相匹配
- 显示精灵: 是否在桌面上显示桌宠, 不显示的情况下不会有桌宠的资源占用
- 鼠标穿透: 是否让桌宠鼠标穿透, 穿透情况下桌宠无视鼠标和键盘输入
- 最大帧率: 设置桌宠的渲染帧率, 对电脑性能有较高影响
- 透明度: 设置桌宠透明度, 配合鼠标穿透可以设置挂件效果
- 缩放: 设置桌宠的大小

##### Spine 设置

该部分设置桌宠动画小人不同事件和动画的映射关系, 可选内容由加载的 spine 模型决定.

- 待机: 无操作的普通情况
- 拖动: 鼠标拖动桌宠时触发
- 任务中: 没想好
- 睡觉: 电脑无输入闲置一段时间后触发
- 闲置: 电脑低负载时随机触发
- 触摸: 单击桌宠触发
- 摸头: 鼠标中键下滚
- 任务完成: 任务结束后, 和任务中是连着的
- 跳舞: 鼠标中键上滚
- 过载: 电脑高负载时随机触发

##### 按钮

- 打开数据文件夹: 打开程序数据文件所在的文件夹

#### 快捷操作

- 右键菜单: 有两个, 一个是浮窗/通知区域图标的, 另一个是桌宠的, 大部分选项都是设置面板里有的, 是快捷操作
- 精灵复位: 用来预防一些未知的特殊情况, 如一些不可知的显示器分辨率问题导致的精灵错位消失, 点击之后精灵会回到原点, 屏幕的正下方
- 双击桌宠: 让角色转向

#### 通知区域图标

- 右键单击: 显示右键菜单
- 左键双击: 显示桌宠

## 一些开发细节

### 环境

- `Win10+`
- `Visual Studio 2022`
- `C++14`
- [`spine-runtime`](https://github.com/EsotericSoftware/spine-runtimes/tree/3.6)
- [`jsoncpp`](https://github.com/open-source-parsers/jsoncpp)

其中 `spine-runtime` 和 `jsoncpp` 均是以源码方式引入并编译的, 内部有一些相应的适配性修改.

`spine-runtime` 版本固定了是 `v3.6.53`, 所以几乎只支持碧蓝航线导出的小人资源.

### 动画渲染

桌宠使用 2D 图形库绘制, 具体实现原理参考 [spine-c 运行时文档](http://zh.esotericsoftware.com/spine-c), 标准实现需要使用纹理映射等计算机图形学操作~但是我不会~, 所以纹理映射是通过 2D 库的纹理笔刷来实现的.

创建纹理笔刷之后, 在绘制顶点三角形时, 需要自己手动计算纹理到模型的仿射矩阵, 然后设置笔刷的变换矩阵, 就能完成纹理映射. 关键函数是这个 `GetAffineMatrix`:

```cpp
void GetAffineMatrix(
    float x1, float y1, float x2, float y2, float x3, float y3, 
    float u1, float v1, float u2, float v2, float u3, float v3, 
    Matrix* m
);
```

能够计算两个平面三角形 `UV` 到 `XY` 的仿射矩阵. 与渲染有关的详细实现见 [`spinechar.cpp`](https://github.com/ww-rm/DesktopSprite/blob/main/DesktopSprite/src/ds/spinechar.cpp).

## 注意事项

### 关于配置文件

⚠️不建议直接操作配置文件! ⚠️

⚠️不建议直接操作配置文件! ⚠️

⚠️不建议直接操作配置文件! ⚠️

点击 "打开数据文件夹" 后, 可以看到数据文件夹里有一份 `config.json`, 里面以 `json` 格式存储了所有的设置面板可见的配置信息.

### 使用上的问题

- 不建议帧率调太高, 会使电脑耗电显著增加, 或者风扇抽风
- 如果不慎出了一些和配置有关的问题, 比如设置了错误的内容导致程序崩了/打不开, 直接打开数据文件夹, 关闭程序并删除 `config.json` 后重启程序, 即可让程序使用默认配置运行

## 相关资源

此处附一下自己导出的角色小人资源, 不一定包含最新角色, [AzurLaneSD](https://github.com/ww-rm/AzurLaneSD).

如果无法下载则可以试一下下面的链接:

- [单角色下载](https://pan.baidu.com/s/1tSaBzZTWCyvcrgbGh_mgrg?pwd=blhx), 提取码: `blhx`.
- [全角色下载](https://pan.baidu.com/s/1qpZnJRB4PaC9Eb3tkZdACw?pwd=blhx), 提取码: `blhx`.

如果 [Release](https://github.com/ww-rm/DesktopSprite/releases) 界面进不去 (可能需要魔法才能访问), 这里贴一下程序的网盘链接.

- [安装包 - 百度网盘](https://pan.baidu.com/s/1vDFr0KYRknDjGDH1HaEX6g?pwd=blhx), 提取码: `blhx`.
- [免安装 - 百度网盘](https://pan.baidu.com/s/1TxsvHbk2TVjlvv9Lv-C7yg?pwd=blhx), 提取码: `blhx`.
- [安装包 - 蓝奏云](https://ww-rm.lanzout.com/iyKWe174crre).
- [免安装 - 蓝奏云](https://ww-rm.lanzout.com/iFUML174crli).
