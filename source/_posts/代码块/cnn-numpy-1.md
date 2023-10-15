---
title: 基于 NumPy 的手写数字识别 (卷积神经网络) (一)
categories:
  - "代码块"
tags:
  - "numpy"
  - "手写数字识别"
  - "卷积神经网络"
  - "深度学习"
date: 2023-10-13 18:41:27
mathjax: true
---

"基于 numpy 的手写数字识别", 这一经典问题除了用作深度学习入门内容, 还被广泛作为各大课程的课程作业, 因此在各大搜索引擎上搜索率也是相当之高~~(代码复用率也是相当之高)~~. 网上确实有挺多现成的可使用代码, 但是大部分都是造的全连接网络, 并且很多时候内部原理不是特别清晰. 因此决定自己也来造一次轮子, 使用 `numpy` 实现一个简单的卷积神经网络进行手写数字识别, 正好也能借此机会梳理一下神经网络的基本原理.

全文包含完整的卷积网络实现, 以及矩阵梯度和卷积矩阵化的推导过程, 由于全文过长, 因此分成了三部分, 内容上是完全连着的.

本文为第一篇, 简单介绍了神经网络的基本学习原理和一些无参数网络层的实现.

<!-- more -->

本系列文章传送门:

- [基于 NumPy 的手写数字识别 (卷积神经网络) (一)][1]
- [基于 NumPy 的手写数字识别 (卷积神经网络) (二)][2]
- [基于 NumPy 的手写数字识别 (卷积神经网络) (三)][3]

## 必要的理论知识

本节是对神经网络所需的数学知识进行简单介绍, 只涉及基本的高数知识. ~~全文可能有一些不严谨的数学式子, 会意即可.~~

### 前向传播

神经网络的本质是一个多元复合函数, 因此在给定输入的情况下计算网络的输出, 就是网络的前向传播过程.

![forward.jpg](https://ww-rm.github.io/static/image/cnn-numpy-1/forward.jpg)

如果有上图所示的一个简单网络, 其中:

$$
\begin{aligned}
  y_1 &= y_1(x_1, x_2) \\\\
  y_2 &= y_2(x_2, x_3) \\\\
  z &= z(y_1, y_2) = z(y_1(x_1, x_2), y_2(x_2, x_3))
\end{aligned}
$$

则称 $y_1$ 是关于 $x_1, x_2$ 的函数, $y_2$ 是关于 $x_2, x_3$ 的函数, $z$ 是关于 $x_1, x_2, x_3$ 的函数, 且由 $y_1, y_2$ 复合而成.

则通过 $x_1, x_2, x_3$ 按照图中复合函数一步一步计算 $z$ 的过程就是网络的前向传播过程.

### 梯度下降

从上面的图我们可以知道 $z$ 有三个输入参数, 假设 $z$ 就是网络最终的损失函数, 我们的目标就是不断调整这些参数, 使得损失减小, 也就是 $z$ 减小.

那么, 回忆高数最基本的知识, 如果一个函数存在最 (极) 小值, 那么该点的导数等于 0. 所以纯理论计算最暴力的方式就是对 $z$ 关于所有参数求导, 然后看所有参数极值点的组合, 最后得到 $z$ 的最小值.

但是上述方法不能充分利用计算机的优势, 就是数值计算, 并且很多时候函数十分复杂无法推导, 而且我们也不需要精确求出最小值, 只要接近某个极小值就行了, 因此有了梯度下降法.

所谓梯度, 简单理解就是函数的导数, 只不过是对每个参数都求偏导数, 所有参数的偏导数组合在一起就叫梯度. 而梯度所指向的参数变化方向永远使得整个函数值变大, 因此如果朝着梯度的反方向更新参数, 就会使得函数值减小.

例如我们知道了 $z$ 关于三个参数的梯度是 $(\frac{\partial{z}}{\partial{x_1}}, \frac{\partial{z}}{\partial{x_2}}, \frac{\partial{z}}{\partial{x_3}})$, 那么 $z(x_1 - \eta\frac{\partial{z}}{\partial{x_1}}, x_2 - \eta\frac{\partial{z}}{\partial{x_2}}, x_3 - \eta\frac{\partial{z}}{\partial{x_3}})$ 小于 $z(x_1, x_2, x_3)$, 其中 $\eta$ 可以视作"学习率", 取一个相对较小的值.

### 链式法则与反向传播

知道了梯度下降的基本原理之后, 我们下一步目标就是高效的求解梯度.

先说链式法则, 这个内容也是高数的基本知识, 在此回顾一下.

例如要求 $z$ 的所有偏导数, 则:

$$
\begin{aligned}
  \frac{\partial{z}}{\partial{x_1}} &= \frac{\partial{z}}{\partial{y_1}}\frac{\partial{y_1}}{\partial{x_1}} \\\\
  \frac{\partial{z}}{\partial{x_2}} &= \frac{\partial{z}}{\partial{y_1}}\frac{\partial{y_1}}{\partial{x_2}} + \frac{\partial{z}}{\partial{y_2}}\frac{\partial{y_2}}{\partial{x_2}} \\\\
  \frac{\partial{z}}{\partial{x_3}} &= \frac{\partial{z}}{\partial{y_2}}\frac{\partial{y_2}}{\partial{x_3}}
\end{aligned}
$$

和上面的函数复合关系对应一下, 很容易就能看出链式求导逻辑, 然后可以按下图标记偏导数.

![backward.jpg](https://ww-rm.github.io/static/image/cnn-numpy-1/backward.jpg)

可以看出来整个网络图形成了一个树形结构, 也可称之为计算图, 其中树的根部是损失值, 而函数所有的输入参数是树的叶节点.

显然, 从算法角度考虑, 如果要复用中间结果, 减少计算量, 最佳方式就是总树的根部开始遍历每一个叶节点, 中途不断按照链式法则进行累加和累乘, 得到根节点关于每一个叶节点的偏导值.

由于这种梯度计算方式和前向计算 $z$ 的过程刚好相反, 因此得名反向传播算法. 只要在前向计算时构造好计算图, 则计算梯度时只需要反方向从计算图根部遍历叶节点即可算出所有参数的梯度值.

## 导入使用的库

下面的内容将使用 `numpy` 库手搓一个简单的卷积神经网络, 并进行训练和评估. 全篇代码需要导入的库如下所示:

```python
import time
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import PIL.Image
from sklearn.metrics import classification_report
```

`matplotlib.pyplot` 用来绘制损失曲线, `numpy` 提供神经网络所需要的矩阵计算, `PIL` 用来读取数据集, `sklearn.metrics` 里有一些评价分类任务的指标函数, 借用一下.

## 加载数据集

数据集使用一个较小的手写数字分类图片数据集, 之前文章里也一直用这个举例, 这里再贴一下蓝奏云下载地址, [手写数字分类.zip](https://ww-rm.lanzout.com/iTPkK09pfnha), 里面包含 10000 张训练数据和 5000 张测试数据.

```python
def load_dataset(folder, shuffle: bool = False):
    """加载数据集

    Returns:
        inputs: (B, C, H, W)
        targets: (B, )
    """

    inputs = []
    targets = []
    for num in range(10):
        for img_path in Path(folder, str(num)).iterdir():
            inputs.append(np.asarray(PIL.Image.open(img_path)))
            targets.append(num)

    inputs = np.stack(inputs, 0, dtype=np.float32) / 255
    targets = np.stack(targets, 0, dtype=np.int32)

    if len(inputs.shape) == 3:
        inputs = inputs[:, None, :, :]  # (B, C, H, W)

    if shuffle:
        rnd_index = np.arange(inputs.shape[0])
        for _ in range(10):
            np.random.shuffle(rnd_index)
        inputs = inputs[rnd_index]
        targets = targets[rnd_index]

    return inputs, targets
```

这里要注意的地方是, 为了之后网络能稳定训练, 不会出现梯度爆炸等奇怪的问题, 像素值被转换到 0-1 的范围.

## 无参数网络层的实现

首先来实现网络中简单内容, 一些只有单纯函数计算的层.

对于网络中的层, 我们需要实现前向和反向两个功能即可, 因此先声明基类 `NetworkLayer`.

```python
class NetworkLayer:
    def forward(self, x: np.ndarray) -> np.ndarray:
        raise NotImplementedError

    def backward(self, x: np.ndarray, last_x_grad: np.ndarray) -> np.ndarray:
        raise NotImplementedError
```

只有两个方法, `forward` 和 `bacckward`, 分别代表前向和反向计算, 而这两个方法的输入输出有以下关系.

- `forward` 的输入 `x` 形状等于反向的输出形状, 返回值为函数计算值.
- `backward` 的输入 `last_x_grad` 形状等于前向的输出形状, 返回值为上一层输入的梯度.

{% note info -%}

其实更完备的反向传播做法并不是直接返回 $x$ 的梯度, 因为计算图中可能存在需要梯度累加的情况, 构建完整的图然后遍历才是正确的做法.

但是由于本文要实现的卷积神经网络, 整个计算图只有一条路径, 并且以 $x$ 为主线路, 所以关于 $x$ 的梯度可以直接被返回依次向前传递, 同时在每次求解各个参数的梯度时, 也不必进行累加, 直接清空重新赋值即可, 这一点在后续的代码实现中可以看到.

{%- endnote %}

### Pooling

在卷积神经网络中, 我们需要用到最大池化层, 这里我们简单起见, 只实现核大小等于两个方向上步长且能整除图片宽高的情况. 以图片大小 $6 \times 4$, 核大小为 $3 \times 2$ 举例, 池化过程如下图所示.

![pooling.jpg](https://ww-rm.github.io/static/image/cnn-numpy-1/pooling.jpg)

对于前向传播, 虚线是使用循环遍历的方式求解, 而实线则是通过数组变形使用矩阵方式求解.

我们本篇代码实现里, 对于所有计算均采用矩阵化形式实现, 每一小节都有详细的讲解. 因此只看实线部分即可.

重点关注反向传播, 对于池化操作而言, 池化后的值被原封不动的传递到下一层, 相当于是 $y = x$ 函数, 因此这些值在这一层的梯度为 1. 而没有被传递的值, 相当于是常数函数 $y = 0$, 因此梯度值为 0.

```python
class MaxPoolingLayer(NetworkLayer):
    """步长与核大小相同的最大池化层"""

    def __init__(self, k1: int, k2: int) -> None:
        self.k1 = k1
        self.k2 = k2

    def forward(self, x: np.ndarray) -> np.ndarray:
        """
        Args:
            x: (B, C, H, W)

        Returns:
            x: (B, C, H / k1, W / k2)
        """

        _, c, h, w = x.shape
        k1 = self.k1
        k2 = self.k2
        o1 = h // k1
        o2 = w // k2

        x = x.reshape(-1, o1, k1, o2, k2).transpose(0, 1, 3, 2, 4).reshape(-1, k1 * k2)
        ridx = np.arange(x.shape[0])
        cidx = np.argmax(x, axis=-1)

        x = x[ridx, cidx].reshape(-1, c, o1, o2)
        return x

    def backward(self, x: np.ndarray, last_x_grad: np.ndarray) -> np.ndarray:
        """
        Args:
            x: (B, C, H, W)
            last_x_grad: (B, C, H / k1, W / k2)

        Returns:
            x_grad: (B, C, H, W)
        """

        _, c, h, w = x.shape
        k1 = self.k1
        k2 = self.k2
        o1 = h // k1
        o2 = w // k2

        x = x.reshape(-1, o1, k1, o2, k2).transpose(0, 1, 3, 2, 4).reshape(-1, k1 * k2)
        ridx = np.arange(x.shape[0])
        cidx = np.argmax(x, axis=-1)

        x_grad: np.ndarray = np.zeros_like(x).reshape(-1, k1 * k2)
        x_grad[ridx, cidx] = last_x_grad.reshape(-1)
        x_grad = x_grad.reshape((-1, o1, o2, k1, k2)).transpose((0, 1, 3, 2, 4)).reshape((-1, c, h, w))
        return x_grad
```

注意这里的输入输出都是包含样本数和通道数的, 但是没关系, 我们当作有 $B \times C$ 张二维图片即可, `numpy` 会自动把我们的步骤按单张图片进行批量操作.

### ReLU

ReLU 是本文卷积神经网络中将要使用的激活函数, 它的表达式为:

$$
ReLU(x) = \left\\{
  \begin{aligned}
    x \quad x > 0 \\\\
    0 \quad x \leq 0
  \end{aligned}
  \right.
$$

然后对应的导数表达式为:

$$
ReLU'(x) = \left\\{
  \begin{aligned}
    1 \quad x > 0 \\\\
    0 \quad x \leq 0
  \end{aligned}
  \right.
$$

可以看到, 无论是函数还是导函数, 就是一个分段函数, 因此实现起来也是比较容易的.

对于前向过程, 将小于等于 0 的部分置零, 对于反向部分, 将输入中小于等于 0 部分的梯度置零, 其余梯度按原值传递即可.

```python
class ReLULayer(NetworkLayer):
    """ReLU"""

    def forward(self, x: np.ndarray) -> np.ndarray:
        """"""
        return x * (x > 0)

    def backward(self, x: np.ndarray, last_x_grad: np.ndarray) -> np.ndarray:
        """"""
        return last_x_grad * (x > 0)
```

### Flatten

在我们网络的末尾, 全连接层的之前, 需要一个 Flatten 层, 它能够将二维的样本展平成一维, 从而送进全连接层进行最后的分类.

这里的前向和反向就十分简单了, 这是一个等值函数, 只需要对输入输出进行维度变换就能完成正确的计算过程.

```python
class FlattenLayer(NetworkLayer):
    """Flatten"""

    def __init__(self, start: int = 1, end: int = -1) -> None:
        self.start = start
        self.end = end

    def forward(self, x: np.ndarray) -> np.ndarray:
        """"""
        shape = x.shape
        shapen_len = len(shape)
        start = (self.start + shapen_len) % shapen_len
        end = (self.end + shapen_len) % shapen_len

        return x.reshape(shape[:start] + (-1, ) + shape[end + 1:])

    def backward(self, x: np.ndarray, last_x_grad: np.ndarray) -> np.ndarray:
        """"""
        return last_x_grad.reshape(x.shape)
```

## 小结

受限于篇幅问题, 本文到此就暂告一段落了. 在本篇中, 我们完成了对数据集的加载和简单的预处理, 同时回顾了神经网络的基本原理并实现了简单的无参数网络层, 包括一些变换和激活函数等等.

下一篇中, 我们将实现卷积神经网络中用到的两个有参数网络层, 线性层和卷积层, 并且完成对它们前向和反向过程的推导, 以及网络的最后一层, 损失函数的推导和实现.

本系列文章传送门:

- [基于 NumPy 的手写数字识别 (卷积神经网络) (一)][1]
- [基于 NumPy 的手写数字识别 (卷积神经网络) (二)][2]
- [基于 NumPy 的手写数字识别 (卷积神经网络) (三)][3]

[1]: /posts/2023/10/13/cnn-numpy-1/
[2]: /posts/2023/10/14/cnn-numpy-2/
[3]: /posts/2023/10/15/cnn-numpy-3/
