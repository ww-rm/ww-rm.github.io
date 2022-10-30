---
title: 扩散模型阅读笔记
tags:
  - "图像生成"
  - "扩散模型"
  - "Diffusion Model"
categories:
  - "AI相关"
date: 2022-10-29 22:45:56
---

本文是对知乎的一篇文章[扩散模型 Diffusion Models - 原理篇](https://zhuanlan.zhihu.com/p/548112711)的摘要性总结.

<!-- more -->

## 基本原理

![x5xJiR.jpg](https://s1.ax1x.com/2022/10/29/x5xJiR.jpg)

前向过程为一张图片 $x_0$ 在经过 $T$ 轮高斯噪声叠加后会变成一张近似纯高斯噪声图 $x_T$, 而网络则是学习反向过程中的参数, 能够通过 $x_T$ 一步步还原出 $x_0$.

## 前向扩散

设共进行 $T$ 轮扩散, 有 $\beta_1 < \beta_2 < \dots < \beta_T (0 < \beta_i < 1)$ 的方差参数.

设 $q(x_t|x_{t-1})$ 服从高斯分布, 且:

$$
x_t(z;x_{t-1},t)=\sqrt{1-\beta_t}x_{t-1}+\sqrt{\beta_t}z \sim N(\sqrt{1-\beta_t}x_{t-1}, \beta_t)
$$

设 $\alpha_t=1-\beta_t,\bar{\alpha}_t=\prod_{i=1}^t\alpha_t$, 则有

$$
x_t(\epsilon_t;x_0,t)=\sqrt{\bar{\alpha}_t}x_0+\sqrt{1-\bar{\alpha}_t}\epsilon_t \sim N(\sqrt{\bar{\alpha}_t}x_0, 1-\bar{\alpha}_t)
$$

则给定 $x_0,t$, 以及高斯随机量 $\epsilon_t$, 可以直接得到对应的 $x_t$.

## 逆向扩散

假设 $p(x_{t-1}|x_t;\theta)$ 也服从高斯分布, 则有:

$$
x_{t-1}(z;x_t,t) = \mu_t(x_t, t;\theta)+\sigma_t(x_t, t;\theta)z \sim N(\mu_t(x_t, t;\theta), \sigma^2_t(x_t, t;\theta))
$$

$p(x_{t-1}|x_t;\theta)$ 无法用公式表示, 但是 $q(x_{t-1}|x_t,x_0)$ 可以, 有:

$$
\mu_t = \frac{1}{\sqrt{\alpha_t}}(x_t-\frac{\beta_t}{\sqrt{1-\bar{\alpha}_t}}\epsilon_t)
$$

$$
\sigma_t = \sqrt{\frac{1-\bar{\alpha}_{t-1}}{1-\bar{\alpha}_t}\beta_t}
$$

$$
x_{t-1}(z;x_t,\epsilon_t,t) = \mu_t+\sigma_tz \sim N(\frac{1}{\sqrt{\alpha_t}}(x_t-\frac{\beta_t}{\sqrt{1-\bar{\alpha}_t}}\epsilon_t), \frac{1-\bar{\alpha}_{t-1}}{1-\bar{\alpha}_t}\beta_t)
$$

(该公式不含 $x_0$, 但是需要有 $x_0$ 的前提下得到, 由前向的公式替换掉了, $\epsilon_t$ 与前向中的 $\epsilon_t$ 是同一个值)

## 损失计算

目标是能够让 $q$ 和 $p$ 尽可能的接近, 用 $q$ 去近似 $p$.

损失需要算 $q(x_{t-1}|x_t,x_0)$ 和 $p(x_{t-1}|x_t;\theta)$ 之间的 KL 散度(分布相似程度), 一通计算之后得到:

$$
Loss = E((\mu_t(x_t, \epsilon_t, t)-\mu_t(x_t,t;\theta))^2)
$$

优化后:

$$
Loss = E((\epsilon_t-\epsilon_t(x_t,t;\theta))^2)
$$

可以看出来实际推理中, 只有均值中的 $\epsilon_t$ 是未知的, 因此需要一个网络去猜测 $\epsilon_t$, 使得 $q(x_{t-1}|x_t,x_0)$ 可以近似替代 $p(x_{t-1}|x_t;\theta)$, 来还原 $t-1$ 步的数据.

优化后是去拟合加入的噪声数据, 也就是一个网络输入了 $t$ 时刻的加噪图, 能估计出添加的噪声变量 $\epsilon_t=\epsilon_t(x_t,t;\theta)$, 进而使用 $q(x_{t-1}|x_t,x_0)$ 得到 $x_{t-1}$.

## 一些编程时的步骤

### 基本参数

- $T$: 扩散步数, 至少 $100$ 以上.
- $\beta_1 < \beta_2 < \dots < \beta_T (0 < \beta_i < 1)$: 每一轮扩散的方差, 在满足大小关系的情况下, 尽可能的小, 通常在 $10^{-3}$ 的数量级左右. (应该步骤越多, 方差越精细?)

### 预计算的值

- $\alpha_t=1-\beta_t$
- $\bar{\alpha}_t=\prod_{i=1}^t\alpha_t$

### 设计一个神经网络

输入:

- $x_t$: 训练集样本经过 $t$ 轮正向扩散后的结果.
- $t$: 扩散步数

输出:

- $\epsilon_t(\theta)$: 噪声估计值

### 损失计算方法

产生一个随机噪声 $\epsilon_t$, 通过网络得到估计值 $\epsilon_t(\theta)$, 计算两者之间的均方差 (MSE损失).

### 训练步骤

给定训练集 $X$, 去拟合每个样本 $x$ 在每个步骤 $t$ 时刻的噪声估计.

### 推理步骤

给定一个真实样本 $x_t$, 指定其 $t$ 值, 根据网络得到噪声估计 $\epsilon_t(\theta)$, 计算出 $\mu_t$ 和 $\sigma_t$, 采样一个随机标准高斯噪声 $z$, 计算 $x_{t-1} = \mu_t+\sigma_tz$
