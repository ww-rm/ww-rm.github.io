---
title: ECC 算法原理简介与实现
tags:
  - "公钥算法"
  - "椭圆曲线密码"
categories:
  - "密码相关"
date: 2022-12-07 11:04:56
mathjax: true
---

本文记于某次密码作业课余, 提供对 ECC 算法的简要介绍与简单实现, 文末附有代码.

<!-- more -->

## 理论介绍

### 素域上的离散椭圆曲线

形如 $y^2 = x^3 + ax + b \bmod p$ 的曲线叫椭圆曲线, 其中需满足 $p$ 是大于 $3$ 的素数, 且 $4a^3 + 27b^2 \ne 0 \bmod p$.

先不看 $\bmod$ 记号, 那么这就是一条普通的连续曲线, 可以按照普通的方程求解, 给定一个 $x$, 就可以求出来对应的 $y$. 容易看出来, 这条曲线是关于 $x$ 轴对称的, 因此它的图像大概长下面这种样子.

![zcG6gI.png](https://s1.ax1x.com/2022/12/06/zcG6gI.png)

可以有几种不同的形式, 但是基本上差不多.

那么加了 $\bmod$ 记号之后有什么不同呢? 刚刚是根据实数域画出来的连续曲线, 那么加上 $\bmod$ 之后, 曲线还是这条曲线, 但是坐标取值范围变成了整数范围, 且取值在 $[0, p-1]$ 之间.

也就是从这条曲线上挑出了一些离散的整数解, 不仅能够满足这个曲线方程, 同时 $x$ 和 $y$ 的取值范围在 $[0, p-1]$, 也就是对 $p$ 取模, 所有的数据运算都在模 $p$ 下进行, 因此将这种曲线记为 $y^2 = x^3 + ax + b \bmod p$.

所以, ECC 中使用的椭圆曲线并不是一条真正连续的曲线, 而是由很多离散的点组成的.

### 椭圆曲线上的运算

既然要使用椭圆曲线进行计算, 那么先得定义在椭圆曲线上的运算.

我们都学过向量的运算, 其中最基本的两种运算是加法和数乘.

如果设 $\vec{a}$, $\vec{b}$ 是两个向量, 那么我们可以计算 $\vec{a}+\vec{b}$ 的值, 这称为**向量加法**.

我还可以计算 $\vec{a}$ 与自己的相加运算, 计算 $k$ 个 $\vec{a}$ 连续相加, 并简记为 $k\vec{a}$, 这称为**向量数乘**.

可以看出, 第二种情况虽然有个"乘"字, 但是仍然属于加法运算的一种, 至此, 向量关于加法的运算已经基本上齐全了, 但是还缺少一些特殊情况定义.

首先是 $0$ 的定义, 此处指的是抽象的 $0$, 不是数字 $0$, 也就是对于向量运算来说, 需要有一个 $0$ 值的概念, 它在加法运算中不会影响运算本身, 通常就将其定义为全零向量 $\vec{0}$, 也可称其为**单位元**.

而在定义完单位元之后, 可以定义向量取负, 依靠于 $\vec{0}$ 来进行的, 如果有 $-\vec{a}$, 则 $\vec{a} + (-\vec{a}) = \vec{0}$, 这样就通过单位元定义了加法的逆运算减法的规则, 因为减去一个原向量等于加上原向量的相反向量, 而相反向量满足上述关于单位元的等式, 因而可以求出相反向量的具体取值. 在这里, 相反向量称之为原向量的**逆元**.

至此, 我们成功在向量中定义了这些基本概念:

- 加法 ($\vec{a} + \vec{b}$)
- 数乘 ($k\vec{a}$)
- 单位元 ($\vec{0}$)
- 逆元 ($-\vec{a}$)

那么, 把上述中的"向量"全部换成别的东西, 我们就可以定义出一套新的数据运算, 而对于椭圆曲线, 我们将"向量"换成所有满足椭圆曲线方程的点, 定义了椭圆曲线上的点运算规则.

下面用一张图来直观解释椭圆曲线上点是如何进行"相加"的.

![zcYiWj.png](https://s1.ax1x.com/2022/12/07/zcYiWj.png)

设 $P$, $Q$ 为椭圆曲线上的两点, 则 $P+Q$ 就是 $P$, $Q$ 连线与曲线的交点关于 $x$ 轴的对称点.

当 $P$, $Q$ 重合时, 取切线与曲线的交点的对称点作为加法结果, 也就是 $2P$.

当 $P$, $Q$ 关于 $x$ 轴对称时, 定义相加结果为无穷远点, 视作加法的单位元点, 记为 $O$, 同时易得此时 $P$, $Q$ 互为对方的逆元.

### 椭圆曲线运算公式

运算公式按照普通的解析几何去求解即可, 在此直接给出公式, 分为两点不重合和重合的情况.

设曲线方程是 $y^2 = x^3 + ax + b$, $R(x_3, y_3)=P(x_1, y_1) + Q(x_2, y_2)$, 则:

$$
\left\\{
  \begin{align*}
    x_3 &= \lambda^2 - x_1 - x_2 \\\\
    y_3 &= \lambda(x_1 - x_3) - y_1
  \end{align*}
\right.
$$

其中, 当 $P(x_1, y_1) \ne Q(x_2, y_2)$, 即两点不重合时,

$$
\lambda = \frac{y_2 - y_1}{x_2 - x_1}
$$

当 $P(x_1, y_1) = Q(x_2, y_2)$, 即两点重合时,

$$
\lambda = \frac{3x_1^2+a}{2y_1}
$$

### 其他概念

一些代码实现时需要知道的概念, 在此简单记录.

- 循环群: 循环群是一些点的集合, 群内存在一个特殊点 $G$, 在这个群内的任何一个点, 都可以由 $G, 2G, ..., nG$ 表示, 对 $G$ 的 $n$ 次加法运算能够遍历群中的每个点, 群的大小是 $n$.
- 生成元: 循环群中的 $G$ 称为这个循环群的生成元.
- 阶: 指循环群或者生成元的阶, 就是生成元所在循环群的大小 $n$.
- 模逆运算: 指求解方程 $ax \equiv 1 \bmod p$, 即 $a$ 在模 $p$ 运算下的"倒数".

## 椭圆曲线代码实现

### 曲线与点的定义

```c
typedef struct {
    int64_t x;
    int64_t y;
} EccPoint;

typedef struct {
    int64_t a;
    int64_t b;
    int64_t p;
} EC; // y^2 = x^3 + ax + b (mod p)

typedef struct {
    EccPoint pt;
    int64_t n;
} GenPoint;
```

### 辅助运算

模 $p$ 运算和模逆运算.

```c
int64_t modp(int64_t x, int64_t p)
{
    while (x < 0) x += p;
    x %= p;
    return x;
}

int64_t inverse(int64_t x, int64_t p)
{
    int64_t q = 0;
    int64_t r = 0;

    int64_t r1 = p;
    int64_t r2 = x;

    int64_t t1 = 0;
    int64_t t2 = 1;
    int64_t t = 0;
    while (r2 > 0)
    {
        q = r1 / r2, r = r1 % r2;
        r1 = r2, r2 = r;

        t = t1 - q * t2;
        t1 = t2, t2 = t;
    }

    t1 = modp(t1, p);
    return t1;
}
```

### 点加与数乘

```c
void addpt(
    const EC* ec,
    const EccPoint* pt1, const EccPoint* pt2,
    EccPoint* new_pt
)
{
    if (pt1->x == -1 && pt1->y == -1)
    {
        new_pt->x = pt2->x;
        new_pt->y = pt2->y;
        return;
    }
    else if (pt2->x == -1 && pt2->y == -1)
    {
        new_pt->x = pt1->x;
        new_pt->y = pt1->y;
        return;
    }
    else
    {
        int64_t lambda = 0;
        int64_t new_x = 0;
        int64_t new_y = 0;

        if (pt1->x == pt2->x)
        {
            // Unit
            if (pt1->y + pt2->y == ec->p)
            {
                new_pt->x = -1;
                new_pt->y = -1;
                return;
            }
            // Same
            else if (pt1->y == pt2->y)
            {
                lambda = (3 * pt1->x * pt1->x + ec->a) * inverse(2 * pt1->y, ec->p);
            }
            else
            {
                exit(-1);
            }
        }
        // Different
        else
        {
            int64_t delta_x = 0;
            int64_t delta_y = 0;

            delta_x = modp((pt2->x - pt1->x), ec->p);
            delta_y = modp((pt2->y - pt1->y), ec->p);
            lambda = delta_y * inverse(delta_x, ec->p);
        }

        lambda %= ec->p;

        new_x = modp((lambda * lambda - pt1->x - pt2->x), ec->p);
        new_y = modp((lambda * (pt1->x - new_x) - pt1->y), ec->p);

        new_pt->x = new_x;
        new_pt->y = new_y;
        return;
    }
    return;
}

void mulpt(
    const EC* ec,
    uint64_t k, const EccPoint* pt,
    EccPoint* new_pt
)
{
    if (k == 0)
    {
        new_pt->x = -1;
        new_pt->y = -1;
        return;
    }

    int i = 64;
    // find first 1 bit
    while (!(k & 0x8000000000000000))
    {
        k <<= 1;
        i--;
    }

    new_pt->x = pt.x;
    new_pt->y = pt.y;
    i--;
    k <<= 1;
    while (i > 0)
    {
        addpt(ec, new_pt, new_pt, new_pt);
        if (k & 0x8000000000000000)
        {
            addpt(ec, new_pt, pt, new_pt);
        }
        k <<= 1;
        i--;
    }
    return;
}
```

### 计算椭圆曲线的所有点及其阶

```c
uint8_t isprime(int64_t x)
{
    for (int64_t i = 2; i < (int64_t)sqrtl((long double)x); i++)
    {
        if (x % i == 0)
        {
            return 0;
        }
    }
    return 1;
}

int64_t compute_ptrank(const EC* ec, const EccPoint* pt)
{
    EccPoint tmp = { pt->x, pt->y };

    int64_t rank = 1;
    while (1)
    {
        addpt(ec, &tmp, pt, &tmp);
        if (tmp.x == pt->x && tmp.y == pt->y)
        {
            break;
        }
        rank++;
    }
    return rank;
}

void print_points(EC* ec)
{
    printf("EC: { a = %lld, b = %lld, p = %lld }\n", ec->a, ec->b, ec->p);
    if (modp(4 * ec->a * ec->a * ec->a + 27 * ec->b * ec->b, ec->p) == 0)
    {
        printf("Params Invalid!\n");
        return;
    }
    else
    {
        int64_t pt_count = 0;
        int64_t y_sqr = 0;
        int64_t y = 0;
        uint8_t find = 0;
        EccPoint pt_tmp = { 0 };
        int64_t pt_rank = 0;
        char prime_rank = 0;
        for (int64_t x = 0; x < ec->p; x++)
        {
            y_sqr = modp((x * x * x + ec->a * x + ec->b), ec->p);
            find = 0;
            while (y_sqr < (ec->p - 1) * (ec->p - 1))
            {
                y = (int64_t)sqrtl((long double)y_sqr);
                if (y * y == y_sqr)
                {
                    find = 1;
                    break;
                }
                y_sqr += ec->p;
            }
            if (find)
            {
                pt_tmp.x = x;
                pt_tmp.y = y;
                pt_rank = compute_ptrank(ec, &pt_tmp);
                prime_rank = (isprime(pt_rank) ? 'P' : 'C');
                pt_count++;
                printf("(%5lld, %5lld)[%5lld][%c], ", pt_tmp.x, pt_tmp.y, pt_rank, prime_rank);
                if (pt_count % 4 == 0)
                {
                    printf("\n");
                }

                if (y != 0)
                {
                    pt_tmp.y = ec->p - y;
                    pt_count++;
                    printf("(%5lld, %5lld)[%5lld][%c], ", pt_tmp.x, pt_tmp.y, pt_rank, prime_rank);
                    if (pt_count % 4 == 0)
                    {
                        printf("\n");
                    }
                }
            }
        }
        printf("(%5d, %5d)[%5d][%c]\n", -1, -1, 1, 'C');
        pt_count++;
        printf("EccPoints Count: %lld\n", pt_count);
    }

    return;
}
```

## 使用椭圆曲线进行数据加密

前面只是实现了关于椭圆曲线的运算, 现在需要使用这个运算来构建一个密码算法, 这其中使用到的问题称为椭圆曲线上的离散对数问题.

### ECDLP

设曲线为 $y^2 = x^3 + ax + b \bmod p$, $p$ 为大于 $3$ 的素数, 且 $4a^3 + 27b^2 \ne 0 \bmod p$.

曲线上的一个循环群记为 $<G, n>$, $G$ 是群的生成元, $n$ 是群的阶, 且 $n$ 为素数.

设 $P$, $Q$ 是群上的两点, 且 $Q = tP$, $t$ 为正整数且 $t \in [1, n-1]$.

则已知 $t$, $P$, 要计算 $Q$ 是简单的, 但是反过来, 已知 $P$, $Q$, 要计算 $t$ 是困难的, 这就是椭圆曲线上的离散对数问题.

### 公私钥的选取

根据前面 ECDLP 的定义, 定义用户的私钥为 $d$, 可以为集合 $\\{1, 2, ..., n-1\\}$ 中的一个随机数, 公钥为 $Q$, 且 $Q = dG$, $G$ 是循环群 $<G, n>$ 的生成元. 其余所有和椭圆曲线有关的参数均是公开已知, 只有 $d$ 的值是秘密保留的, 当 $p$ 足够大时, 求解 $d$ 是困难的.

### 一个简单的加解密方案

设 $d$ 为用户私钥, $Q$ 为用户公钥, 明文数据为 $M$, 且 $0 \leq M \leq n-1$.

加密:

1. 选择一个随机数 $k$, 且 $k \in \\{1, 2, ..., n-1\\}$.
2. 计算点 $X_1(x_1, y_1) = kQ$, 如果 $x_1 = 0$, 则转步骤 1.
3. 计算点 $X_2(x_2, y_2) = kG$.
4. 计算密文 $C \equiv Mx_1 \bmod n$.
5. 以 $(X_2, C)$ 作为 $M$ 的最终密文.

解密:

1. 计算 $X_1(x_1, y_1) = dX_2 = d(kG) = k(dG) = kQ$.
2. 计算明文 $M \equiv Cx_1^{-1} \bmod n$.

## 加解密算法的实现

```c
void encrypt_blk(
    const ECDLP* ecdlp,
    const EccPoint* pubkey,
    int64_t plain,
    EccPoint* cipher_pt, int64_t* cipher
)
{
    int64_t rndk = 0;
    EccPoint x1 = { 0 };
    do
    {
        rndk = rand() % (ecdlp->genpt.n - 1) + 1;
        mulpt(&ecdlp->ec, rndk, pubkey, &x1);
    } while (x1.x == 0);

    mulpt(&ecdlp->ec, rndk, &ecdlp->genpt.pt, cipher_pt);
    *cipher = (plain * x1.x) % ecdlp->genpt.n;

    return;
}

void decrypt_blk(
    const ECDLP* ecdlp,
    int64_t prikey,
    const EccPoint* cipher_pt, int64_t cipher,
    int64_t* plain
)
{
    EccPoint x1 = { 0 };
    mulpt(&ecdlp->ec, prikey, cipher_pt, &x1);
    *plain = (cipher * inverse(x1.x, ecdlp->genpt.n)) % ecdlp->genpt.n;

    return;
}
```

## 包含文件与主程序

```c
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <math.h>
#include <time.h>
```

```c
int main()
{
    srand((uint32_t)time(NULL));
    ECDLP ecdlp = { { 2, 11, 49177 }, {{1, 14445}, 49031} };
    // print_points(&ecdlp.ec);

    printf("Curve Params: { a = %lld, b = %lld, p = %lld }\n", ecdlp.ec.a, ecdlp.ec.b, ecdlp.ec.p);
    printf("GenPoint: { pt: (%lld, %lld), n: %lld }\n", ecdlp.genpt.pt.x, ecdlp.genpt.pt.y, ecdlp.genpt.n);

    int64_t prikey = 149;
    EccPoint pubkey = { 0 };
    mulpt(&ecdlp.ec, prikey, &ecdlp.genpt.pt, &pubkey);
    printf("Prikey: %lld Pubkey: (%lld, %lld)\n", prikey, pubkey.x, pubkey.y);

    int64_t plain = 23456;
    int64_t cipher = -1;
    EccPoint cipher_pt = { 0 };

    printf("Plain: %lld\n", plain);

    encrypt_blk(&ecdlp, &pubkey, plain, &cipher_pt, &cipher);
    printf("Cipher: (%lld, %lld), %lld\n", cipher_pt.x, cipher_pt.y, cipher);

    decrypt_blk(&ecdlp, prikey, &cipher_pt, cipher, &plain);
    printf("Plain: %lld\n", plain);

    return 0;
}
```
