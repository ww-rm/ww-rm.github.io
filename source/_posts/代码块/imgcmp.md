---
title: 使用 OpenCV 进行图像对比
categories:
  - "代码块"
tags:
  - "OpenCV"
  - "图像比对"
date: 2024-08-02 22:53:13
---

记录一下最近写的一个小工具模块, 用来比较两张图像之间的相似度, 并且输出直方图差异以及像素差异.

<!-- more -->

## 基本原理

目标是比较两张相同 RGB 图像的相似度, 看它们之间是否存在色彩阴影亮度之类的区别.

因此首先将图像读取后转换成 HLS 通道格式, 再依次求解每个通道上的直方图差异以及像素差分图.

## 代码

```python
# -*- coding: utf-8 -*-

from argparse import ArgumentParser
from collections import namedtuple
from typing import Tuple

import cv2
import matplotlib.pyplot as plt
import numpy as np

HlsSimilarity = namedtuple("HlsSimilarity", ["H", "L", "S"])


def read_image_as_hls(path: str, blur_ksize: int = 0) -> np.ndarray:
    """读取图像并转换成 HLS 格式.

    由于对比的时候过于灵敏, 所以有必要加一定程度的模糊.

    Returns:
        image: 形状为 (H, W, 3)
    """
    img = cv2.imread(path, cv2.IMREAD_COLOR)
    if blur_ksize > 0:
        img = cv2.blur(img, (blur_ksize, blur_ksize))
    img = cv2.cvtColor(img, cv2.COLOR_BGR2HLS_FULL)
    return img


def calc_image_hist_delta(img1: str, img2: str) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """计算两张直方图差异

    Returns:
        delta: (H, L, S) 三个分量的直方图差异
    """
    img1 = read_image_as_hls(img1)
    img2 = read_image_as_hls(img2)

    hist_delta = []
    for i in range(3):
        h1 = cv2.calcHist([img1], [i], None, [256], [0, 255]).flatten()
        h2 = cv2.calcHist([img2], [i], None, [256], [0, 255]).flatten()
        hist_delta.append(h1 - h2)

    return tuple(hist_delta)


def get_colors(cname: str = "hsv", size: int = 256):
    """获得连续的调色板颜色序列"""
    cmap = plt.get_cmap(cname, size)
    return [cmap(i)[:3] for i in range(size)]


def calc_image_similarity(img1: str, img2: str, blur_ksize: int = 15) -> HlsSimilarity:
    """计算两张图像的相似度, 具体算法见 https://docs.opencv.org/4.5.5/d8/dc8/tutorial_histogram_comparison.html

    此处使用 Bhattacharyya distance, 并且加了一定量的模糊处理.

    Returns:
        similarities: (H, L, S) 三个分量的相似度
    """
    img1 = read_image_as_hls(img1, blur_ksize)
    img2 = read_image_as_hls(img2, blur_ksize)

    similarities = [0, 0, 0]
    similarities[0] = 1 - cv2.compareHist(
        cv2.calcHist([img1], [0], None, [256], [0, 255]), cv2.calcHist([img2], [0], None, [256], [0, 255]), 3
    )
    similarities[1] = 1 - cv2.compareHist(
        cv2.calcHist([img1], [1], None, [256], [0, 255]), cv2.calcHist([img2], [1], None, [256], [0, 255]), 3
    )
    similarities[2] = 1 - cv2.compareHist(
        cv2.calcHist([img1], [2], None, [256], [0, 255]), cv2.calcHist([img2], [2], None, [256], [0, 255]), 3
    )

    return HlsSimilarity(*similarities)


def draw_image_hist_delta(img1: str, img2: str, path: str, title: str = "Hist Delta of HLS Image (First - Second)"):
    """绘制差异直方图情况"""

    delta_H, delta_L, delta_S = calc_image_hist_delta(img1, img2)

    fig, axes = plt.subplots(3, 1, squeeze=True, figsize=(12, 16), dpi=300)
    fig.subplots_adjust(left=0.1, right=0.9, top=0.93, bottom=0.07)
    fig.suptitle(title)
    fig.supxlabel("Pixel Value")
    fig.supylabel("Pixel Count")

    axes: list[plt.Axes]
    ax_H, ax_L, ax_S = axes

    x_len = len(delta_H)
    ax_H.bar(np.arange(x_len), delta_H, color=get_colors("hsv", x_len))
    ax_H.set_title("Delta of H Channel")
    ax_H.set_xticks(np.arange(0, x_len, 10), np.arange(0, x_len, 10), rotation=-45)

    x_len = len(delta_L)
    ax_L.bar(np.arange(x_len), delta_L, color=get_colors("gray", x_len))
    ax_L.set_title("Delta of L Channel")
    ax_L.set_xticks(np.arange(0, x_len, 10), np.arange(0, x_len, 10), rotation=-45)

    x_len = len(delta_S)
    ax_S.bar(np.arange(x_len), delta_S, color=get_colors("gray", x_len))
    ax_S.set_title("Delta of S Channel")
    ax_S.set_xticks(np.arange(0, x_len, 10), np.arange(0, x_len, 10), rotation=-45)

    fig.savefig(path)


def make_diff_image(img1: str, img2: str, path: str) -> bool:
    """叠图查看差异, 如果尺寸不一样或者保存失败返回 False."""
    img1 = read_image_as_hls(img1)
    img2 = read_image_as_hls(img2)

    if img1.shape != img2.shape:
        return False

    img1_H, img1_L, img1_S = cv2.split(img1)
    img2_H, img2_L, img2_S = cv2.split(img2)

    # 色相是 [0, 255] 的环形取值, 因此计算的时候要取环上短侧的距离
    diff_H = np.min([img1_H - img2_H, img2_H - img1_H], axis=0)
    diff_H = cv2.normalize(diff_H, None, 0, 255, cv2.NORM_MINMAX)
    diff_L = cv2.absdiff(img1_L, img2_L)
    diff_S = cv2.absdiff(img1_S, img2_S)
    diff_img = np.concatenate([diff_H, diff_L, diff_S], axis=0)
    return cv2.imwrite(path, diff_img)


if __name__ == "__main__":
    parser = ArgumentParser()
    parser.add_argument("img1")
    parser.add_argument("img2")
    parser.add_argument("--out-hist", default="hist.png")
    parser.add_argument("--out-diff", default="diff.png")

    args = parser.parse_args()

    sim = calc_image_similarity(args.img1, args.img2)
    print(sim)
    draw_image_hist_delta(args.img1, args.img2, args.out_hist)
    if not make_diff_image(args.img1, args.img2, args.out_diff):
        print("尺寸不同, 无法计算差分")
```

## 运行效果

输入两张图片, 例如:

{% gp 2-2 %}
![lenna1.png](https://ww-rm.github.io/static/image/imgcmp/lenna1.png)
![lenna2.png](https://ww-rm.github.io/static/image/imgcmp/lenna2.png)
{% endgp %}

可以得到相似度: HlsSimilarity(H=0.32851660966060825, L=0.6765325641597513, S=0.6573630520719462)

并且有差异图:

![hist.png](https://ww-rm.github.io/static/image/imgcmp/hist.png)

![diff.png](https://ww-rm.github.io/static/image/imgcmp/diff.png)

可以看出来左图比右图多了很多红色部分, 并且少一一丢丢的蓝色.

并且左图更亮, 且颜色饱和度更高.
