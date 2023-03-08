---
title: NJ 树算法简介
tags:
  - "聚类算法"
  - "生信"
  - "NJ 树"
categories:
  - "数据分析"
date: 2023-03-08 21:54:27
mathjax: true
---

邻接法 (Neighbor-Joining Method), 是一种利用进化距离数据重建系统进化树的方法, 用这个方法得到的进化树通常称为 NJ 树. 这是一种自底向上的聚类方法, 将每个个体看作一个类别, 然后依次两两聚合, 最终得到一整个聚合后的进化树.

本文简要介绍 NJ 树算法的基本流程与计算方法.

<!-- more -->

## 基本定义

### 邻居

![ppVbSaR.png](https://s1.ax1x.com/2023/03/06/ppVbSaR.png)

首先是关于"邻居"的定义, 在 NJ 树中, 一对"邻居"指的是在一个无根分叉树中仅仅通过一个内部结点连接起来一对分类单元 (OTU).

例如在上图中, $1$ 和 $2$ 可以视为一对邻居, 它们通过内部结点 $A$ 进行连结.

进一步, 可以对分类单元进行组合, 形成新的更大的分类单元与邻居对, 例如, $<1, 2>$ 和 $3$ 可以作为一对邻居, 它们通过内部结点 $B$ 进行连结, $<5, 6>$ 和 $<7, 8>$ 可以作为一对邻居, 它们通过内部结点 $D$ 进行连结.

### 进化树构建流程

![ppVqOHJ.png](https://s1.ax1x.com/2023/03/06/ppVqOHJ.png)

假设初始时没有任何分类单元聚集在一起, 算法起始于一个星状树, 如上图左侧所示. 算法的一步变换则是将左图变成了右图.

在这些分类单元中, 分类单元之间有着不同的距离远近, 右侧的图将 $1$ 和 $2$ 聚合在了一起, 并形成了一个新结点 $Y$, 将 $1$, $2$ 视作一个整体, 则相比于左图, $<1, 2>$ 作为新分类单元整体替换了左图里的分类单元 $1$ 和 $2$, 整个星状树减少了 1 个分类单元, 增加了 1 条内部分支, 每次选择要聚合的邻居时, 都是使得聚合后的新树总枝长最短. 如此循环, 则可以一步一步减少星状树的分类单元, 直至分类单元只剩下 3 个, 内部分支增加至 $N - 3$ 个.

![ppVX9mD.png](https://s1.ax1x.com/2023/03/06/ppVX9mD.png)

## 算法流程

![ppVqOHJ.png](https://s1.ax1x.com/2023/03/06/ppVqOHJ.png)

### 计算总枝长

还是以这张图为例, 设初始时共有 $N$ 个分类单元, 设 $D_{ij}$ 指分类单元 $i$ 和 $j$ 之间的距离, $L_{ab}$ 指结点 $a$ 和 $b$ 之间的枝长. 整个树的总枝长为:

$$
S_O = \sum_{i=1}^{N}L_{iX}=\frac{1}{N-1}\sum_{i<j}^{N}D_{ij}
$$

也就是每个结点到 $X$ 的枝长总和, 等价于分类单元两两之间距离求和后除以 $N-1$, 因为每个枝相当于数了 $N-1$ 次.

{% note info "为什么是 $N-1$ ?" %}
$1$ 到 $X$ 的距离通过 $D_{ij}$ 数了 $N-1$ 次; $2$ 到 $X$ 的距离通过 $D_{12}$ 数了 $1$ 次, 通过 $D_{2j}$ 数了 $N-2$ 次, 以此类推.
{% endnote %}

### 计算新增枝长后的总枝长

另一方面, 右侧图中 $X$ 和 $Y$ 结点之间的枝长计算方法为:

$$
\begin{aligned}
  L_{XY} &= \frac{1}{2(N-2)}\left[\sum_{k=3}^{N}{(D_{1k}+D_{2k})} - {(N-2)(L_{1X}+L_{2X})} - {2\sum_{i=3}^{N}{L_{iY}}} \right] \\\\
  ~ &= \frac{1}{2(N-2)}\left[\sum_{k=3}^{N}{(D_{1k}+D_{2k})} - {(N-2)D_{12}} - {\frac{2}{N-3}\sum_{3 \leq i<j}^{N}D_{ij}} \right]
\end{aligned}
$$

第一项 $\sum_{k=3}^{N}{(D_{1k}+D_{2k})}$ 代表从结点 $1,2$ 到其余所有结点的距离, 包括 $L_{XY}$. 公式的后两项是为了减去多算的那部分距离, $(L_{1X}+L_{2X})$ 是 $1,2$ 到 $X$ 的距离, $\sum_{i=3}^{N}{L_{iY}}$ 是其余点到 $Y$ 的距离.

{% note info "前面的那些系数怎么来的 ?" %}
在第一项中, $\sum_{k=3}^{N}{(D_{1k}+D_{2k})}$ 将 $1,2$ 到 $X$ 的边各数了 $N-2$ 次, $X$ 到 $Y$ 的边数了 $2(N-2)$ 次, $Y$ 到其余结点各数了 $2$ 次, 因此减去对应的次数后再除以 $2(N-2)$ 就是 $L_{XY}$ 的距离.
{% endnote %}

得到 $L_{XY}$ 之后, 可以计算右侧新图的总枝长:

$$
\begin{aligned}
  S_{12} &= L_{XY} + (L_{1X} + L_{2X}) + \sum_{i=3}^{N}L_{iY} \\\\
  ~ &= \frac{1}{2(N-2)}\sum_{k=3}^{N}(D_{1k} + D_{2k}) + \frac{1}{2}D_{12} + \frac{1}{N-2}\sum_{3 \leq i<j}^{N}D_{ij}
\end{aligned}
$$

### 构造新图

通常来说, 并不会知道右图中 $1,2$ 究竟选择哪一对分类单元作为邻居, 因此需要计算所有的 $S_{ij}$, 并选择最小的那一对作为这一轮的选择.

假设 $1,2$ 就是这一轮选择出来的邻居, 则它们两个和 $X$ 会形成新的分类单元 $<1,2>$, 然后计算新分类单元与其余分类单元的距离:

$$
D_{<1,2>j} = \frac{1}{2}(D_{1j} + D_{2j}) \quad (3 \leq j \leq N)
$$

得到新距离之后, 还需要计算新分类单元 $<1,2>$ 内部的距离 $L_{1X}, L_{2X}$.

$$
\begin{aligned}
  L_{1X} &= \frac{1}{2}(D_{12} + D_{1Z} - D_{2Z}) \\\\
  L_{2X} &= \frac{1}{2}(D_{12} + D_{2Z} - D_{1Z})
\end{aligned}
$$

其中:

$$
\begin{aligned}
  D_{1Z} &= \frac{1}{N-2}\sum_{i=3}^{N}D_{1i} \\\\
  D_{2Z} &= \frac{1}{N-2}\sum_{i=3}^{N}D_{2i}
\end{aligned}
$$

在这一组公式里面, $Z$ 代表除去 $1,2$ 的所有结点形成的"假想结点", 即 $1$ 通过 $Z$ 这个整体与 $2$ 相连. 则 $1,2$ 与 $Z$ 的距离分别为各自到 $Z$ 中其余结点距离的平均值.

### 循环步骤

每选择一对合适的邻居, 则图上的分类单元就会减少 1 个, 直到图上的分类单元数量变成 3, 算法结束.

## 公式化简

在实际计算之前, 需要对原始公式进行一些化简变形.

首先是对每一轮都需要计算的新图总枝长公式进行变形, 以前文的 $S_{12}$ 为例:

$$
\begin{aligned}
  S_{12} &= \frac{1}{2(N-2)}\sum_{k=3}^{N}(D_{1k} + D_{2k}) + \frac{1}{2}D_{12} + \frac{1}{N-2}\sum_{3 \leq i<j}^{N}D_{ij} \\\\
  ~ &= \frac{1}{2(N-2)}\left[\sum_{k=3}^{N}D_{1k} + \sum_{k=3}^{N}D_{2k} + (N-2)D_{12} + \sum_{3 \leq i<j}^{N}D_{ij} + \sum_{3 \leq i<j}^{N}D_{ij}\right] \\\\
  ~ &= \frac{1}{2(N-2)}\left[(N-2)D_{12} - \left(D_{12} + \sum_{k=3}^{N}D_{1k}\right) - \left(D_{21} + \sum_{k=3}^{N}D_{2k}\right) + \left(D_{12} + \sum_{k=3}^{N}D_{1k} + \sum_{3 \leq i<j}^{N}D_{ij}\right) + \left(D_{21} + \sum_{k=3}^{N}D_{2k} + \sum_{3 \leq i<j}^{N}D_{ij}\right)\right] \\\\
  ~ &= \frac{1}{2(N-2)}\left[(N-2)D_{12} - \sum_{k \ne 1}^{N}D_{1k} - \sum_{k \ne 2}^{N}D_{2k} + 2\sum_{i<j}^{N}D_{ij}\right] \\\\
  ~ &= \frac{1}{2(N-2)}\left[(N-2)D_{12} - \sum_{k \ne 1}^{N}D_{1k} - \sum_{k \ne 2}^{N}D_{2k}\right] + \frac{1}{(N-2)}\sum_{i<j}^{N}D_{ij} \\\\
  ~ &= C_1\left[(N-2)D_{12} - \sum_{k \ne 1}^{N}D_{1k} - \sum_{k \ne 2}^{N}D_{2k}\right] + C_2
\end{aligned}
$$

经过化简之后, 可以看到, 只有方括号里的内容与要计算的邻居对 $1,2$ 有关, 其他量都可以看作这一轮的常量.

因为最终 $S_{ij}$ 是用于比较最小值, 所以只需要保证 $S_{ij}$ 的相对大小不变, 又 $C_1, C_2$ 均大于 $0$, 于是可以在实际计算中忽略掉常数项, 从而简化计算, 从而有:

$$
S_{ij} = (N-2)D_{ij} - M_i - M_j
$$

其中:

$$
M_i = \sum_{k \ne i}^{N}D_{ik}
$$

仍以前文的图为例, 在选择出最合适的邻居 $1,2$ 后, 会合并成新的分类单元 $<1,2>$, 需要在新图里计算 $<1,2>$ 和其余点的距离值, 以及内部距离 $L_{1X}, L_{2X}$.

新距离值就是 $D_{<i,j>k} = \frac{1}{2}(D_{ik} + D_{jk})$, 这里对 $L_{1X}, L_{2X}$ 进行变形化简.

$$
\begin{aligned}
  L_{1X} &= \frac{1}{2}(D_{12} + D_{1Z} - D_{2Z}) \\\\
  ~ &= \frac{1}{2}\left(D_{12} + \frac{1}{N-2}\sum_{i=3}^{N}D_{1i} - \frac{1}{N-2}\sum_{i=3}^{N}D_{2i}\right) \\\\
  ~ &= \frac{1}{2(N-2)}\left[(N-2)D_{12} + \sum_{i=3}^{N}D_{1i} - \sum_{i=3}^{N}D_{2i}\right] \\\\
  ~ &= \frac{1}{2(N-2)}\left[(N-2)D_{12} + \left(D_{12} + \sum_{i=3}^{N}D_{1i}\right) - \left(D_{21} + \sum_{i=3}^{N}D_{2i}\right)\right] \\\\
  ~ &= \frac{1}{2(N-2)}\left[(N-2)D_{12} + \sum_{k \ne 1}^{N}D_{1k} - \sum_{k \ne 2}^{N}D_{2k}\right] \\\\
  ~ &= \frac{1}{2}D_{12} + \frac{1}{2(N-2)}\left(\sum_{k \ne 1}^{N}D_{1k} - \sum_{k \ne 2}^{N}D_{2k}\right) \\\\
  L_{2X} &= D_{12} - L_{1X}
\end{aligned}
$$

因此有:

$$
\begin{aligned}
  L_{iX} &= \frac{1}{2}\left(D_{ij} + \frac{1}{(N-2)}(M_i - M_j)\right) \\\\
  L_{jX} &= D_{ij} - L_{iX}
\end{aligned}
$$

变形成这样有个好处, 就是能够复用前面算 $S_{ij}$ 时计算的 $M_i$ 结果.

## 代码实现

### 步骤

1. 依次计算当前轮次的 $M_i$ 值, 得到 $M$ 向量 $(M_1, M_2, \ldots, M_N)$.
2. 计算所有的 $S_{ij} ~ (1 \leq i < j \leq N)$, 选择使 $S_{ij}$ 最小的 $i,j$ 作为这一轮的邻居.
3. 计算新分类单元 $<i,j>$ 对其余点的新距离 $D_{<i,j>k} ~ (1 \leq k \leq N, k \ne i, j)$.
4. 计算内部距离 $L_{iX}$ 和 $L_{jX}$.
5. 更新当前分类单元数 $N = N-1$, 如果 $N > 3$, 则转步骤 1 继续, 否则结束计算.

### 代码

```python
from typing import *

def neighbor_joining(_otu: List[str], _dist: Dict[Tuple[int, int], float]):
    """
    Args:
        _otu: names of otus
        _dist: distances dict for otus, (i, j) -> dist, i less than j
    """

    # init
    nodes = [{"name": e, "parent": None} for e in _otu]
    distances = {(i, j): float(_dist[(i + 1, j + 1)]) for i in range(len(nodes)) for j in range(i + 1, len(nodes))}

    current_otus = set(range(len(nodes)))
    while len(current_otus) > 2:
        # calc M
        distance_to_others = {
            otu: sum(distances[(min(otu, other), max(otu, other))] for other in current_otus if other != otu)
            for otu in current_otus
        }

        # choose min (i, j)
        n1, n2 = min(
            ((i, j) for i in current_otus for j in current_otus if i < j),
            key=lambda x: (len(current_otus) - 2) * distances[x] - distance_to_others[x[0]] - distance_to_others[x[1]]
        )

        # make new otu
        n3 = len(nodes)
        otu_merge = {"name": f"#{n3}", "parent": None, "children": (n1, n2)}
        nodes[n1]["parent"] = n3
        nodes[n2]["parent"] = n3

        # remove n1 & n2
        current_otus.remove(n1)
        current_otus.remove(n2)

        # update distances
        for k in current_otus:
            _k1 = (min(n1, k), max(n1, k))
            _k2 = (min(n2, k), max(n2, k))
            distances[(k, n3)] = (distances[_k1] + distances[_k2]) / 2
            distances.pop(_k1)
            distances.pop(_k2)

        distances[(n1, n3)] = (distances[(n1, n2)] + (distance_to_others[n1] - distance_to_others[n2]) / len(current_otus)) / 2
        distances[(n2, n3)] = distances[(n1, n2)] - distances[(n1, n3)]
        distances.pop((n1, n2))

        # add n3
        nodes.append(otu_merge)
        current_otus.add(n3)

    # join rest two otus
    nodes[-2]["parent"] = len(nodes) - 1
    nodes[-1]["children"] = nodes[-1]["children"] + (len(nodes) - 2, )

    return nodes, distances


def draw_njtree(nodes: List[Dict[str, Any]], distances: Dict[Tuple[int, int], float]):
    stack = [(0, 0, len(nodes) - 1, nodes[-1])]
    while stack:
        level, count, idx, top = stack.pop()
        if level > 0:
            start = "├─" if count > 0 else "└─"
            print(
                "│  "*(level - 1),
                start,
                "─",
                top["name"],
                f"({distances[(min(idx, top['parent']), max(idx, top['parent']))]:.3f})",
                sep=""
            )
        else:
            print(top["name"])

        for i, child in enumerate(top.get("children", [])):
            stack.append((level + 1, i, child, nodes[child]))


if __name__ == "__main__":
    r = neighbor_joining(
        ["a", "b", "c", "d", "e", "f"],
        {
            (1, 2): 5, (1, 3): 4, (1, 4): 7, (1, 5): 6, (1, 6): 8,
            (2, 3): 7, (2, 4): 10, (2, 5): 9, (2, 6): 11,
            (3, 4): 7, (3, 5): 6, (3, 6): 8,
            (4, 5): 5, (4, 6): 9,
            (5, 6): 8,
        }
    )

    draw_njtree(r[0], r[1])
```

输出内容:

```plain
#9
├──#8(7.875)
│  ├──e(2.000)
│  └──d(3.000)
├──#7(3.750)
│  ├──#6(3.500)
│  │  ├──b(4.000)
│  │  └──a(1.000)
│  └──c(2.000)
└──f(5.000)
```

## 参考

1. [The Neighbor-joining Method: A New Method for Reconstructing Phylogenetic Trees](https://academic.oup.com/mbe/article/4/4/406/1029664)
