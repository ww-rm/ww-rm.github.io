---
title: SM9 算法中的塔式扩张公式推导
categories:
  - "杂学"
tags:
  - "SM9"
  - "塔式扩张"
  - "扩域运算"
date: 2023-12-04 18:35:43
mathjax: true
---

本篇记录一下在实现 SM9 算法时塔式扩张部分的公式推导与代码实现. 由于没有系统学习过相关数学理论, 因此只是根据有限的认识完成了推导, 可能存在不严谨之处.

<!-- more -->

## SM9 扩域元素的表示

以下来自 GB/T 38635.1-2020 A.2 部分 "扩域元素的表示" 小节原文内容.

$F_{q^{12}}$ 的 $1\text{-}2\text{-}4\text{-}12$ 塔式扩张:

$$
\begin{align*}
  & F_{q^{2}}[u] = F_{q}[u]/(u^2 - \alpha), && \alpha = -2 \\\\
  & F_{q^{4}}[v] = F_{q^{2}}[v]/(v^2 - \xi), && \xi = u \\\\
  & F_{q^{12}}[w] = F_{q^{4}}[w]/(w^3 - v), && v^2 = \xi
\end{align*}
$$

其中, 第一次的 2 次扩张约化多项式为: $x^2 - \alpha, \alpha=-2$;

第二次进行 2 次扩张的约化多项式为: $x^2 - u, u^2 = \alpha, u = \sqrt{-2}$;

第三次进行 3 次扩张的约化多项式为: $x^3-v, v^2=u, v = \sqrt{\sqrt{-2}}$.

$u$ 属于 $F_{q^{2}}$, 表示为 $(1, 0)$.

$v$ 属于 $F_{q^{4}}$, 表示为 $(0, 1, 0, 0)$, 也可以用 $F_{q^{2}}$ 元素表示为 $((0, 1), (0, 0))$.

## 公式推导

加法和减法就是类似于向量运算, 每个位置进行加减并模 $p$ 即可, 因此只需要推导乘法和模逆运算.

### 2 次扩域

设 $X = (x_1, x_0), Y = (y_1, y_0), Z = (z_1, z_0)$, 且 $Z = X \cdot Y$, 约化多项式为: $u^2 - \alpha, \alpha=-2$.

则 $Z$ 可以表示为:

$$
\begin{align*}
  (z_1, z_0) &= (x_1, x_0) \cdot (y_1, y_0) \\\\
  ~ &= (x_1u + x_0)(y_1u + y_0) \\\\
  ~ &= x_1y_1u^2 + (x_1y_0 + x_0y_1)u + x_0y_0 \\\\
  ~ &= (x_1y_0 + x_0y_1)u + (\alpha x_1y_1 + x_0y_0) \\\\
  ~ &= (x_1y_0 + x_0y_1, \alpha x_1y_1 + x_0y_0)
\end{align*}
$$

所以:

$$
\left\\{
\begin{align*}
  z_1 &= x_1y_0 + x_0y_1 \\\\
  z_0 &= \alpha x_1y_1 + x_0y_0
\end{align*}
\right.
$$

然后设 $Y = X^{-1}$, 也就是求 $X$ 的模逆:

$$
(0, 1) = (x_1, x_0) \cdot (y_1, y_0)
$$

即解二元一次方程组:

$$
\left\\{
\begin{align*}
  0 &= x_1y_0 + x_0y_1 \\\\
  1 &= \alpha x_1y_1 + x_0y_0
\end{align*}
\right.
$$

解得:

$$
\left\\{
\begin{align*}
  y_1 &= \frac{x_1}{\alpha x_1^2 - x_0^2} \\\\
  y_0 &= \frac{-x_0}{\alpha x_1^2 - x_0^2}
\end{align*}
\right.
$$

上述公式将 $F_{q^{2}}$ 中的运算全部变成 $F_{q}$ 中的运算, 所有元素计算后均需要模 $p$.

### 4 次扩域

设 $X = (X_1, X_0), Y = (Y_1, Y_0), Z = (Z_1, Z_0)$, 且 $Z = X \cdot Y$, 约化多项式为: $v^2 - u, u^2 = \alpha, u = \sqrt{-2}$.

其中 $X = (X_1, X_0) = (x_3, x_2, x_1, x_0)$ 是 $F_{q^{4}}$ 上的元素, $X_1, X_0$ 都是 $F_{q^{2}}$ 上的元素, $Y$ 和 $Z$ 同理.

仿照第一次 2 次扩张的过程, 则 $Z$ 可以表示为:

$$
\left\\{
\begin{align*}
  Z_1 &= X_1Y_0 + X_0Y_1 \\\\
  Z_0 &= u X_1Y_1 + X_0Y_0
\end{align*}
\right.
$$

其中 $u X_1Y_1 = (1, 0) \cdot X_1 \cdot Y_1$, 可以直接使用上一节中 $F_{q^{2}}$ 上的运算完成.

同理可得模逆运算为:

$$
\left\\{
\begin{align*}
  Y_1 &= \frac{X_1}{u X_1^2 - X_0^2} \\\\
  Y_0 &= \frac{-X_0}{u X_1^2 - X_0^2}
\end{align*}
\right.
$$

其中 $u X_1^2 = (1, 0) \cdot X_1 \cdot X_1$.

### 12 次扩域

设 $X = (X_2, X_1, X_0), Y = (Y_2, Y_1, Y_0), Z = (Z_2, Z_1, Z_0)$, 且 $Z = X \cdot Y$, 约化多项式为: $w^3-v, v^2=u, v = \sqrt{\sqrt{-2}}$.

其中 $X = (X_2, X_1, X_0) = (x_{11}, x_{10}, \ldots, x_0)$ 是 $F_{q^{12}}$ 上的元素, $X_2, X_1, X_0$ 都是 $F_{q^{4}}$ 上的元素, $Y$ 和 $Z$ 同理.

则 $Z$ 可以表示为:

$$
\begin{align*}
  (Z_2, Z_1, Z_0) &= (X_2, X_1, X_0) \cdot (Y_2, Y_1, Y_0) \\\\
  ~ &= (X_2 w^2 + X_1w + X_0)(Y_2 w^2 + Y_1w + Y_0) \\\\
  ~ &= X_2Y_2w^4 + (X_2Y_1 + X_1Y_2)w^3 + (X_2Y_0 + X_1Y_1 + X_0Y_2)w^2 + (X_1Y_0 + X_0Y_1)w + X_0Y_0 \\\\
  ~ &= (X_2Y_0 + X_1Y_1 + X_0Y_2)w^2 + (vX_2Y_2 + X_1Y_0 + X_0Y_1)w + (vX_2Y_1 + vX_1Y_2 + X_0Y_0) \\\\
  ~ &= (X_2Y_0 + X_1Y_1 + X_0Y_2, vX_2Y_2 + X_1Y_0 + X_0Y_1, v(X_2Y_1 + X_1Y_2) + X_0Y_0)
\end{align*}
$$

所以:

$$
\left\\{
\begin{align*}
  Z_2 &= X_2Y_0 + X_1Y_1 + X_0Y_2 \\\\
  Z_1 &= vX_2Y_2 + X_1Y_0 + X_0Y_1 \\\\
  Z_0 &= v(X_2Y_1 + X_1Y_2) + X_0Y_0
\end{align*}
\right.
$$

其中 $v = ((0, 1), (0, 0)) = (0, 1, 0, 0)$, 可以用 $F_{q^{4}}$ 完成计算.

设 $Y = X^{-1}$, 求 $X$ 的模逆:

$$
(\mathbf{0}\_{F_{q^4}}, \mathbf{0}\_{F_{q^4}}, \mathbf{1}\_{F_{q^4}}) = (X_2, X_1, X_0) \cdot (Y_2, Y_1, Y_0)
$$

即解三元一次方程组:

$$
\left\\{
\begin{align*}
  \mathbf{0}\_{F_{q^4}} &= X_2Y_0 + X_1Y_1 + X_0Y_2 \\\\
  \mathbf{0}\_{F_{q^4}} &= vX_2Y_2 + X_1Y_0 + X_0Y_1 \\\\
  \mathbf{1}\_{F_{q^4}} &= v(X_2Y_1 + X_1Y_2) + X_0Y_0
\end{align*}
\right.
$$

解得:

$$
\left\\{
\begin{align*}
  Y_2 &= \frac{X_1^2 - X_2X_0}{\mathbf{det}\_{F_{q^4}}} \\\\
  Y_1 &= \frac{vX_2^2 - X_1X_0}{\mathbf{det}\_{F_{q^4}}} \\\\
  Y_0 &= \frac{X_0^2 - vX_2X_1}{\mathbf{det}\_{F_{q^4}}}
\end{align*}
\right.
$$

其中 $\mathbf{det}\_{F_{q^4}} = v^2X_2^3 + vX_1^3 + X_0^3 - 3 \cdot (vX_2X_1X_0)$, 符号 $\cdot$ 表示 $F_{q^4}$ 上的标量乘法运算.

## 代码实现

用 python 简单实现一下上述涉及的所有运算.

```python
class PrimeFiledEx(PrimeField):
    """Fp2, Fp4, Fp12 operations."""

    def __init__(self, p: int) -> None:
        self.p = p

    def inv(self, x: int):
        return inverse(x, self.p)

    def addex(self, X: FpExEle, Y: FpExEle) -> FpExEle:
        return tuple((i1 + i2) % self.p for i1, i2 in zip(X, Y))

    def subex(self, X: FpExEle, Y: FpExEle) -> FpExEle:
        return tuple((i1 - i2) % self.p for i1, i2 in zip(X, Y))

    def negex(self, X: FpExEle) -> FpExEle:
        return tuple(self.p - i for i in X)

    def smulex(self, k: int, X: FpExEle) -> FpExEle:
        return tuple((k * i) % self.p for i in X)

    def mul2(self, X: Fp2Ele, Y: Fp2Ele) -> Fp2Ele:
        x1, x0 = X
        y1, y0 = Y
        x1y1 = x1 * y1
        x0y0 = x0 * y0
        z1 = ((x1 + x0) * (y1 + y0) - x1y1 - x0y0) % self.p
        z0 = (x0y0 - 2 * x1y1) % self.p
        return z1, z0

    def inv2(self, X: Fp2Ele) -> Fp2Ele:
        x1, x0 = X
        invdet = self.inv(2 * x1 * x1 + x0 * x0)
        y1 = (-x1 * invdet) % self.p
        y0 = (x0 * invdet) % self.p
        return y1, y0

    def mul4(self, X: Fp4Ele, Y: Fp4Ele) -> Fp4Ele:
        a, m = self.addex, self.mul2
        X1, X0 = X[:2], X[2:]
        Y1, Y0 = Y[:2], Y[2:]
        U = (1, 0)

        X1mY1 = m(X1, Y1)
        X0mY0 = m(X0, Y0)

        X1aX0_m_Y1aY0 = m(a(X1, X0), a(Y1, Y0))
        Z1 = tuple((i1 - i2 - i3) % self.p for i1, i2, i3 in zip(X1aX0_m_Y1aY0, X1mY1, X0mY0))
        Z0 = a(m(U, X1mY1), X0mY0)

        return Z1 + Z0

    def inv4(self, X: Fp4Ele) -> Fp4Ele:
        m, n, s = self.mul2, self.negex, self.subex
        X1, X0 = X[:2], X[2:]
        U = (1, 0)

        UmX1mX1_s_X0mX0 = s(m(U, m(X1, X1)), m(X0, X0))
        invdet = self.inv2(UmX1mX1_s_X0mX0)

        Y1 = m(X1, invdet)
        Y0 = m(n(X0), invdet)

        return Y1 + Y0

    def mul12(self, X: Fp12Ele, Y: Fp12Ele) -> Fp12Ele:
        a, m = self.addex, self.mul4
        X2, X1, X0 = X[:4], X[4:8], X[8:]
        Y2, Y1, Y0 = Y[:4], Y[4:8], Y[8:]
        V = (0, 1, 0, 0)

        X2mY2, X1mY1, X0mY0 = m(X2, Y2), m(X1, Y1), m(X0, Y0)
        X2aX1, X2aX0, X1aX0 = a(X2, X1), a(X2, X0), a(X1, X0)
        Y2aY1, Y2aY0, Y1aY0 = a(Y2, Y1), a(Y2, Y0), a(Y1, Y0)

        X2aX1_m_Y2aY1 = m(X2aX1, Y2aY1)
        X2aX0_m_Y2aY0 = m(X2aX0, Y2aY0)
        X1aX0_m_Y1aY0 = m(X1aX0, Y1aY0)

        VmX2mY2 = m(V, X2mY2)
        X2mY1_a_X1Y2 = tuple((i1 - i2 - i3) % self.p for i1, i2, i3 in zip(X2aX1_m_Y2aY1, X2mY2, X1mY1))

        Z2 = tuple((i1 - i2 - i3 + i4) % self.p for i1, i2, i3, i4 in zip(X2aX0_m_Y2aY0, X2mY2, X0mY0, X1mY1))
        Z1 = tuple((i1 + i2 - i3 - i4) % self.p for i1, i2, i3, i4 in zip(VmX2mY2, X1aX0_m_Y1aY0, X1mY1, X0mY0))
        Z0 = a(m(V, X2mY1_a_X1Y2), X0mY0)

        return Z2 + Z1 + Z0

    def inv12(self, X: Fp12Ele) -> Fp12Ele:
        m, s = self.mul4, self.subex
        X2, X1, X0 = X[:4], X[4:8], X[8:]
        V = (0, 1, 0, 0)

        VmX2 = m(V, X2)
        VmX1 = m(V, X1)

        X1mX1_s_X2mX0 = s(m(X1, X1), m(X2, X0))
        VmX2mX2_s_X1X0 = s(m(VmX2, X2), m(X1, X0))
        X0mX0_s_VmX2mX1 = s(m(X0, X0), m(VmX2, X1))

        det = tuple((i1 + i2 + i3) % self.p for i1, i2, i3 in zip(m(VmX2, VmX2mX2_s_X1X0), m(VmX1, X1mX1_s_X2mX0), m(X0, X0mX0_s_VmX2mX1)))
        invdet = self.inv4(det)

        Y2 = m(X1mX1_s_X2mX0, invdet)
        Y1 = m(VmX2mX2_s_X1X0, invdet)
        Y0 = m(X0mX0_s_VmX2mX1, invdet)

        return Y2 + Y1 + Y0
```

## 参考

1. [信息安全技术 SM9标识密码算法 第1部分：总则](https://openstd.samr.gov.cn/bzgk/gb/newGbInfo?hcno=B7A0D7DFF411CD0AAE76135ADE91886A)
2. [伽罗瓦域(有限域)GFq^12上元素的1→2→4→12塔式扩张(1)------第一次扩张](https://www.cnblogs.com/heshuchao/p/8196307.html)
3. [伽罗瓦域(有限域)GFq^12上元素的1→2→4→12塔式扩张(2)------第二次扩张](https://www.cnblogs.com/heshuchao/p/8198494.html)
