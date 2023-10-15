---
title: 基于 NumPy 的手写数字识别 (卷积神经网络) (二)
categories:
  - "代码块"
tags:
  - "矩阵求导"
  - "卷积矩阵化"
  - "交叉熵损失函数"
  - "深度学习"
date: 2023-10-14 16:17:10
mathjax: true
---

> "基于 numpy 的手写数字识别", 这一经典问题除了用作深度学习入门内容, 还被广泛作为各大课程的课程作业, 因此在各大搜索引擎上搜索率也是相当之高~~(代码复用率也是相当之高)~~. 网上确实有挺多现成的可使用代码, 但是大部分都是造的全连接网络, 并且很多时候内部原理不是特别清晰. 因此决定自己也来造一次轮子, 使用 `numpy` 实现一个简单的卷积神经网络进行手写数字识别, 正好也能借此机会梳理一下神经网络的基本原理.
>
> 全文包含完整的卷积网络实现, 以及矩阵梯度和卷积矩阵化的推导过程, 由于全文过长, 因此分成了三部分, 内容上是完全连着的.

本文为第二篇, 介绍含参数网络层和损失函数的实现, 以及反向传播时的梯度推导.

<!-- more -->

本系列文章传送门:

- [基于 NumPy 的手写数字识别 (卷积神经网络) (一)][1]
- [基于 NumPy 的手写数字识别 (卷积神经网络) (二)][2]
- [基于 NumPy 的手写数字识别 (卷积神经网络) (三)][3]

## 含参数网络层

上一篇中我们结束了无参数网络层的内容, 我们来到网络的重点部分, 含参数层. 这一类层依然需要实现 `forward` 和 `backward` 方法, 但是在 `backward` 方法中需要计算自己拥有的参数的梯度值并存起来, 同时需要新增 `update` 方法, 用于按照梯度值更新自己的参数.

```python
class ParamLayer(NetworkLayer):
    def update(self, lr: float) -> None:
        raise NotImplementedError
```

继承一下 `NetworkLayer` 类, 并且增加一个 `update` 方法, 该方法接收学习率 `lr` 作为参数.

### Linear

首先是线性层, 也是含学习参数中最简单的层, 先上图.

![linear.jpg](https://ww-rm.github.io/static/image/cnn-numpy-2/linear.jpg)

方便起见, 这里我们的输入都是行向量的形式, 因此第一维是样本数, 第二维是特征数.

一般的, 设 $\mathbf{X}$ 为一个 $n \times d_1$ 的矩阵, 权重 $\mathbf{W}$ 为一个 $d_1 \times d_2$ 的矩阵, $\mathbf{b}$ 为长度 $d_2$ 的偏置向量, 则 $\mathbf{Y}, \mathbf{Z}$ 均为 $n \times d_2$. 线性层的可学习参数就是 $\mathbf{W}$ 和 $\mathbf{b}$.

图上高亮部分表示对最终输出 $z_{11}$ 的计算过程, 而对 $z_{ik}$ 的计算过程用公式表示如下:

$$
z_{ik} = \sum_{j=1}^{d_1}{x_{ij}w_{jk}} + b_k
$$

写成矩阵形式就是:

$$
\mathbf{Z} = \mathbf{X}\mathbf{W} + \mathbf{b}
$$

其中 $\mathbf{b}$ 需要重复每一行扩展成矩阵.

前向计算就到此结束了, 下面我们看看反向中梯度是如何计算的.

首先是 $\mathbf{b}$ 的, 这一层中, 对于 $b_k$ 而言, 因为是加上常数, 所以都是 1, 因此只需要直接等于上一层传进来的梯度即可. 再由链式法则里的加法法则可知, 同一个 $b_k$ 每个样本中都参与了运算, 因此需要把后一层传过来的梯度进行累加.

设最终损失为 $L$, 则:

$$
\begin{aligned}
  \frac{\partial{L}}{\partial{b_k}} &= \sum_{i=1}^{n}{\frac{\partial{L}}{\partial{z_{ik}}}\frac{\partial{z_{ik}}}{\partial{b_k}}} \\\\
  ~ &= \sum_{i=1}^{n}{\frac{\partial{L}}{\partial{z_{ik}}}} \cdot 1
\end{aligned}
$$

所以 $\mathbf{b}$ 的梯度就是把后一层传进来关于 $z$ 的梯度按行累加即可.

下面来看关于 $\mathbf{W}$ 的梯度. 在 $z_{ik}$ 的表达式中, $b_k$ 作为常数存在, 因此可以忽略, 所以梯度只与 $x_{ij}$ 有关, 所以我们第一步是找出来含有 $w_{jk}$ 的结果有哪些.

注意到 $w_{jk}$ 是不包含下标 $i$ 的, 因此在 $z_{1k}, z_{2k}, \ldots, z_{nk}$ 中都是有 $w_{jk}$ 的. 所以:

$$
\begin{aligned}
  \frac{\partial{L}}{\partial{w_{jk}}} &= \sum_{i=1}^{n}{\frac{\partial{L}}{\partial{z_{ik}}}\frac{\partial{z_{ik}}}{\partial{w_{jk}}}} \\\\
  ~ &= \sum_{i=1}^{n}{\frac{\partial{L}}{\partial{z_{ik}}}x_{ij}}
\end{aligned}
$$

换成矩阵形式则是:

$$
\frac{\partial{L}}{\partial{\mathbf{W}}} = \mathbf{X}^\top\frac{\partial{L}}{\partial{\mathbf{Z}}}
$$

其中 $\frac{\partial{L}}{\partial{\mathbf{Z}}}$ 是最终损失 $L$ 对 $z_{ik}$ 的梯度矩阵, 形状与 $\mathbf{Z}$ 相同.

最后我们来看关于 $\mathbf{X}$ 的梯度, 有了求 $\mathbf{W}$ 梯度的经验, 我们很容易写出下列推导:

$$
\begin{aligned}
  \frac{\partial{L}}{\partial{x_{ij}}} &= \sum_{k=1}^{d_2}{\frac{\partial{L}}{\partial{z_{ik}}}\frac{\partial{z_{ik}}}{\partial{x_{ij}}}} \\\\
  ~ &= \sum_{k=1}^{d_2}{\frac{\partial{L}}{\partial{z_{ik}}}w_{jk}}
\end{aligned}
$$

同样可以换成矩阵形式:

$$
\frac{\partial{L}}{\partial{\mathbf{X}}} = \frac{\partial{L}}{\partial{\mathbf{Z}}}\mathbf{W}^\top
$$

到这里我们已经完成对线性层的前向和反向过程推导, 矩阵形式的公式总结就是:

前向:

$$
\mathbf{Z} = \mathbf{X}\mathbf{W} + \mathbf{b}
$$

反向:

$$
\begin{aligned}
    \frac{\partial{L}}{\partial{b_k}} &= \sum_{i=1}^{n}{\frac{\partial{L}}{\partial{z_{ik}}}} \\\\
    \frac{\partial{L}}{\partial{\mathbf{W}}} &= \mathbf{X}^\top\frac{\partial{L}}{\partial{\mathbf{Z}}} \\\\
    \frac{\partial{L}}{\partial{\mathbf{X}}} &= \frac{\partial{L}}{\partial{\mathbf{Z}}}\mathbf{W}^\top
\end{aligned}
$$

这个结论很重要, 在卷积层中还会用到.

然后我们可以按照公式完成线性层的代码.

```python
class LinearLayer(ParamLayer):
    """线性层"""

    def __init__(self, d1: int, d2: int) -> None:
        self.w = np.random.random((d1, d2)) * 2 - 1
        self.b = np.random.random((1, d2)) * 2 - 1

        self.w_grad = np.zeros_like(self.w)
        self.b_grad = np.zeros_like(self.b)

    def forward(self, x: np.ndarray) -> np.ndarray:
        """
        Args:
            x: (B, d1)

        Returns:
            x: (B, d2)
        """

        return x @ self.w + self.b

    def backward(self, x: np.ndarray, last_x_grad: np.ndarray) -> np.ndarray:
        """
        Args:
            x: (B, d1)
            last_grad: (B, d2)

        Returns:
            x_grad: (B, d1)
        """

        self.b_grad = last_x_grad.sum(0, keepdims=True)
        self.w_grad = x.T @ last_x_grad

        x_grad = last_x_grad @ self.w.T

        return x_grad

    def update(self, lr: float) -> None:
        self.w -= lr * self.w_grad
        self.b -= lr * self.b_grad
```

`update` 方法就是按学习率 `lr` 给每个参数减去相应的梯度就行了.

一个值得注意的地方是 `__init__` 中, 对 `w` 和 `b` 的初始化是使用了 -1 到 1 之间的均匀分布, 这有助于训练的稳定性, 防止出现梯度爆炸.

### Convolution

这里我们只实现步长为 1 的无填充卷积操作.

#### 卷积及其参数维度

卷积层是整个网络的核心层, 网络也因此得名卷积神经网络, 用下图来简单回顾一下网络里的卷积操作.

![conv.jpg](https://ww-rm.github.io/static/image/cnn-numpy-2/conv.jpg)

卷积核 $\mathbf{K}$ 在输入 $\mathbf{X}$ 上逐步移动, 将每个位置上的值相乘并求和, 得到卷积后的结果 $\mathbf{Y}$, 然后对于每一次卷积都加上一个偏置常数 $b$, 得到网络中对于单张图片单通道的完整卷积过程.

如果是多通道的情况, 设输入 $\mathbf{X}$ 的通道数是 $c_1$, 输出通道数是 $c_2$.

输入 $\mathbf{X}$ 的形状变为 $n \times c_1 \times h_\mathbf{X} \times w_\mathbf{X}$, 其中 $n$ 是样本数, $h_\mathbf{X}, w_\mathbf{X}$ 分别是图片的高宽.

那么对于 $\mathbf{K}$ 而言, 输入通道数从 $1$ 变成 $c_1$, 所以每一次卷积都需要 $c_1$ 个单层的 $\mathbf{K}$. 进一步, 输出通道数从 $1$ 变成 $c_2$, 因此总共需要 $c_2 \times c_1$ 个单层卷积核. 所以最终卷积核 $\mathbf{K}$ 的形状为 $c_2 \times c_1 \times h_\mathbf{K} \times w_\mathbf{K}$, 其中 $h_\mathbf{K}, w_\mathbf{K}$ 分别表示卷积核的高宽.

对于 $b$ 而言, 只和输出通道数有关, 因此变成了一个长度为 $c_2$ 向量 $\mathbf{b}$, 在其他维度上重复数值即可.

在卷积层中, $\mathbf{K}$ 和 $\mathbf{b}$ 就是需要被学习的参数.

#### 卷积矩阵化

基本的卷积操作需要多重循环, 无法充分利用 GPU 等硬件设备的加速效果, 因此需要将常规的卷积操作转化成矩阵形式, 从而批量运算.

有两种数据重组方式可以达到同样的效果, 分别是对输入 $\mathbf{X}$ 和卷积核 $\mathbf{K}$ 进行数据重组. 首先介绍第一种方式, 对 $\mathbf{X}$ 进行数据重组, 而 $\mathbf{K}$ 只需要保持数据不变, 维度变换即可.

![unfold_x.jpg](https://ww-rm.github.io/static/image/cnn-numpy-2/unfold_x.jpg)

上图展示的是对于一个样本下矩阵化运算, 如果是 $n$ 个样本, $\mathbf{X'}$ 和 $\mathbf{Y'}$ 在行上变成 $n$ 倍即可.

这里, $h_{\mathbf{Y}} = h_{\mathbf{X}} - h_{\mathbf{K}} + 1$, $w_{\mathbf{Y}} = w_{\mathbf{X}} - w_{\mathbf{K}} + 1$, 是卷积后的图像高宽.

在这种情况下, 变形后的 $\mathbf{K}'$ 和原始的 $\mathbf{K}$ 数据相同, 前向公式为:

$$
\mathbf{Y}' = \mathbf{X}'\mathbf{K}'^\top
$$

第二种方式则是只对输入数据 $\mathbf{X}$ 进行变形, 对卷积核 $\mathbf{K}$ 进行数据重组.

![unfold_k.jpg](https://ww-rm.github.io/static/image/cnn-numpy-2/unfold_k.jpg)

图太大画不下, 所以中间部分用省略号省去, 只保留了一些关键内容和维度信息.

同样的, 这里也是展示了对于一个样本的矩阵化运算.

图片被完全展平, 而卷积核被重组成中间包含一些 0 值的矩阵. 在这种情况下, $\mathbf{X}''$ 和原本的 $\mathbf{X}$ 内容完全相同. 前向公式为:

$$
\mathbf{Y}'' = \mathbf{X}''\mathbf{K}''^\top
$$

#### 梯度计算

卷积层的梯度计算都是基于矩阵化之后的卷积操作. 首先是偏置向量 $\mathbf{b}$ 的梯度计算, 前向中有两种方式能算出 $\mathbf{Y}$, 但是通过数据变形后, 与 $\mathbf{b}$ 的相加方式相同, 结合前面线性层的结论, $\mathbf{b}$ 的梯度就是将除了 $c_2$ 的其他维度求和即可.

现在我们来看最关键的 $\mathbf{K}$ 和 $\mathbf{X}$ 的梯度怎么求, 首先回忆线性层得到的结论.

{% note info -%}

设最终的损失为 $L$, 当前向传播为:

$$
\mathbf{Y} = \mathbf{X}\mathbf{W}
$$

时, 则反向传播 $\mathbf{X}$ 和 $\mathbf{W}$ 的梯度为:

$$
\begin{aligned}
    \frac{\partial{L}}{\partial{\mathbf{W}}} &= \mathbf{X}^\top\frac{\partial{L}}{\partial{\mathbf{Y}}} \\\\
    \frac{\partial{L}}{\partial{\mathbf{X}}} &= \frac{\partial{L}}{\partial{\mathbf{Y}}}\mathbf{W}^\top
\end{aligned}
$$

其中 $\frac{\partial{L}}{\partial{\mathbf{Y}}}$ 是损失 $L$ 对输出 $\mathbf{Y}$ 的损失矩阵, 形状与 $\mathbf{Y}$ 相同.

{%- endnote %}

这是一个通用结论, 可以用于任意的两个矩阵相乘. 结合我们前面得到了两种不同的前向计算方式:

$$
\begin{aligned}
  \mathbf{Y}' &= \mathbf{X}'\mathbf{K}'^\top \\\\
  \mathbf{Y}'' &= \mathbf{X}''\mathbf{K}''^\top
\end{aligned}
$$

在这两个不同的计算中, $\mathbf{K}'$ 与原始的 $\mathbf{K}$ 相同, $\mathbf{X}''$ 与原始的 $\mathbf{X}$ 数据相同, 只是进行了数据变形. 因此只要分别求出 $\mathbf{K}'$ 和 $\mathbf{X}''$ 的梯度, 再通过变形就能得到原始 $\mathbf{K}$ 和 $\mathbf{X}$ 的梯度. 结合结论, 有:

$$
\begin{aligned}
    \frac{\partial{L}}{\partial{\mathbf{K}'}} &= \mathbf{X}'^\top\frac{\partial{L}}{\partial{\mathbf{Y}'}} \\\\
    \frac{\partial{L}}{\partial{\mathbf{X}''}} &= \frac{\partial{L}}{\partial{\mathbf{Y}''}}\mathbf{K}''^\top
\end{aligned}
$$

其中, $\frac{\partial{L}}{\partial{\mathbf{Y}'}}$ 和 $\frac{\partial{L}}{\partial{\mathbf{Y}''}}$ 都可以通过对后一层传进来的 $\frac{\partial{L}}{\partial{\mathbf{Y}}}$ 进行数据变形得到.

#### 代码

到这里我们已经完成了卷积层的前向和反向推导, 按照前面的内容便可完成代码.

```python
class ConvolutionLayer(ParamLayer):
    """步长为 1 的卷积层"""

    def __init__(self, c1: int, c2: int, k1: int, k2: int) -> None:
        """
        Args:
            c1: 输入通道数
            c2: 输出通道数
            k1: 卷积核高
            k2: 卷积核宽
        """

        self.k = np.random.random((c2, c1, k1, k2)) * 2 - 1
        self.b = np.random.random((1, c2, 1, 1)) * 2 - 1
        self.k_grad = np.zeros_like(self.k)
        self.b_grad = np.zeros_like(self.b)

    def _unfold_k(self, h: int, w: int, c1: int, c2: int, k1: int, k2: int, o1: int, o2: int) -> np.ndarray:
        """展开卷积核 k, 能够与展平的多通道图像直接相乘

        Returns:
            k: (c2 * o1 * o2, c1 * H * W)
                有 c2 个 (o1 * o2, c1 * H * W) 的展平卷积核, 每一个核大小是 c1 * H * W, 将在一张 c1 通道的一维图片上进行 o1 * o2 次卷积
        """

        ridx = np.arange(o1 * o2).reshape(-1, 1).repeat(k1 * k2, 1)

        cidx1 = np.arange(o2).reshape(1, -1).repeat(k1 * k2, 1).repeat(o1, 0).reshape(o1 * o2, k1 * k2)
        cidx2 = np.arange(k2).reshape(1, -1).repeat(o1 * o2 * k1, 0).reshape(o1 * o2, k1 * k2)
        cidx3 = np.arange(0, k1 * w, w).reshape(1, -1).repeat(k2, 1).repeat(o1 * o2, 0)
        cidx4 = np.arange(0, o1 * w, w).reshape(-1, 1).repeat(o2, 0).repeat(k1 * k2, 1)
        cidx = cidx1 + cidx2 + cidx3 + cidx4

        k = np.zeros((c2, c1, o1 * o2, h * w))
        k[:, :, ridx, cidx] = self.k.reshape(c2, c1, 1, k1 * k2).repeat(o1 * o2, 2)
        k = k.transpose(0, 2, 1, 3).reshape(c2 * o1 * o2, c1 * h * w)

        return k

    def _unfold_x(self, x: np.ndarray, c1: int, k1: int, k2: int, o1: int, o2: int) -> np.ndarray:
        """展开输入 x, 能够与展平的卷积核直接相乘

        Args:
            x: (B, c1, H, W)

        Returns:
            x: (B, o1 * o2, c1 * k1 * k2)
                每张图片将与 c1 通道的一维卷积核进行 o1 * o2 次卷积
        """

        ridx_r = np.arange(k1).reshape(1, k1).repeat(k2, 1).repeat(o1 * o2, 0)
        ridx_c = np.arange(o1).reshape(o1, 1).repeat(o2, 0).repeat(k1 * k2, 1)
        ridx = ridx_r + ridx_c

        cidx_r = np.arange(k2).reshape(1, k2).repeat(k1, 0).reshape(1, -1).repeat(o1 * o2, 0)
        cidx_c = np.arange(o2).reshape(1, o2).repeat(o1, 0).reshape(-1, 1).repeat(k1 * k2, 1)
        cidx = cidx_r + cidx_c

        x = x[:, :, ridx, cidx].transpose(0, 2, 1, 3).reshape(-1, o1 * o2, c1 * k1 * k2)
        return x

    def forward(self, x: np.ndarray):
        """
        Args:
            x: (B, c1, H, W)

        Returns:
            x: (B, c2, o1, o2)
        """
        _, _, h, w = x.shape
        c2, c1, k1, k2 = self.k.shape
        o1 = h - k1 + 1
        o2 = w - k2 + 1

        # 展开卷积核
        output = x.reshape(-1, c1 * h * w) @ self._unfold_k(h, w, c1, c2, k1, k2, o1, o2).T
        output = output.reshape(-1, c2, o1, o2) + self.b
        return output

        # # 展开输入 (B, o1 * o2, c1 * k1 * k2) @ (c1 * k1 * k2, c2) = (B, o1 * o2, c2)
        # output = self._unfold_x(x, c1, k1, k2, o1, o2) @ self.k.reshape(c2, c1 * k1 * k2).T
        # output = output.transpose(0, 2, 1).reshape(-1, c2, o1, o2) + self.b
        # return output

    def backward(self, x: np.ndarray, last_x_grad: np.ndarray) -> np.ndarray:
        """
        Args:
            x: (B, c1, H, W)
            last_x_grad: (B, c2, o1, o2)

        Returns:
            x_grad: (B, c1, H, W)
        """

        _, _, h, w = x.shape
        c2, c1, k1, k2 = self.k.shape
        o1 = h - k1 + 1
        o2 = w - k2 + 1

        unfold_x = self._unfold_x(x, c1, k1, k2, o1, o2)
        unfold_k = self._unfold_k(h, w, c1, c2, k1, k2, o1, o2)

        self.b_grad = last_x_grad.sum((0, 2, 3), keepdims=True)
        self.k_grad = unfold_x.reshape(-1, c1 * k1 * k2).T @ last_x_grad.transpose(0, 2, 3, 1).reshape(-1, c2)
        self.k_grad = self.k_grad.transpose().reshape(c2, c1, k1, k2)

        x_grad = last_x_grad.reshape(-1, c2 * o1 * o2) @ unfold_k
        x_grad = x_grad.reshape(-1, c1, h, w)
        return x_grad

    def update(self, lr: float):
        self.k -= lr * self.k_grad
        self.b -= lr * self.b_grad
```

这里的 `_unfold_k` 和 `_unfold_x` 就是对卷积核 $\mathbf{K}$ 和输入 $\mathbf{X}$ 进行数据重组的方法, 可以用于不同的前向和反向梯度计算. 前向中实现两种矩阵化方法的一种就行, 而反向中则需要同时使用两个方法来计算参数梯度.

## 损失函数层

最后是网络的损失函数, 从 `Linear` 层往后, 将网络的输出与真实标签进行损失计算.

这里我们实现分类任务最常用的损失函数, 交叉熵损失函数, 它的前向和反向所需要的参数与前面的网络层有一些小的区别, 均需要输入真实标签值.

### CrossEntropy

首先上交叉熵损失的公式. 损失计算从线性层的输出开始, 设函数输入为 $\mathbf{X}$, 形状为 $n \times C$, 真实标签 $\mathbf{y}$ 为长度是 $n$ , 取值范围 $[1, C]$ 的向量, 则损失 $L$:

$$
\begin{aligned}
  L &= \frac{1}{n} \sum_{i=1}^{n} {\left( -\log\left( \frac{\exp\left( {x_{i y_i}} \right)}{\sum_{j=1}^{C}{\exp\left(x_{ij}\right)}} \right) \right)} \\\\
  ~ &= \frac{1}{n} \sum_{i=1}^{n} {\left( -\log\left( \frac{\exp\left({x_{i y_i} - \max_{j=1}^{C}{x_{ij}}}\right)}{\sum_{j=1}^{C}{\exp\left(x_{ij} - \max_{j=1}^{C}{x_{ij}} \right)}} \right) \right)} \\\\
  ~ &= \frac{1}{n} \sum_{i=1}^{n} {\left( \log\left( \sum_{j=1}^{C}{\exp\left(x_{ij} - \max_{j=1}^{C}{x_{ij}} \right)} \right) - \left({x_{i y_i} - \max_{j=1}^{C}{x_{ij}}}\right) \right)} \\\\
  ~ &= \frac{1}{n} \sum_{i=1}^{n} {\left( \log\left( \sum_{j=1}^{C}{\exp\left(x_{ij}' \right)} \right) - x_{i y_i}' \right)}
\end{aligned}
$$

详细的原理就不说了, 网上都有, 这里说一下为什么要给每个 $x$ 减去 $\max_{j=1}^{C}{x_{ij}}$, 因为中间用到了指数函数, 所以为了防止数据溢出, 将数据都变换到小于等于 0 的区间, 这样指数函数的值域就在 $(0, 1]$, 容易看出来这种变换是等价不影响计算结果的.

前向计算就这样了, 然后看反向梯度计算. 注意到最外层是将每个样本的 "小损失 $L_i$" 进行了求和平均, 所以我们先看求和符号内每一个样本的值如何求梯度.

掏出高中求导知识, 很容易得到:

$$
\frac{\partial{L_i}}{\partial{x_{ij}}} = \left\\{
  \begin{aligned}
    & \frac{\exp{(x_{ij}')}}{\sum_{j=1}^{C}{\exp\left(x_{ij}' \right)}}     & , ~ & j \neq y_i \\\\
    & \frac{\exp{(x_{ij}')}}{\sum_{j=1}^{C}{\exp\left(x_{ij}' \right)}} - 1 & , ~ & j = y_i
  \end{aligned}
\right.
$$

这里为了防止数据溢出, 同样使用 $x'_{ij}$ 而不是原始输入值.

最后, 由于求和平均的关系, 整个梯度也需要乘上一个系数, 因此有最终的梯度计算公式:

$$
\begin{aligned}
  \frac{\partial{L}}{\partial{x_{ij}}} &= \frac{\partial{L}}{\partial{L_i}}\frac{\partial{L_i}}{\partial{x_{ij}}} \\\\
  ~ &= \frac{1}{n}\frac{\partial{L_i}}{\partial{x_{ij}}} \\\\
  ~ &= \left\\{
  \begin{aligned}
    & \frac{1}{n}\left( \frac{\exp{(x_{ij}')}}{n\sum_{j=1}^{C}{\exp\left(x_{ij}' \right)}} \right) & , ~ & j \neq y_i \\\\
    & \frac{1}{n}\left( \frac{\exp{(x_{ij}')}}{n\sum_{j=1}^{C}{\exp\left(x_{ij}' \right)}} - 1 \right) & , ~ & j = y_i
  \end{aligned}
\right.
\end{aligned}
$$

至此, 损失函数的前向和反向都已经推导完成, 然后完成代码实现.

```python
class CrossEntropyLoss(NetworkLayer):
    """"""

    def forward(self, x: np.ndarray, y: np.ndarray) -> float:
        """
        Args:
            x: (B, C)
            y: (B, )

        Returns:
            loss: float number
        """
        x = x - x.max(-1, keepdims=True)
        loss = np.log(np.exp(x).sum(-1)) - x[np.arange(x.shape[0]), y]

        return float(loss.mean())

    def backward(self, x: np.ndarray, y: np.ndarray) -> np.ndarray:
        """
        Args:
            x: (B, C)
            y: (B, )

        Returns:
            x_grad: (B, C)
        """
        exp_x = np.exp(x - x.max(-1, keepdims=True))
        x_grad = exp_x / exp_x.sum(-1, keepdims=True)
        x_grad[np.arange(x.shape[0]), y] -= 1
        x_grad /= x.shape[0]

        return x_grad
```

## 小结

本篇到此结束, 我们终于完成了网络需要的所有基础结构. 而下一篇, 也是最后一篇, 我们将把这些零件拼接起来, 组合出最终的卷积神经网络, 并完成对网络的训练和评估.

本系列文章传送门:

- [基于 NumPy 的手写数字识别 (卷积神经网络) (一)][1]
- [基于 NumPy 的手写数字识别 (卷积神经网络) (二)][2]
- [基于 NumPy 的手写数字识别 (卷积神经网络) (三)][3]

[1]: /posts/2023/10/13/cnn-numpy-1/
[2]: /posts/2023/10/14/cnn-numpy-2/
[3]: /posts/2023/10/15/cnn-numpy-3/
