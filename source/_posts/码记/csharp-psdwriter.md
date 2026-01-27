---
title: C# 生成多图层 psd 文件
categories:
  - "码记"
tags:
  - "psd"
  - "CSharp"
  - "C#"
date: 2026-01-28 23:17:05
---

为了解决自己项目里一个 [Issue (#165)](https://github.com/ww-rm/SpineViewer/issues/165), 决定想办法在项目里实现 psd 文件的写入操作, 但是搜索了一圈没有发现比较合适的开源项目, 加上自己的需求比较简单, 就是把多张透明背景的图按顺序堆叠到一个 psd 文件里即可, 所以干脆自己研究了一下 psd 的文件格式, 造了个小轮子, 实现了最基本的多图层 psd 格式写入.

<!-- more -->

## 基本格式分析

根据官方的文档, 一个完整的 psd 文件分为 5 个部分, 分别是:

1. File Header
2. Color Mode Data
3. Image Resources
4. Layer And Mask Information
5. Image Data

其中 `File Header` 是固定大小 26 字节, 并且对于我的需求来说, 大部分取值也是固定的, 所以这部分比较简单.

| 字段 | 长度 | 详细说明 |
| :---:  | :---:  | :---:  |
| `Signature` | 4 字节 | psd 文件的文件头标识, 内容为 `b"8BIM"` |
| `Version` | 2 字节 | 固定为 1 |
| `Reserved` | 6 字节 | 全 0 字节 |
| `Number of channels` | 2 字节 | 图像通道数, 可以从简固定成 4 |
| `Height in pixels` | 4 字节 | 图像像素高度 |
| `Width in pixels` | 4 字节 | 图像像素宽度 |
| `Number of bits per channel` | 2 字节 | 位深, 可以从简固定成 8 |
| `Color mode` | 2 字节 | 可以从简固定成 3, 也就是 RGB 模式 |

只有图像的宽高是需要根据实际进行调整的.

另外在 psd 文件里, 都是按照**大端字节序**进行数据存储, 因此数值类型以及 Unicode 等的编码也都需要按大端序进行处理.

剩下的 4 个部分基本都是由不定长字节数组组成, 大致格式都是 "数据长度 + 数据内容" 构成, 并且可能嵌套定义.

但是如果只是需要写入简单的多图层 psd, `Color Mode Data` 和 `Image Resources` 部分是可以完全不需要的, 因此它俩的写入内容为空, 具体来说是各自写 4 个 0 字节 (表示该部分数据长度为 0).

除此之外, `Image Data` 部分内容也可以不需要实际内容, 但是需要有数据占位, 因此可以写固定内容, 所以只需要着重研究一下第 4 部分 `Layer And Mask Information`.

### Layer And Mask Information

该部分组成如下:

| 字段 | 长度 | 详细说明 |
| :---:  | :---:  | :---:  |
| `Length` | 4 字节 | 该部分的字节长度 |
| `Layer info` | 不定长度 | 详细的层信息 |
| `Global layer mask info` | 不定长度 | 全局蒙版信息, 可以从简不要, 写入 4 字节全 0 表示无内容即可 |
| `Series of tagged blocks` | 不定长度 | 一些额外的标记信息, 可以从简不要, 无需写入任何内容 |

由上可知, 我们需要的信息都存放在 `Layer info` 中, 它的定义如下:

| 字段 | 长度 | 详细说明 |
| :---:  | :---:  | :---:  |
| `Length` | 4 字节 | 该部分的字节长度 |
| `Layer count` | 2 字节 | 层的数量, 该值类型是有符号 16 位整数, 但是从简可以仅记录正数情况 |
| `Information about each layer` | 不定长度 | 层信息, 按顺序记录每个层的基本信息, 从前往后对应堆叠顺序的从下往上 |
| `Channel image data` | 不定长度 | 每个层的通道像素数据, 与层信息顺序保持一致 |

下面依次看看层信息和层通道数据部分的内容.

#### Layer records

层信息里面, 每个层都有自己的 `Layer records`, 多个层则直接按顺序连续写入各自的 `Layer records` 即可, 其基本定义如下:

| 字段 | 长度 | 详细说明 |
| :---:  | :---:  | :---:  |
| `Retangle of contents` | 4 * 4 字节 | 4 个有符号 32 位整数, 按顺序依次是 Top, Left, Bottom, Right. 从简可以将 Top 和 Left 固定成 0, Right 和 Bottom 分别取图像的宽和高. 其中 Top 和 Left 含端点, Right 和 Bottom 不含端点. |
| `Number of channels` | 2 字节 | 从简可以固定成 4 |
| `Channel information` | 6 * `Number of channels` 字节 | 通道的信息, 每个通道都有 2 + 4 个字节. 前 2 字节为有符号 16 位整数, 记录通道类型, 例如 0, 1, 2 分别表示 R, G, B 通道, -1 表示 A; 后 4 字节表示该通道像素数据的长度 |
| `Blend mode signature` | 4 字节 | 混合模式标记, 固定为 `b"8BIM"` |
| `Blend mode key` | 4 字节 | 混合模式, 常见的有 `norm`, `pass` 等, 从简可以固定为 `norm` |
| `Opacity` | 1 字节 | 不透明度, 从简可以固定为 255 |
| `Clipping` | 1 字节 | 从简可以固定为 0 |
| `Flags` | 1 字节 | 从简可以固定为 8 (根据新建的简单 psd 文件观察可得) |
| `Filler` | 1 字节 | 0 填充字节 |
| `Length of the extra data` | 4 字节 | 额外数据的长度, 指的是 `Layer records` 下这个字段结束往后的所有数据长度 |
| `Layer mask data` | 不定长度 | 可以从简不要, 写入 4 字节全 0 表示无数据 |
| `Layer blending ranges` | 4 + (2 + 2 * `Number of channels`) * 4 字节 | 可以从简为固定模式数据 |
| `Layer name` | 4n 字节 | 层的名字, 用 0 填充至 4 字节倍数 (实际观察似乎可能是历史遗留字段) |
| `Additional layer information` | 4n 字节 | 额外的层信息 |

对于 `Layer blending ranges`, 它的定义如下:

| 长度 | 详细说明 |
| :---: | :---: |
| 4 字节 | Length of layer blending ranges data |
| 4 字节 | Composite gray blend source range |
| 4 字节 | Composite gray blend destination range |
| 4 字节 | First channel source range |
| 4 字节 | First channel destination range |
| ... | ... |
| 4 字节 | Nth channel source range |
| 4 字节 | Nth channel destination range |

其中每个 range 都由 2 个黑色阈值和白色阈值组成, 而根据对简单的 psd 文件分析后, 可以固定每个 range 都为 `0x0000FFFF`, 加上通道数可以从简固定为 4, 所以 `Layer blending ranges` 的内容可以是 44 字节固定值.

对于 `Layer name`, 它有以下几部分:

`1 字节长度 || 字符串字节数组 || 0 填充`

整体需填充至 4 字节倍数, 并且分析实际文件得到长度最大值为 0x1F (31 字节), 也就是整个 `Layer name` 最长为 32 字节. 字符串所使用的编码似乎是本机活动代码页, 但实际观察下来似乎这个字段并没有被使用, 可以自行处理满足格式和长度要求即可.

最后是 `Additional layer information`, 该部分的格式大多如下:

`8BIM || 4 字节标签 || 4 字节数据长度 || 字节数据`

虽然文档上说数据需要 0 填充至偶数长度, 但是实际观察其实大部分都是需要填充至 4 字节倍数.

这里比较有用的两个标签是 `luni` 和 `lsct`, 分别用来记录层名称和定义分隔层.

{% note info "`luni` 标签数据格式" %}
`luni` 用来记录图层名称, 也就是 Photoshop 在图层面板上显示的可修改名称, 据实际测试在软件中该名称字符串不能超过 255 字符.
该标签的数据内容为使用大端模式 Unicode 编码的层名称, 整体结构为 `4 字节长度 || 编码后的字符数组 || 0 填充`.
每个字符会被编码为 2 字节, 并且使用 0 字节填充成 4 字节倍数, 已经是 4 字节整数时可以没有填充.
{% endnote %}

{% note info "`lsct` 标签数据格式" %}
`lsct` 用来标记该层是特殊的分隔层, 不包含实际像素内容, 可以用来建立图层分组.
简单情况下的数据格式为 `4 字节类型取值`, 该情况数据长度固定为 4, 有以下类型取值:

- `0`: 其他类型
- `1`: 打开状态的组
- `2`: 关闭状态的组
- `3`: 组分隔符, UI 上不显示

如果需要实现图层分组, 则需要用到后 3 种类型, 并且该图层 `Retangle of contents` 字段取值全 0, `Channel image data` 也是直接记录空数据.
根据实际的 psd 文件分析, 可以得到分隔层按线性方式来嵌套记录分组信息, 例如有以下图层和分组 (从上往下):

```markdown
- 层 1
- 组 2
  - 层 2.1
  - 组 2.2
    - 层 2.2.1
  - 层 2.3
- 层 3
```

则对应文件里的层顺序为:

```plain
- 层 1
- 组 2 (lsct=2)
- 层 2.1
- 组 2.2  (lsct=2)
- 层 2.2.1
- 分隔符 2.2 (lsct=3)
- 层 2.3
- 分隔符 2 (lsct=3)
- 层 3
```

也就是每个组都由一个组层 (lsct=2) 和一个组分隔符层 (lsct=3) 配合而成 (类似一个左括号和右括号), 并且分隔层处于组层的下面, 标识该组的结束位置. (在文件二进制数据的顺序里分隔层处于组层的前面, 因为堆叠顺序和文件内的排列顺序是反过来的, 即从前往后的层顺序对应从下往上的堆叠顺序)
{% endnote %}

#### Channel image data

这部分由多个连续的通道像素数据构成, 每个通道按以下格式组成:

`2 字节压缩模式 || 通道数据`

其中压缩模式有以下取值:

- 0: 原始数据
- 1: RLE 编码
- 2: 无预测的 ZIP 编码
- 3: 有预测的 ZIP 编码

常用的也就 0 和 1 两种编码方式, 实现起来也比较简单.

如果是 0, 则通道数据的大小为 `(Bottom - Top) * (Right - Left)` (也就是 `Layer records` 里的 `Retangle of contents` 字段代表的大小), 然后先行后列的顺序记录.

对于分组层, 或者空数据层, 则每个通道数据可以直接表示为 2 个 0 字节, 即原始数据模式且无数据.

如果是 1, 则将通道数据按行进行 RLE 编码, 也就是以下格式:

| 长度 | 详细说明 |
| :---: | :---: |
| 2 字节 | 压缩模式 |
| 2 * (Bottom - Top) 字节 | 每一行 RLE 编码数据字节长度 |
| 不定长度 * (Bottom - Top) 字节 | 每一行 RLE 编码数据 |

{% note info "RLE 编码" %}
PSD 使用的 RLE 编码也称 PackBits 算法 (TIFF standard 内使用的算法), 一段编码最多对不超过 128 字节数据进行编码, 超出部分则需要重新开始一段新的编码, 一段编码由两部分构成:

`1 字节长度标识 || 数据`

| 长度标识 `n` 取值范围 | 数据 |
| :---: | :---: |
| `[0, 127]` | `n + 1` 个原始字节数据 |
| `[-127, -1]` | `1` 字节, 但是重复 `-n + 1` 次 |
| `-128` | 无, 忽略并跳过 |

以下解码伪代码摘自原文:

> Loop until you get the number of unpacked bytes you are expecting:
> Read the next source byte into n.
> If n is between 0 and 127 inclusive, copy the next n+1 bytes literally.
> Else if n is between -127 and -1 inclusive, copy the next byte -n+1 times.
> Else if n is -128, noop.
> Endloop

{% endnote %}

最后将每个通道的像素数据编码后的数据按照 `Layer records` 的 `Channel information` 一致的层通道顺序进行写入, 如果有多个层则也按多个层的顺序写即可.

### Image Data

PSD 文件的最后一部分是 `Image Data`, 似乎是用来存储图像数据 (合并后), 据实测如果层数据没问题则该部分内容可以任意设置, 但是不能留空, 需要满足格式要求.

该部分数据格式与 `Channel image data` 类似, 也是需要对通道数据进行编码存放, 起始的 2 字节代表压缩模式, 取值也与之前的相同, 对数据的压缩方式也相同. 如果图像的通道数是 4, 则在此部分需要连续写入 4 个编码后的通道数据.

从简可以直接设置通道数据全 0, 并且使用 RLE 编码, 则直接根据图像的宽度对一行全 0 字节进行 RLE 编码后, 将编码结果重复写入多次即可.

## 代码实现

具体代码见 [SpineViewer](https://github.com/ww-rm/SpineViewer) 仓库的子项目 [PsdWriter](https://github.com/ww-rm/SpineViewer/tree/main/PsdWriter).

核心类和方法可以见 `PsdWriter.Sections.Layers.Layer` 及 `PsdWriter.Sections.Layers.RgbaLayer.SetRgbaImageData`.

## 参考

1. [Adobe Photoshop File Formats Specification](https://www.adobe.com/devnet-apps/photoshop/fileformatashtml/)
2. [TIFF6 Packbit algorithm](https://www.cnblogs.com/qianwen36/p/3965116.html)
3. [ISO 12639:2004@Section 9: PackBits Compression](https://www.iso.org/standard/34342.html)
