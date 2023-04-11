---
title: 碧蓝航线立绘拆包与批量还原
tags:
  - "工具"
  - "碧蓝航线"
  - "立绘还原"
categories:
  - "资源分享"
date: 2023-04-11 09:53:19
---

因为网上没看到太好的核心步骤介绍和脚本, 所以自己造了一下轮子, 方便自己记录学习过程.

本文介绍碧蓝航线立绘拆包和还原基本思路, 文末附有完整的批量还原 `python` 脚本.

<!-- more -->

## 资源拆包

拆包的方法网上很多, 不再赘述, 用 [AssetStudio](https://github.com/Perfare/AssetStudio/releases) 导出安装包和热更新里的 `painting` 内容, 得到 里面的 `Mesh` 和 `Texture2D` 资源即可进行下一步还原.

## 文件格式

`Texture2D` 下面的内容是所有打包后的立绘纹理图片, 目测都是 `名字` + `.png` 的文件名.

`Mesh` 下面是 3D 模型贴图格式, 大部分都是 `名字` + `-mesh.obj` 的文件名, 小部分要特殊处理, 名字和前面纹理图名字一一对应.

- `g` 开头的行是标识行, 可以忽略;
- `v` 开头的是模型顶点坐标, 对应还原后的图的坐标;
- `vt` 是纹理图的顶点坐标, 对应打包后图片的坐标;
- `f` 是 `v` 和 `vt` 的对应关系, 每一行代表一个三角面, 用三组点来记录, 分别是 `v/vt/vn` 的序号, 从 1 开始.

更为详细的内容可以自行谷歌 `Mesh` 的文件格式.

## 还原思路

### 基本流程

`Mesh` 中每一个 `f` 行代表一个小三角形, 实测相邻的两行就是一整个矩形, 因此只需要读取 `Mesh` 文件记录之后, 两行两行去处理 `f` 记录, 就可以像拼图一样从纹理图把原图拼出来.

### 注意事项

- 模型坐标的 `x` 取值需要取绝对值进行镜像 (原因不知).
- 原始坐标系的原点都在图片的左下角, 需要调整成左上角 (翻转 `y` 轴).
- 需要将坐标系里的点转换到图片里的像素行列值 (比较玄学, 坐标里的点对应图片像素一个 `2x2` 像素的中心点)
- 瓜游的 0.125 个程序员导致很多立绘就是原图, 然后对应的 `Mesh` 文件没有; 也可能热更新很多次, 同一个纹理图有很多个 `Mesh` 文件, 需要都尝试一下.

## 代码

安装一下必要的库, 运行的时候需要设定资源文件夹和导出文件夹.

当遇到无法通过 `Mesh` 文件来还原的纹理图时, 会弹窗显示图片的缩略图, 可以手动选择是直接复制原图过去还是放弃这张图, 比如下面:

![ppLZ3eU.png](https://s1.ax1x.com/2023/04/11/ppLZ3eU.png)

```python
import shutil
import tkinter as tk
import traceback
from pathlib import Path
from typing import *

import cv2
import numpy as np
from PIL import Image, ImageTk


def read_mesh_obj(path):
    vertex = []  # x, y, x
    vertex_texture = []  # u, v
    vector_normal = []  # x, y, z # 2D 没有法向量
    face = []  # v/vt/vn
    with open(path, "r", encoding="utf8") as f:
        for line in f:
            type_, *values = line.strip().split(" ")

            if type_ == "v":
                vertex.append(list(map(int, values[:2])))
            elif type_ == "vt":
                vertex_texture.append(list(map(float, values)))
            elif type_ == "f":
                face.append([list(map(int, value.split("/"))) for value in values])
            else:
                continue
    return vertex, vertex_texture, face


def restore_painting(texture: np.ndarray, v, vt, f) -> np.ndarray:
    v = np.array(v)[:, 0:2]  # 去除 z 轴
    vt = np.array(vt)
    f = np.array(f)[:, :, 0:2]  # 去除法向量

    # 处理 v
    v = np.abs(v)  # 水平镜像, 原因不明
    v[:, 1] = np.max(v[:, 1]) - v[:, 1]  # 翻转 y 轴, x 对应列数, y 对应行数

    # 处理 vt
    vt = vt * np.array(texture.shape[1::-1]).reshape(1, 2)  # 转换到像素
    vt[:, 1] = texture.shape[0] - vt[:, 1]  # 翻转 y 轴
    vt = np.round(vt, 0).astype(int)  # 转换整数坐标

    # 新建空图
    width, height = np.max(v, axis=0) + 2  # 上下左右各扩展 1 个位置
    png = np.zeros((height, width, 4), dtype=texture.dtype)
    # print(png.shape)

    for i in range(0, len(f), 2):
        v_rect_pts: List[Tuple[int, int]] = []
        vt_rect_pts: List[Tuple[int, int]] = []

        for v_idx, vt_idx in f[i]:
            v_rect_pts.append(v[v_idx - 1])  # 下标需要序号 -1
            vt_rect_pts.append(vt[vt_idx - 1])

        for v_idx, vt_idx in f[i + 1]:
            v_rect_pts.append(v[v_idx - 1])
            vt_rect_pts.append(vt[vt_idx - 1])

        # 排序得到左上和右下坐标
        leftup_v, *_, rightdown_v = sorted(v_rect_pts, key=list)
        leftup_vt, *_, rightdown_vt = sorted(vt_rect_pts, key=list)

        # 转换像素行列坐标, 左闭右开
        leftup_v = (leftup_v + 1) - 1  # +1 是为了把图往两个正方向移动一格, 修正坐标
        rightdown_v = (rightdown_v + 1) + 1
        leftup_vt = leftup_vt - 1
        rightdown_vt = rightdown_vt + 1

        # 判断区域是否大小相等
        size1 = rightdown_v - leftup_v
        size2 = rightdown_vt - leftup_vt
        if not all(size1 == size2):
            # 处理不相等情况, 目前只发现纹理区域会可能多一行/列, 想办法去掉空白
            # 空白的条件是某一行/列透明度均小于一个阈值
            texture_region = texture[leftup_vt[1]:rightdown_vt[1], leftup_vt[0]:rightdown_vt[0]]
            alpha_value = 10

            row_delta = size2[1] - size1[1]
            if row_delta == 1:
                if np.all(texture_region[-1, :, -1] < alpha_value):
                    rightdown_vt[1] -= 1
                elif np.all(texture_region[0, :, -1] < alpha_value):
                    leftup_vt[1] += 1
                else:
                    raise ValueError("Empty row not found!")
            elif row_delta > 1:
                raise ValueError(f"{row_delta} extra rows found.")

            col_delta = size2[0] - size1[0]
            if col_delta == 1:
                if np.all(texture_region[:, -1, -1] < alpha_value):
                    rightdown_vt[0] -= 1
                elif np.all(texture_region[:, 0, -1] < alpha_value):
                    leftup_vt[0] += 1
                else:
                    raise ValueError("Empty col not found!")
            elif col_delta > 1:
                raise ValueError(f"{col_delta} extra cols found.")

        png[leftup_v[1]:rightdown_v[1], leftup_v[0]:rightdown_v[0]] = texture[leftup_vt[1]:rightdown_vt[1], leftup_vt[0]:rightdown_vt[0]]

    return png


def choose_image(image_path):
    def on_confirm():
        root.result = True
        root.destroy()

    def on_cancel():
        root.result = False
        root.destroy()

    # 初始化 tkinter 窗口
    root = tk.Tk()
    root.title("选择保留")
    root.result = False

    # 加载图片并调整大小
    image = Image.open(image_path)
    max_size = (300, 300)
    image.thumbnail(max_size)
    photo = ImageTk.PhotoImage(image)

    # 创建图片标签并放置在窗口上
    label = tk.Label(root, image=photo)
    label.pack(padx=5, pady=5)

    # 创建确认和取消按钮并放置在窗口上
    confirm_button = tk.Button(root, text="复制", command=on_confirm)
    confirm_button.pack(side=tk.LEFT, padx=(20, 10), pady=10)

    cancel_button = tk.Button(root, text="放弃", command=on_cancel)
    cancel_button.pack(side=tk.RIGHT, padx=(10, 20), pady=10)

    # 运行窗口并等待用户操作
    root.mainloop()
    return root.result


PNG_DIR = Path("./Texture2D")
OBJ_DIR = Path("./Mesh")

EXPORT_DIR = Path("./test")

if __name__ == "__main__":
    count = 0
    for png in PNG_DIR.iterdir():
        char_name = png.stem

        print(char_name)
        count += 1

        painting_path = EXPORT_DIR.joinpath(png.name)

        for mesh in OBJ_DIR.glob(f"{char_name}-mesh*.obj"):
            v, vt, f = read_mesh_obj(mesh)
            texture: np.ndarray = cv2.imread(png.as_posix(), cv2.IMREAD_UNCHANGED)

            try:
                painting = restore_painting(texture, v, vt, f)
            except ValueError:
                traceback.print_exc()
                print(f"Restore Error: {char_name}")
                continue  # 还原失败继续试下一个可能的 mesh 文件

            # 还原成功跳出循环
            cv2.imwrite(painting_path.as_posix(), painting)
            break
        else:
            print(f"No valid mesh file found for {png}")
            if choose_image(png):
                print(f"Copy: {png}")
                shutil.copy(png, painting_path)
            else:
                print(f"Discard: {png}")

    print(f"Total: {count}")
    input("Press <Enter> to exit...")
```

## 还原效果

放一些还原前和还原后的图作对比~夹带私货~.

{% note danger guanghui_h.png %}
![ppLeqED.png](https://s1.ax1x.com/2023/04/11/ppLeqED.png)
![ppLmurV.png](https://s1.ax1x.com/2023/04/11/ppLmurV.png)
🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹
<style>.heimu {background-color: black; color: black;}.heimu:hover {color: white;}</style>
<div style="text-align:center;width:100%;">🌹<span class="heimu">为老婆献上 99 朵玫瑰！</span>🌹</div>
{% endnote %}

{% note info guanghui.png %}
![ppLeIjx.png](https://s1.ax1x.com/2023/04/11/ppLeIjx.png)
![ppLmECj.png](https://s1.ax1x.com/2023/04/11/ppLmECj.png)
{% endnote %}

{% note info guanghui_2.png %}
![ppLe7DK.png](https://s1.ax1x.com/2023/04/11/ppLe7DK.png)
![ppLmFUg.png](https://s1.ax1x.com/2023/04/11/ppLmFUg.png)
{% endnote %}

{% note info guanghui_3.png %}
![ppLeTu6.png](https://s1.ax1x.com/2023/04/11/ppLeTu6.png)
![ppLmk5Q.png](https://s1.ax1x.com/2023/04/11/ppLmk5Q.png)
{% endnote %}

{% note info guanghui_4.png %}
![ppLe5g1.png](https://s1.ax1x.com/2023/04/11/ppLe5g1.png)
![ppLmCb8.png](https://s1.ax1x.com/2023/04/11/ppLmCb8.png)
{% endnote %}

{% note info guanghui_5.png %}
![ppLeHHO.png](https://s1.ax1x.com/2023/04/11/ppLeHHO.png)
![ppLmevq.png](https://s1.ax1x.com/2023/04/11/ppLmevq.png)
{% endnote %}

{% note info guanghui_idol.png %}
![ppLeO4H.png](https://s1.ax1x.com/2023/04/11/ppLeO4H.png)
![ppLyIk8.png](https://s1.ax1x.com/2023/04/11/ppLyIk8.png)
{% endnote %}

{% note info guanghui_idol_n.png %}
![ppLeLUe.png](https://s1.ax1x.com/2023/04/11/ppLeLUe.png)
![ppLy4Tf.png](https://s1.ax1x.com/2023/04/11/ppLy4Tf.png)
{% endnote %}
