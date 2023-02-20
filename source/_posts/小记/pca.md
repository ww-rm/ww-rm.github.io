---
title: PCA 算法原理与实现
tags:
  - "数据降维"
categories:
  - "数据分析"
date: 2023-02-18 23:20:08
mathjax: true
---

PCA 算法, 也就是主成分分析法 (Principal Component Analysis), 是一种数据降维算法, 能够在尽可能保留数据特征的同时压缩数据, 降低数据复杂度, 便于数据分析的进行.

本文简要介绍 PCA 算法的基本思想与数学推导, 并在文末提供对应的 `python` 实现.

<!-- more -->

## 问题定义

有一组 $p$ 维向量 $X_{n \times p} = \begin{bmatrix}
  \boldsymbol{x}\_1 \\\\
  \boldsymbol{x}\_2 \\\\
  \vdots \\\\
  \boldsymbol{x}\_n
\end{bmatrix} = \begin{bmatrix}
  x\_{11} & x\_{12} & \ldots & x\_{1p} \\\\
  x\_{21} & x\_{22} & \ldots & x\_{2p} \\\\
  \vdots & \vdots & \ddots & \vdots \\\\
  x\_{n1} & x\_{n2} & \ldots & x\_{np}
\end{bmatrix}$, 需要通过一种方法使得它们变成一组 $q~(q < p)$ 维向量 $Y_{n \times q} = \begin{bmatrix}
  \boldsymbol{y}\_1 \\\\
  \boldsymbol{y}\_2 \\\\
  \vdots \\\\
  \boldsymbol{y}\_n
\end{bmatrix} = \begin{bmatrix}
  y\_{11} & y\_{12} & \ldots & y\_{1q} \\\\
  y\_{21} & y\_{22} & \ldots & y\_{2q} \\\\
  \vdots & \vdots & \ddots & \vdots \\\\
  y\_{n1} & y\_{n2} & \ldots & y\_{nq}
\end{bmatrix}$, 在降低维数的同时, 尽可能减少信息损失.

## 基本思想

### 信息重分配

对于一个向量 $\boldsymbol{x}\_i = \begin{pmatrix}x\_{i1}, x\_{i2}, \ldots, x\_{ip}\end{pmatrix}$, $p$ 个值代表了该向量在 $p$ 个方向上的不同特征, 而信息量大小的直接表现就是对数据的区分程度. 如果说在某一维上的值越能对不同的 $\boldsymbol{x}$ 进行区分, 则数据的**离散程度**就越大, 它所包含的信息量就越多, 最终这 $p$ 维共同完成了对 $X$ 所有数据的区分.

对于一组数据 $X$ 来说, 信息总量是确定的, 原始的 $X$ 中信息的分配方式是按某种分布分摊在 $p$ 个维度中.

因此, 在 PCA 方法中, 我们希望:

- 经过变换之后的数据 $Y$, 能够对每一维的信息含量进行调整, 可以将整体数据的信息量先尽可能的分配到第 1 维, 然后分配到第 2 维, 第 3 维, ..., 直到最后一维
- 在新的数据 $Y$ 中, 每一维之间的**关联性**尽可能小, 最好是不相关, 这样子就能让信息独立的被分配到每一维中, 不会在不同维之间产生维间信息.

上述有两个问题需要解决, 同一维之间的离散程度和不同维之间的关联性. 而在数学上, 方差和协方差可以很好的解决这两个问题.

### 降维

$X$ 是一个 $n \times p$ 的矩阵, 如果能找到一个 $q \times p$ 的矩阵 $W$ 满足对信息分配的要求, 对 $X$ 进行线性变换, 使得 $Y^T = WX^T$, 就可以得到降维后 $n \times q$ 的数据表示 $Y$.

$$
\begin{aligned}
  Y^T &= \begin{bmatrix}{\boldsymbol{y}_1}^T & {\boldsymbol{y}_2}^T & \ldots & {\boldsymbol{y}_n}^T\end{bmatrix} \\\\
  ~&= WX^T \\\\
  ~&= \begin{bmatrix}
    \boldsymbol{w}_1 \\\\
    \boldsymbol{w}_2 \\\\
    \vdots \\\\
    \boldsymbol{w}_q
  \end{bmatrix} \begin{bmatrix}{\boldsymbol{x}_1}^T & {\boldsymbol{x}_2}^T & \ldots & {\boldsymbol{x}_n}^T\end{bmatrix}
\end{aligned}
$$

## 数学推导

我们的目标是, 寻找一个 $W$ , 使得新数据 $Y^T$ 同一维上的方差最大化, 不同维之间的协方差最小化.

为了方便数据处理, 我们假设 $X$ 已经经过均值和方差的归一化处理, 即 $X = \frac{X - E(X)}{\sqrt{D(X)}}$, 这样子均值为 0, 方便后续计算.

首先是方差与协方差的公式:

$$
\begin{aligned}
  Cov(X, Y) &= E(XY) - E(X)E(Y) \\\\
  D(X) &= E(X^2) - E^2(X)
\end{aligned}
$$

因为数据已经经过归一化处理, 所以可以简化成:

$$
\begin{aligned}
  Cov(X, Y) &= E(XY) = \frac{1}{n}\sum_{i=1}^{n}x_iy_i \\\\
  D(X) &= E(X^2) = \frac{1}{n}\sum_{i=1}^{n}x_i^2
\end{aligned}
$$

现在, 需要把数据 $Y$ 的方差与协方差进行表示, 定义矩阵 $Y_{Cov}$ 为 $Y$ 的协方差矩阵, 有:

$$
\begin{aligned}
  Y_{Cov} &= \frac{1}{n}Y^TY \\\\
  ~&= \frac{1}{n} \begin{bmatrix}
    y_{11} & y_{21} & \ldots & y_{n1} \\\\
    y_{12} & y_{22} & \ldots & y_{n2} \\\\
    \vdots & \vdots & \ddots & \vdots \\\\
    y_{1q} & y_{2q} & \ldots & y_{nq}
  \end{bmatrix} \begin{bmatrix}
    y_{11} & y_{12} & \ldots & y_{1q} \\\\
    y_{21} & y_{22} & \ldots & y_{2q} \\\\
    \vdots & \vdots & \ddots & \vdots \\\\
    y_{n1} & y_{n2} & \ldots & y_{nq}
  \end{bmatrix} \\\\
  ~&= \begin{bmatrix}
    \frac{1}{n}\sum_{i=1}^{n}y_{i1}^2 & \frac{1}{n}\sum_{i=1}^{n}y_{i1}y_{i2} & \ldots & \frac{1}{n}\sum_{i=1}^{n}y_{i1}y_{iq} \\\\
    \frac{1}{n}\sum_{i=1}^{n}y_{i2}y_{i1} & \frac{1}{n}\sum_{i=1}^{n}y_{i2}^2 & \ldots & \frac{1}{n}\sum_{i=1}^{n}y_{i2}y_{iq} \\\\
    \vdots & \vdots & \ddots & \vdots \\\\
    \frac{1}{n}\sum_{i=1}^{n}y_{iq}y_{i1} & \frac{1}{n}\sum_{i=1}^{n}y_{iq}y_{i2} & \ldots & \frac{1}{n}\sum_{i=1}^{n}y_{iq}^2
  \end{bmatrix}
\end{aligned}
$$

可以看到协方差矩阵的主对角线上是 $q$ 个维度上的方差, 而其余位置则是两两之间的协方差, 并且协方差矩阵还是一个实对称矩阵. 所以我们的目标就是让 $Y_{Cov}$ 除了主对角线以外的部分尽量接近 0.

同理可以得到 $X_{Cov} = \frac{1}{n}X^TX$.

下面推导 $Y_{Cov}$ 与原始数据 $X$ 之间的关系.

$$
\begin{aligned}
  Y_{Cov} &= \frac{1}{n}Y^TY \\\\
    ~&= \frac{1}{n}(WX^T)(WX^T)^T \\\\
    ~&= \frac{1}{n}WX^TXW^T \\\\
    ~&= WX_{Cov}W^T
\end{aligned}
$$

结合我们的目标可以发现, $Y_{Cov}$ 的最优情况其实就是实对称矩阵 $X_{Cov}$ 的对角化矩阵, 而 $W$ 就是能够满足 $X_{Cov}$ 对角化的矩阵.

关于实对称矩阵的对角化, 线代里面有详细的介绍, 这里简单提一下结论.

{% note info %}
对于一个 $n \times n$ 的实对称矩阵 $D$, 一定可以找到 $n$ 个单位正交特征向量, 组成矩阵 $E = \begin{bmatrix}
\boldsymbol{e}_1 \\\\
  \boldsymbol{e}_2 \\\\
  \vdots \\\\
  \boldsymbol{e}_n
\end{bmatrix}$, 使得 $\Lambda = EDE^T = \begin{bmatrix}
  \lambda_1 & ~ & ~ & ~ \\\\
  ~ & \lambda_2 & ~ & ~ \\\\
  ~ & ~ & \ddots & ~ \\\\
  ~ & ~ & ~ &\lambda_n
\end{bmatrix}$, 其中 $\Lambda$ 是对角矩阵, 对角元素是特征向量对应的特征值.
{% endnote %}

因此, 对于实对称矩阵 $X_{Cov}$, 总能通过求其特征值与特征向量, 得到一个满足要求的 $W$ 使其对角化, 得到 $Y_{Cov}$.

到这里还没有完全结束, $X_{Cov}$ 是 $p$ 维实对称矩阵, 因此一定存在 $p$ 个特征值与特征向量, 而我们的目标是降维, 因此 $W$ 只需要选择其中的 $q$ 个特征向量组成一个 $q \times p$ 的矩阵即可.

从最后对角化的结果来看, $Y_{Cov}$ 的对角线上, 也就是新数据每一维的方差值, 其实就是 $W$ 按顺序特征向量对应的特征值. 那么为了充分保留原数据里的信息, 需要将特征向量按特征值大小进行降序排列, 然后依次选取前 $q$ 个特征向量去组成最终的 $W$ 矩阵.

## 代码实现

### 算法流程

输入: $X_{n \times p}$, $q$

输出: $Y_{n \times q}~(q \leq p)$

1. 对 $X$ 进行均值方差归一化.
2. 求解 $X_{Cov} = \frac{1}{n}X^TX$.
3. 求出 $X_{Cov}$ 的 $p$ 个特征值 $\lambda_1, \lambda_2, \ldots, \lambda_p$, 及其对应的特征向量 $\boldsymbol{w}_1, \boldsymbol{w}_2, \ldots, \boldsymbol{w}_p$.
4. 将 $\boldsymbol{w}_1, \boldsymbol{w}_2, \ldots, \boldsymbol{w}_p$ 按 $\lambda_1, \lambda_2, \ldots, \lambda_p$ 降序排列, 得到 $\boldsymbol{w}'_1, \boldsymbol{w}'_2, \ldots, \boldsymbol{w}'_p$.
5. 选取 $\boldsymbol{w}'_1, \boldsymbol{w}'_2, \ldots, \boldsymbol{w}'_q$, 组成变换矩阵 $W = \begin{bmatrix}
    \boldsymbol{w}'_1 \\\\
    \boldsymbol{w}'_2 \\\\
    \vdots \\\\
    \boldsymbol{w}'_q
  \end{bmatrix}$
6. 计算 $Y^T = WX^T$, 得到降维后的新数据 $Y$.

### 代码

```python
import numpy as np

def pca(X: np.ndarray, n_compnents: int) -> np.ndarray:
    n, p = X.shape
    q = n_compnents

    # normalization
    X = (X - np.mean(X, axis=0, keepdims=True)) / np.var(X, axis=0, keepdims=True)

    # covariance of x
    X_cov = (1 / n) * X.T @ X

    # compute eigenwerts and eigenvectors
    w, v = np.linalg.eigh(X_cov)

    # sort by descending order
    w = w[::-1]
    v = v[::-1]

    # choose top q vectors
    W = v[:q]

    # compute Y
    Y = (W @ X.T).T
    return Y
```
