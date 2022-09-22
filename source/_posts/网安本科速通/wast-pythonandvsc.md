---
title: 打造一个舒适的 Python 编程环境
tags:
  - "python"
  - "VS Code"
categories:
  - "网安本科速通"
  - "新手入门"
date: 2022-08-13 13:53:17
---

网安专业几乎 99% 的作业都可以用 `python` 来解决, 除了大一大二一些特别的专业课, 需要折腾一下 `c` 语言, 之后其余的所有网安专业必修与选修的大作业, 都多多少少和 "大数据", "人工智能" 挂钩, 里面涉及了很多数据处理与分析, 这类任务用 `python` 写将会非常方便, 因为已经有了许多的第三方包让我们直接使用.

因此本篇主要基于个人经验介绍一下比较舒适的 `python` 编程环境设置, 让大家能够把精力放在~~抄~~写代码上, 而不是被环境弄的头疼.

<!-- more -->

## 前言

从本篇开始, 基本上算是完全的个人经验分享. 由于我自己是网安专业而非信安, 因此可能分享的内容对网安同学适用性更好, 不过信安同学可以酌情参考. 如果还没分专业, 也可以参考一下将来可能需要点一些啥技能来速通网安各个课程作业.

如果对 `VS Code` 没有了解, 可以看前一篇[给新生的编程工具推荐与基本使用方法](/posts/2022/08/11/wast-vscandvs/), 这里面讲了 `VS Code` 的基本使用方法. 而本篇将会基于 `VS Code`, 打造一个相对舒适的 `python` 编程环境.

## 安装 Python

第一步肯定是安装 `python`, 官网就是 [https://www.python.org/](https://www.python.org/).

可以选择下最新版, 不过不是那么的推荐, 而是适当旧一点, 比如现在最新的版本是 `3.10.6`, 那么可以下 `3.8.10` (`3.8.x` 发布的最后一个有安装包的版本). 这样子兼容度大一点. (曾经遇见过要装的某个包还没发布适配新版本 `python` 的版本, 害得我又重装降级了 `python`).

这里直接提供 [`Python 3.8.10`](https://www.python.org/downloads/release/python-3810/) 的官方下载页面, 点进去之后选 "Windows installer (64-bit)" 这个版本就好了.

下载好之后双击进入安装界面. 下面两项都勾上, 并且选择 "Customize installation".

![vtamNQ.png](https://s1.ax1x.com/2022/08/13/vtamNQ.png)

这一面也是直接全勾.

![vtaN4J.png](https://s1.ax1x.com/2022/08/13/vtaN4J.png)

再次 Next 之后, 这个界面里, 勾选 "Install for all users", 并且可以在下方调整 `python` 的安装路径. 推荐装到 D 盘或者其他方便找到的地方, 比如 `D:\Program Files\Python38`.

![vtd9VU.png](https://s1.ax1x.com/2022/08/13/vtd9VU.png)

重启一下电脑, 快捷键 `Win + R`, 输入 `cmd` 打开命令提示符, 敲一下 `python --version`, 如下图所示则安装成功.

![vtdqeK.png](https://s1.ax1x.com/2022/08/13/vtdqeK.png)

## Python 虚拟环境

### 虚拟环境简介

关于虚拟环境的详细介绍很多, 必应一搜就有很多[结果](https://cn.bing.com/search?q=python%E7%9A%84%E8%99%9A%E6%8B%9F%E7%8E%AF%E5%A2%83%E6%98%AF%E4%BB%80%E4%B9%88), 有时间可以慢慢理解.

当你写代码时, 不可能完全都靠自己从零开始, 这样子很低效~~并且很蠢~~, 所以对于 `python` 而言, 写代码之前确定并安装合适的第三方包就是基本操作.

然而, 第三方包在发布的时候, 可能会存在许多不同的版本, 不同项目之间所需要的包版本也不尽相同, 会造成巨大的兼容问题 (比如万恶的 `tensorflow 1.x` 和 `tensorflow 2.x`). 这种时候就需要使用虚拟环境.

虚拟环境可以简单认为是 "`python` 和对应的包的副本", 最基本的要素是环境内的 `python` 版本和包的版本. 每一个环境之间的 `python` 和包版本都是相互独立的. 这样子在运行项目时, 我们可以选择特定的某一个环境, 从而使用某个特定的 `python` 版本与包版本.

### 虚拟环境管理

网上很多推荐使用 [Anaconda](https://www.anaconda.com/) 来进行包和环境的管理, 我觉得可以但没必要, 一是臃肿二是让新手有点摸不着头脑. 不过等熟练之后用倒是个不错的选择.

这里只介绍一下 `python` 自带的 `venv` 模块使用以及第三方包 `virtualenvwrapper-win` 的使用.

#### 在环境中安装第三方包

一般来说, 安装完 `python` 之后, 就会有一个 "本地环境", 而将除本地环境之外的其他环境通常 "虚拟环境".

在运行 `python` 程序时, 是按照所指定的 `python` 解释器来决定使用的环境的.

我们在命令行里可以直接使用 `python` 指令, 实际上是因为我们在安装时勾选了 "Add Python 3.8 to PATH", 在环境变量 `PATH` 中添加了本地环境中 `python` 解释器的路径, 所以在使用 `python` 指令时, 实际上就是使用了本地环境.

通常主要使用内置的 `pip` 模块进行第三方包的管理, 并且有以下几个常用命令.

- `<解释器> -m pip list <包名>`: 列出当前环境所有安装的包.

- `<解释器> -m pip install <包名>`: 安装包.

- `<解释器> -m pip install <包名>`: 卸载包.

`<解释器>` 就是你要进行包管理的环境的解释器 `python.exe` 路径, 对于本地环境来说就是直接使用的 `python` 命令.

`-m pip` 表示调用了指定解释器中的 `pip` 模块进行包的管理.

`<包名>` 则是你需要的包的 "安装名称", 一般来说它和 `import` 语句的名字是一致的, 但是也有可能不一样, 推荐去官方的包发布网站 [https://pypi.org/](https://pypi.org/) 上进行搜索.

除此之外, `pip` 也支持使用 `whl` 文件或者源码安装, 具体的可以自行进一步学习.

#### 创建并使用虚拟环境

最简单的创建方法是使用自带的 `venv` 模块, 命令如下.

`python -m venv <路径>`

比如使用 `python -m venv env` 则会在当前目录下生成一个 `env` 文件夹, 这里面就包含了名为 `env` 的虚拟环境的解释器以及第三方库.

另外比较重要的文件是 `activate` 与 `deactivate`, 用于激活和退出虚拟环境.

具体的使用在后面的部分[在 VS Code 中使用 Python](#在-VS-Code-中使用-Python) 中再进行说明.

另一种方案是使用第三方库 `virtualenvwrapper-win` 来辅助我们管理虚拟环境.

使用 `python -m pip install virtualenvwrapper-win` 进行安装. 安装完后, 即可以在命令行中使用以下几个常用命令对机器上的虚拟环境进行集中管理.

- `mkvirtualenv <虚拟环境名称>`: 创建虚拟环境.
- `workon <虚拟环境名称>`: 激活对应的虚拟环境.
- `rmvirtualenv <虚拟环境名称>`: 删除虚拟环境.

前面的 `venv` 模块常常用于某个项目内的临时环境, 而 `virtualenvwrapper-win` 这个第三方工具主要用于你希望自己的电脑上常驻某些不同类别的环境, 并对它们方便的进行集中管理.

默认该模块创建的环境都将位于 `%USERPROFILE%\envs` 文件夹下,可以通过环境变量 `WORKON_HOME` 来自定义你希望的存储位置.

### 常用的第三方包

对于速通网安, 有一些常用的第三方库总结, 在这里把我自己常用的包情况列举一下.

```plain
# 用于格式化和检测代码规范的工具
autopep8
pylint

# 与爬虫有关的库
lxml
beautifulsoup4
requests

# 与数据处理有关的库
numpy
pandas
matplotlib

# 机器学习以及深度学习相关的库
opencv-python
scikit-learn
# torch
# torchaudio
# torchvision

# 在 VS Code 内使用 jupyter notebook 有关的库
ipykernel
jupyter
```

其中 `torch` 的安装需要前往官网 [https://pytorch.org/](https://pytorch.org/) 按说明进行安装.

## 在 VS Code 中使用 Python

这一节将会实践一下前面所有的内容, 在 `VS Code` 中使用 `python` 完成一次向量乘法计算.

打开之前曾经创建的 `example` 文件夹, 并且新建一个终端.

![vNUegI.png](https://s1.ax1x.com/2022/08/13/vNUegI.png)

我们使用以下命令为这个项目建立一个单独的虚拟环境, 取名为 `env`.

`python -m venv env`

![vNami4.png](https://s1.ax1x.com/2022/08/13/vNami4.png)

命令执行完成后, 左边的资源管理器面板上多出来一个 `env` 文件夹, 这就是我们刚刚创建好的虚拟环境. 我们使用 `.\env\Scripts\activate` 在终端中激活这个虚拟环境, 激活完成后可以看到终端的提示信息前面多了一个 `(env)` 标记, 表示当前终端处于 `env` 的虚拟环境之下.

如果出现不能执行的情况, 可以参考[这篇博客](https://www.cnblogs.com/daxiong1314/p/16265549.html)解决权限问题. 或者在 `VS Code` 的设置里把默认的终端类型调成 `cmd` 而不是 `powershell`, 我推荐改成 `cmd` 一劳永逸. ~~`powershell` 屁事多~~.

解决完问题之后就如下图所示了.

![vNdYn0.png](https://s1.ax1x.com/2022/08/13/vNdYn0.png)

此时在终端里直接执行 `python` 有关的命令, 都会映射到虚拟环境里的命令.

然后我们继续, 使用 `pip` 向虚拟环境里添加一个第三方库 `numpy`.

![vNwSvn.png](https://s1.ax1x.com/2022/08/13/vNwSvn.png)

顺利安装完成之后, 可以看到左边的 `env` 文件夹里 `site-packages` 下多出来一个 `numpy` 的文件夹, 这就是我们刚刚安装好的第三方库了. 同时终端里给了我们一个 `WARNING`, 提示我们可以对 `pip` 模块进行升级. 虽然影响不是很大, 不过推荐复制它提供的指令升一下级, 这样 `pip` 在查找和安装包时能够使用最新的功能, 减小安装失败的风险~~主要是有彩色进度条~~.

然后清空之前 `main.py` 里面的代码, 并且敲入以下新的内容.

![vNDSvd.png](https://s1.ax1x.com/2022/08/13/vNDSvd.png)

```python
import numpy as np

if __name__ == "__main__":
    vector1 = np.array([1, 2, 3])
    vector2 = np.array([2, 3, 4])

    print(np.dot(vector1, vector2))
    print(np.multiply(vector1, vector2))
```

会发现 `import` 语句的 `numpy` 有黄色波浪线, 同时下面的 "问题" 面板有写出来原因, 意思是没有 `numpy` 这个库.

这是因为虽然我们刚刚在终端里是已经成功激活了虚拟环境, 但是对于 `VS Code` 来说, 它并不关心终端里是什么情况, 而是对于这个项目来说, 它需要使用什么环境来处理项目内容, 所以我们还需要在下方的状态栏里切换 `VS Code` 对于当前项目使用的 `python` 环境.

![vN0OpQ.png](https://s1.ax1x.com/2022/08/13/vN0OpQ.png)

点击下方状态栏的环境选择, 并且切换到刚刚创建的 `env` 环境, 此时下方的环境已经换成了 `'env':venv`, 并且刚刚的黄色波浪线与问题也消失了.

此时我们可以选择在激活了虚拟环境的终端里运行这份代码, 或者使用快捷键 `Ctrl + F5` 让 `VS Code` 帮我们运行. 这里展示一下在终端里直接运行的结果, 可以看到成功输出, 一个是向量内积结果, 一个是向量按位乘法结果.

![vNDsPO.png](https://s1.ax1x.com/2022/08/13/vNDsPO.png)

## 后话

到这里就结束了, 说实话只讲了 `VS Code` 中使用 `python` 的最基本技巧, 这些操作之后写代码的时候多操作几次应该就烂熟于心了.

但是对于进校没多久的萌新们来说, 估计看的还是很晕的, 因为有很多新名词, 特别是 "环境变量" 这种, 可能是完全第一次听说, 而且也容易出问题. 所以还是建议多动手尝试尝试, 并且善用搜索引擎, 多翻几篇博客, 总会能够找到适合你问题的解决方案.

就这样了, 下回单独写写怎么合理的科学上网, 为使用 `Github` ~~抄代码~~打下坚实基础.
