---
title: 多头注意力机制中的 Q, K, V
categories:
  - "阅读笔记"
tags:
  - "PyTorch"
  - "MultiheadAttention"
  - "NLP"
date: 2024-01-22 20:14:40
mathjax: true
---

记录一下 PyTorch 中多头注意力 [MultiheadAttention][MultiheadAttention] 的使用方法, 主要是对维度变换的过程梳理.

<!-- more -->

## 前言

在 PyTorch 的文档中, 对于 [MultiheadAttention][MultiheadAttention] 类有着这么几个与维度有关的构造参数, 影响 `forward` 传入的 `query`, `key`, `value` 的形状:

> - `embed_dim` – Total dimension of the model.
> - `num_heads` – Number of parallel attention heads. Note that `embed_dim` will be split across `num_heads` (i.e. each head will have dimension `embed_dim // num_heads`).
> - `kdim` – Total number of features for keys. Default: `None` (uses `kdim`=`embed_dim`).
> - `vdim` – Total number of features for values. Default: `None` (uses `vdim`=`embed_dim`).

在使用自注意力的时候, 前向传播只需要填入相同的参数作为 `query`, `key`, `value`, 不用考虑太多, 但是需要使用填入具有不同维度的 `query`, `key`, `value` 时, 则会令一些不熟悉的新手晕头转向.

## 注意力机制

{% note info %}
以下输入并不是 `MultiheadAttention` 的输入, 只是注意力部分的输入.
{% endnote %}

设有三个独立的张量 $Q_{B \times L \times d_k}$, $K_{B \times S \times d_k}$, $V_{B \times S \times d_v}$ 为注意力的输入, 其中 $B$ 指批大小, $L$ 指 $Q$ 的序列长, $S$ 指 $K$ 和 $V$ 的序列长, 那么可以知道输入:

- $Q$, $K$ 的每个元素长度 (特征数) 相同, 而 $V$ 可以具有独立的元素长度.
- $Q$ 的序列长度是独立的, 而 $K$ 和 $V$ 的序列长度必须相等, 因为它们的元素成对出现.

下一步则是计算注意力, 也就是经典公式:

$$
Attention(Q, K, V) = softmax(\frac{QK^\top}{\sqrt{d_k}})V
$$

中间的 $QK^\top$ 将会得到一个 $B \times L \times S$ 的张量, 也就是为每个样本生成了一个 $L \times S$ 的矩阵, 而这个矩阵中间的每个元素就是 $Q$ 和 $K$ 中每个元素的内积.

![attention](https://ww-rm.github.io/static/image/multiheadattention/attention.jpg)

如上图所示是一个样本的计算过程, 在获取内积结果之后, 对每一行进行 softmax 操作, 目的是得到 $K$ 中每个元素对于 $Q$ 的每个元素的权重, 然后将与 $K$ 匹配的 $V$ 中的值进行加权平均.

对 $Q$ 中的每个元素来说, 相当于是从一个 KV 表中通过对关键字 (**Key**) 的查询 (**Query**), 来获得了对应每一个值 (**Value**) 的权重, 最后对整个表进行加权平均, 得到了查询结果.

## 多头注意力

上一节中我们回顾了注意力部分的内容, 而在完整的注意力模型里, 还有多头处理.

现在, 设我们的原始输入 `query`, `key`, `value` 形状分别为 $(B, L, E_q)$, $(B, S, E_k)$, $(B, S, E_v)$, 然后还有一个 $d_{model}$, 模型使用的隐藏层大小, 以及 $h$, 模型使用的注意力头数.

此时, 我们将会有 $h$ 个线性投影矩阵, 记为 $W^Q_i, W^K_i, W^V_i, i = 0, \ldots, h - 1$, 它们的形状分别为 $(E_q, d_k)$, $(E_k, d_k)$, $(E_v, d_v)$.

每一组 $W^*_i$ 都形成一组注意力头, 对输入的 `query`, `key`, `value` 投影出一组 $Q_i, K_i, V_i$, 并计算出不同方面的 $Attention(Q_i, K_i, V_i)$ 注意力结果.

最后将 $h$ 个长度为 $d_v$ 的注意力结果拼接起来, 将拼接后的结果与一个 $W^O_{hd_v \times d_{model}}$ 进行运算, 得到最后的多头注意力输出, 形状为 $(B, L, d_{model})$.

## PyTorch 中的参数设置

在 PyTorch 的实现中:

- 参数 `embed_size` 对应 $E_q$, 且 $E_q = d_{model}$, 也就是限制了输入 `query` 的维度和模型的输出维度相同.
- 参数 `k_dim` 对应 $E_k$.
- 参数 `v_dim` 对应 $E_v$.
- 参数 `num_heads` 对应 $h$.
- $d_k = d_{model} / h$, 要求 `embed_size` 能够整除 `num_heads`, 且在单头 $h = 1$ 时, $d_k = d_{model} = E_q$.
- $d_v = d_k$, 即输入注意力的 $V_i$ 与 $Q_i, K_i$ 特征数相同, 输出的注意力结果特征数与输入相同, 并且 $hd_v = d_{model}$.

可以看出 PyTorch 内部实现隐含了很多处的维度相等, 并不支持所有的细节调整, 但是完成原始论文中的要求还是绰绰有余.

## 参考

1. [Attention is All you Need](https://doi.org/10.48550/arXiv.1706.03762)
2. [The Illustrated Transformer](https://jalammar.github.io/illustrated-transformer/)
3. [torch.nn.MultiheadAttention][MultiheadAttention]

[MultiheadAttention]: https://pytorch.org/docs/stable/generated/torch.nn.MultiheadAttention.html
