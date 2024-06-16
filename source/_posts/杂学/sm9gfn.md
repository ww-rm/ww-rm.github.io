---
title: SM9 算法中 $g_{U, V}(Q)$ 的展开优化
categories:
  - "杂学"
tags:
  - "SM9"
  - "SM9优化"
  - "稀疏乘法"
date: 2024-06-16 22:23:10
mathjax: true
---

本篇记录一下在实现 SM9 算法时对函数 $g_{U, V}(Q)$ 稀疏乘法的公式推导与优化实现.

<!-- more -->

## 十二次扩域上的稀疏乘法

$$
\begin{align*}
     U &= (x_U, y_U, z_U) \rightarrow (x_1, y_1) \\\\
     V &= (x_V, y_V, z_V) \rightarrow (x_2, y_2) \\\\
     Q &= (x_Q, y_Q, z_Q) \rightarrow (x_3, y_3) \\\\
     U' &= (x'_U, y'_U, z'_U) \rightarrow (x'_1, y'_1) \\\\
     V' &= (x'_V, y'_V, z'_V) \rightarrow (x'_2, y'_2)
\end{align*}
$$

$U, V, Q$ 是 $E(F_{q^{12}})$ 上的点, $U', V'$ 是扭曲线上的点, 也是函数的直接输入值.

$Q$ 输入时在 $E(F_{q})$ 上, 但是可以直接通过塔式扩张转换到 $E(F_{q^{12}})$ 上.

根据雅各比加重坐标系转换公式和扭曲线转换公式可得:

$$
\left\\{
\begin{align*}
    x_1 &= \frac{x_U}{z_U^2} = \frac{x_U'}{\omega^2} = \frac{x_U'}{\omega^2 z_U'^2} \\\\
    y_1 &= \frac{y_U}{z_U^3} = \frac{y_U'}{\omega^3} = \frac{y_U'}{\omega^3 z_U'^3}
\end{align*}
\right.
$$

可以看到根据 $z$ 的次数, 分母会乘上同次数的 $\omega$, 这在 $F_{q^{12}}$ 上相当于是把这个 $F_{q^{2}}$ 元素次数加一, 也就是改变这个元素的位置.

同理有:

$$
\left\\{
\begin{align*}
    x_2 &= \frac{x_V}{z_V^2} \\\\
    y_2 &= \frac{y_V}{z_V^3}
\end{align*}
\right.
$$

$$
\left\\{
\begin{align*}
    x_3 &= \frac{x_Q}{z_Q^2} \\\\
    y_3 &= \frac{y_Q}{z_Q^3}
\end{align*}
\right.
$$

根据公式有:

$$
\begin{align*}
     \lambda_1 &= \frac{3x_2^2}{2y_2} \\\\
     \lambda_2 &= \frac{y_1 - y_2}{x_1 - x_2}
\end{align*}
$$

则:

$$
\begin{align*}
g_{V, V}(Q) &= \lambda_1(x_3 - x_2) + y_2 - y_3 \\\\
~ &= \frac{3x_2^2(x_3-x_2)}{2y_2} + y_2 - y_3 \\\\
~ &= \frac{3x_3}{2}\frac{x_2^2}{y_2} - \frac{3}{2}\frac{x_2^3}{y_2} + y_2 - y_3 \\\\
~ &= \frac{\frac{3}{2} x_3 x_V^2}{y_V z_V} - \frac{\frac{3}{2}x_V^3}{y_V z_V^3} + \frac{y_V}{z_V^3} - y_3 \\\\
~ &= \frac{\frac{3}{2} x_Q x_V^2}{z_Q^2 y_V z_V} - \frac{\frac{3}{2}x_V^3}{y_V z_V^3} + \frac{y_V} {z_V^3} - \frac{y_Q} {z_Q^3} \\\\
~ &= \frac{\frac{3}{2} x_Q z_Q x_V^2 z_V^2 + z_Q^3(y_V^2 - \frac{3}{2}x_V^3) - y_Q y_V z_V^3}{z_Q^3 y_V z_V^3}
\end{align*}
$$

$$
\begin{align*}
g_{U, V}(Q) &= \lambda_2(x_3 - x_2) + y_2 - y_3 \\\\
~ &= \frac{y_1 - y_2}{x_1 - x_2}(x_3 - x_2) + y_2 - y_3 \\\\
~ &= \frac{\frac{y_U}{z_U^3} - \frac{y_V}{z_V^3}}{\frac{x_U}{z_U^2} - \frac{x_V}{z_V^2}}(x_3 - \frac{x_V}{z_V^2}) + \frac{y_V}{z_V^3} - y_3 \\\\
~ &= \frac{y_U z_V^3 - y_V z_U^3}{z_Uz_V(x_U z_V^2 - x_V z_U^2)}(x_3 - \frac{x_V}{z_V^2}) + \frac{y_V}{z_V^3} - y_3 \\\\
~ &= \frac{y_U z_V^3 - y_V z_U^3} {z_Uz_V(x_U z_V^2 - x_V z_U^2)}\frac{x_3 z_V^2 - x_V}{z_V^2} + \frac{y_V - y_3 z_V^3}{z_V^3} \\\\
~ &= \frac{z_V(y_U z_V^3 - y_V z_U^3)(x_3 z_V^2 - x_V) + z_Uz_V(x_U z_V^2 - x_V z_U^2)(y_V - y_3 z_V^3)}{z_Uz_V(x_U z_V^2 - x_V z_U^2)z_V^3} \\\\
~ &= \frac{t_2 x_3 z_V^2 + t_1 y_V - t_2 x_V - t_1 y_3 z_V^3}{t_1 z_V^3} \\\\
~ &= \frac{t_2 \frac{x_Q}{z_Q^2} z_V^2 + t_1 y_V - t_2 x_V - t_1 \frac{y_Q}{z_Q^3} z_V^3} {t_1 z_V^3} \\\\
~ &= \frac{x_Q z_Q t_2 z_V^2 + z_Q^3(t_1 y_V - t_2 x_V) - y_Q t_1 z_V^3} {z_Q^3 t_1 z_V^3}
\end{align*}
$$

其中:

$$
\left\\{
\begin{align*}
    t_1 &= z_Uz_V(x_U z_V^2 - x_V z_U^2) \\\\
    t_2 &= z_V(y_U z_V^3 - y_V z_U^3)
\end{align*}
\right.
$$

当 $U, V$ 为相反点, 即 $x_1 = x_2, y_1 + y_2 = 0$ 时:

$$
\begin{align*}
g_{V, -V}(Q) &= x_3 - x_2 \\\\
~ &= \frac{x_Q}{z_Q^2} - \frac{x_V}{z_V^2} \\\\
~ &= \frac{x_Q z_V^2 - z_Q^2 x_V}{z_Q^2 z_V^2}
\end{align*}
$$

在代码实现时, 通过展开, 可以将计算控制在 $F_{q^{2}}$ 上, 且分开算分子分母, 可以有效避免求逆, 延迟到在最后计算 $FinalExp$ 时对总的分母计算一次逆.
