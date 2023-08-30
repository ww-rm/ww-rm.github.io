---
title: 基于 Requests 的爬虫入门
categories:
  - "网安本科速通"
  - "必备技能"
tags:
  - "爬虫"
  - "requests"
date: 2022-08-16 22:03:17
---

本篇是基于 `python` 语言及其第三方库 `requests` 的爬虫入门, 实现一个最简单的爬虫, 从网页上自动化获取我们能想要的信息.

<!-- more -->

教程要开始加速了! 从本篇开始, 默认你已经有了一些编程基础, 并且对 `python` 已经有过不少的使用经验, 将以速通为根本目的, 进行示范性操作, 而不会过深的涉及代码原理. ~~努力成为一个调包侠吧!~~

## 工具与环境准备

浏览器: `Edge`, `Chrome`, `Firefox` 均可, 推荐使用 `Firefox`, 抓包更方便.

`python` 的第三方库: `beautifulsoup4`, `lxml`, `requests`.

## 爬虫基本原理

爬虫的本质是在模仿用户操作浏览器的过程.

我们平常看到的网页内容, 都是通过操作浏览器, 浏览器再向服务器请求内容从而呈现给用户, 省去复杂的网络通信过程之后, 可以简要概括成下面的流程图.

![v0cQQx.png](https://s1.ax1x.com/2022/08/16/v0cQQx.png)

我们的目标就是使用代码来完成其中的发出请求和接收响应的过程.

## 快速上手

下面以百度热搜的游戏榜为例, 梳理一下每一步, 最后写一个爬虫出来.

### 分析网站

这是第一步也是最重要的一步, 通常使用浏览器的开发人员工具, 对你想要抓取的页面进行网络请求分析, 观察请求是如何发起, 想要的内容响应返回后出现在什么地方.

目标网页网址为 `https://top.baidu.com/board?tab=game`, 浏览器查看一下长这样.

![v0hSFU.png](https://s1.ax1x.com/2022/08/16/v0hSFU.png)

我们的目标是获得整个榜按顺序所有游戏的**名字**, **热搜指数**, **类型**以及**详情页链接**.

打开我们的 `Firefox` 浏览器 (其他浏览器也是类似的), 首先快捷键 `F12` 或者更多工具里打开 "开发者工具", 并切换到 "网络" 选项卡.

![v0hhc9.png](https://s1.ax1x.com/2022/08/16/v0hhc9.png)

此时我们的页面停留在目标页面, 并且没有任何的记录信息, 因此我们选择 "重新载入" 或者刷新一次页面, 让浏览器重新发起一次请求.

![v04mBq.png](https://s1.ax1x.com/2022/08/16/v04mBq.png)

查看网络请求的第一项, 也就是向目标网址发起的请求, 并选择右侧的响应选项卡, 可以看到我们要的内容已经预览出来了.

所以我们确定爬取内容的方案, 就是直接请求目标网址, 然后获得文本内容响应即可.

### 请求网页

```python
from pathlib import Path
import requests

res = requests.get("https://top.baidu.com/board?tab=game")
print(res.status_code)

Path("a.html").write_text(res.text, encoding="utf8")
```

代码如上所示, 我们在这里解释一下关键代码 `requests.get`.

在之前的网络请求面板中, 除了看到了响应, 我们还能够看到左侧的信息栏里, 有 "状态" 与 "方法" 两个取值, 分别为 `200` 和 `GET`.

方法: 当浏览器向服务器发出请求时, 请求是有不同类型的, 其基本的区分标志就是该请求的方法 (Method), 常见的有 `GET` 与 `POST`, 此处则为 `GET` 请求方法.

状态: 当服务器送回响应时, 除了相应的内容, 还会有一个基本要素 "响应状态码" (Status Code), 用来标识此次请求操作的结果 (而非请求需要的内容), 可以通过状态码来判断返回内容的类别. 通常为 `2XX`, `4XX` 等三位数字, 此处的 `200` 则是表示请求成功, 并正确的返回了响应内容.

所以代码里的 `requests.get` 就是对参数里的 url 使用 `GET` 方法发起了请求, 并将响应存储到了 `res` 变量中, 随后将响应的状态码打印出来.

将响应的文本内容保存至本地文件 `a.html` 中, 等待后续进一步分析.

### 分析网页结构与内容

与网站的交互就到此暂告一段落了, 接下来是对网页内容的分析, 从中提取出我们想要的内容.

在 `VS Code` 中打开刚刚保存的 `a.html`, 并且使用自带格式化程序整理一下, 再使用 `Ctrl + F` 搜索内容中的关键词进行快速定位.

![v0oHrd.png](https://s1.ax1x.com/2022/08/16/v0oHrd.png)

定位完成后, 我们分析数据附近的结构.

![v0TFZn.png](https://s1.ax1x.com/2022/08/16/v0TFZn.png)

贴一个缩小后的图, 由 `html` 的树形结构可以知道, 红框里的每一个 `<div>` 块内就是榜上排名的其中一项游戏数据, 而它们的嵌套结构也很容易分析, 所有红框所示的数据都位于 `<main>` 的第二个 `<div>` 的第一个 `<div>` 的第二个 `<div>` 内, 不过这个嵌套有点稍长, 我们尝试看看最近的一个 `div` 是否有独特性.

使用 `Ctrl + F` 搜索最里层的 `<div>` 块的属性 `style` 的内容 `margin-bottom:20px`, 惊喜的发现只查找到了一个, 所以我们待会可以直接定位到这一层, 然后依次获取它下面的子级 `<div>` 内容, 也就是我们要的数据.

我们继续分析红框所示的 `<div>` 块内容, 它的内容由 3 部分组成, 分别是 `<a>`, `<div>` 和 `<div>`, 而我们需要的内容就位于后两个 `<div>` 中.

按同样的方式可以继续分析最终的文本数据位于何处, 此处不再赘述.

### 从网页内容提取数据

面对这种有良好嵌套结构层次的网页, 我们使用 `beautifulsoup4` 对其进行内容解析, 下面直接贴代码.

```python
soup = BeautifulSoup(res.text, "lxml")
items_div = soup.find("div", {"style": "margin-bottom:20px"}).find_all("div", recursive=False)
for div in items_div:
    index = div.find_all("div", recursive=False)[0].find_all("div", recursive=False)[1].get_text(strip=True)
    name = div.find_all("div", recursive=False)[1].find("a", recursive=False).find("div", recursive=False).get_text(strip=True)
    link = div.find_all("div", recursive=False)[1].find_all("div", recursive=False)[1].find("a", recursive=False).attrs["href"]
    type_ = div.find_all("div", recursive=False)[1].find_all("div", recursive=False)[0].get_text(strip=True)
    print(f"{name}\t{index}\t{type_}\t{link}")
```

代码中变量 `items_div` 其中一个 `div` 的 `html` 内容也附上.

```html
<div class="category-wrap_iQLoo square_1ULM9">
    <a class="img-wrapper_29V76"
        href="https://www.baidu.com/s?wd=%E5%8E%9F%E7%A5%9E+%E6%B8%B8%E6%88%8F&amp;sa=fyb_game_all&amp;rsv_dl=fyb_game_all"
        target="_blank">
        <div class="index_1Ew5p c-index-bg1"> 1 </div> <img
            src="https://fyb-1.cdn.bcebos.com/fyb-1/20220811/4d0a80d59a3675130cf61eff31e3ae41?x-bce-process=image/resize,m_fill,w_214,h_214"
            alt="">
        <div class="border_3WfEn"></div>
    </a>
    <div class="trend_2RttY">
        <div class="img-wrap_JPOmE trend-icon_1Z3Cd"> <img
                src="//fyb-pc-static.cdn.bcebos.com/static/asset/icon-same_886375f242bd1538af21a9721f16b170.png">
        </div>
        <div class="hot-index_1Bl1a"> 228934 </div>
        <div class="text_1lUwZ"> 热搜指数 </div>
    </div> <img class="line_3-bzA"
        src="//fyb-pc-static.cdn.bcebos.com/static/asset/line-bg@2x_95cb5a089159c6d5a959a596d460d60a.png">
    <div class="content_1YWBm">
        <a href="https://www.baidu.com/s?wd=%E5%8E%9F%E7%A5%9E+%E6%B8%B8%E6%88%8F&amp;sa=fyb_game_all&amp;rsv_dl=fyb_game_all"
            class="title_dIF3B " target="_blank">
            <div class="c-single-text-ellipsis"> 原神 </div>
        </a>
        <!--s-frag-->
        <div class="intro_1l0wp"> 类型：单机游戏 </div>
        <div class="c-single-text-ellipsis desc_3CTjT">
            陌生的天空下，少年少女立于尘沙。你们是一对旅行中的双子，从世界之外漂流而来。你的血亲被陌生的神灵带走，而你也被神封印，陷入沉眠。再度醒来，天地间风景已变……《原神》是由米哈游自研的一款全新开放世界冒险RPG。你将在游戏中探索一个被称作「提瓦特」的幻想世界。在这广阔的世界中，你可以踏遍七国，邂逅性格各异、能力独特的同伴，与他们一同对抗强敌，踏上寻回血亲之路；也可以不带目的地漫游，沉浸在充满生机的世界
            <a href="https://www.baidu.com/s?wd=%E5%8E%9F%E7%A5%9E+%E6%B8%B8%E6%88%8F&amp;sa=fyb_game_all&amp;rsv_dl=fyb_game_all"
                class="look-more_3oNWC" target="_blank"> 查看更多&gt; </a>
        </div>
        <!--/s-frag-->
    </div>
</div>
```

代码稍显冗长, 首先是获得 `soup`, 也就是解析好的文档内容, 然后是反复的调用核心函数 `find` 和 `find_all`.

`bs4` 的理念是, 整个文档 `soup` 会被视作一个文档树, 且其中的子节点也是相同的小文档树, 形成一个递归结构. 而使用这两个函数则可以很方便的在树中进行遍历与查找.

两个函数参数相同, 详情可以查阅使用文档, 唯一不同的地方是 `find` 只获取找到的第一个节点而 `find_all` 则会获取所有节点返回一个列表. 我们给所有的调用都加上了 `recursive=False`, 这样可以确保让我们一层一层依次往下而不是递归获取内部所有节点, 每一层节点的序号和文档内部的实际情况相对应, 可以自行对比看看每一行是怎么来的.

`get_text` 用来获取当前节点内部所有的文本内容, 加上参数后可以去除首尾的空白.

### 接下来干什么

获得数据之后, 我们可以选择保存到文件进行存储.

但是我们获取的东西非常有限, 仅仅只是一个排行榜, 不过在这些数据里, 有一项是详情链接, 后续可以进一步对详情链接的页面进行分析, 从而实现对详情页面内容的抓取, 让爬虫爬的更远一点.

## 相关资料

这次文章内容很简短, 仅仅是实践了一下最基本过程, 并且随着网站数据更新, 页面结构随时会发生变化, 因此还需多多练习.

有很多与爬虫相关的内容, 可以搜索相关的关键词进行进一步学习, 一并贴在下面了.

`http 协议`: 进一步了解请求中的方法和响应中的状态码的含义, 掌握更多浏览器与服务器交互的细节过程.

`html 文档结构`: 了解网页的树形结构, 学习 `html` 语法.

`正则表达式`: 除了使用 `beautifulsoup4` 这样的工具结构化处理网页, 也可以按规则直接搜索你想要的所有结果.

一些库的官方文档地址.

`requests`: [https://requests.readthedocs.io/](https://requests.readthedocs.io/)

`beautifulsoup4`: [https://www.crummy.com/software/BeautifulSoup/bs4/doc/](https://www.crummy.com/software/BeautifulSoup/bs4/doc/)
