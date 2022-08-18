---
title: 经典问题之文本分类
tags:
  - "机器学习"
  - "scikit-learn"
  - "文本分类"
categories:
  - "网安本科速通"
  - "必备技能"
date: 2022-08-17 20:01:25
---

成为一个熟练的调包侠是速通的关键要素之一, 在无数的课程大作业和小任务中, 使用机器学习来解决一些问题算是经典中的经典~~典中典~~, 比如通过文本分类来实现垃圾邮件过滤. 因此本篇将基于 `python` 中最常用的机器学习库 `scikit-learn`, 用朴素贝叶斯模型来完成一次文本分类任务.

<!-- more -->

## 环境准备

需要的第三方库.

`jieba`: 一个中文分词库, 可以将一个句子分成一个个的单词.

`scikit-learn`: `python` 中最常用的机器学习库, 内置多种模型与算法, 开箱即用.

## 项目结构

```plain
example/
    data/
        财经/
            1.txt
            2.txt
            ...
            200.txt
        房产/
            1.txt
            ...
            200.txt
        XXX/
            XXX.txt
        ...
    main.py
    main.ipynb
```

![vBh4sA.png](https://s1.ax1x.com/2022/08/17/vBh4sA.png)

## 快速上手

### 导入所有需要用到的库

```python
import jieba
from sklearn.datasets import load_files
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import MultinomialNB
```

### 读取数据集

```python
raw_data = load_files("./data/", encoding="utf8", shuffle=True, decode_error="ignore", random_state=1)
data_x = raw_data["data"]
data_y = raw_data["target"]
index2label = raw_data["target_names"]
label2index = {l: i for i, l in enumerate(index2label)}
# print(len(data_x), data_x[1])
# print(len(data_y), data_y[1])
# print(index2label)
# print(label2index)
## ========== Output ==========
## 1400 她们深陷美妆圈分享好货停不下来...更多的是时间与心思。
## 1400 3
## ['家居', '房产', '教育', '时尚', '时政', '科技', '财经']
## {'家居': 0, '房产': 1, '教育': 2, '时尚': 3, '时政': 4, '科技': 5, '财经': 6}
## ============================
```

数据的读取直接使用现成的库函数 `load_files`, 需要满足一定的目录结构才能直接使用, 即数据集文件夹下面是类别文件夹, 类别文件夹下面是每一份数据文件.

读取之后返回的对象包含所有的原始数据与自动生成的标签, 从 `index2label` 和 `label2index` 可以看到数字标签与类别文字的对应关系.

如果是其他形式的数据集, 需要自己写加载函数. 加载后的获取的内容与上面的应当类似, 有数字标签及其与文字类别的对应关系, 以及样本与标签相互对应的两个有序列表.

### 划分训练集与测试集

```python
train_x, test_x, train_y, test_y = train_test_split(
    data_x, data_y, train_size=0.7,
    shuffle=True, stratify=data_y, random_state=1
)
# print(f"train_x: {len(train_x)}")
# print(f"test_x: {len(test_x)}")
## ========== Output ==========
## train_x: 979
## test_x: 421
## ============================
```

继续调包来划分数据集, 并且填入参数, 按 7:3 划分训练集与测试集.

其中 `stratify` 参数含义为按比例划分, 即训练集与测试集的各类别之间的比例与提供的 `data_y` 比例一致, 即划分前的总比例.

### 对数据集进行特征提取

```python
cv = CountVectorizer(tokenizer=jieba.lcut)
train_x = cv.fit_transform(train_x)
test_x = cv.transform(test_x)
```

因为我们最终是使用朴素贝叶斯模型进行文本分类, 因此需要得到一些离散特征.

这部分使用了 `CountVectorizer` 来进行特征提取, 它可以使用 `tokenizer` 对数据集进行分词并统计, 在内部构建一个词典, 将每个单词映射到一个序号, 进而把每个样本变成一个向量.

`CountVectorizer.fit`: 接受数据集进行拟合, 更新内部的词典.
`CountVectorizer.transform`: 接受数据集, 按照内部的词典将每个样本转换成向量形式.

在这里我们使用 `fit_transform` 来处理训练集, 这是两步合并操作, 意思是使用训练集来构建词典并将训练集向量化.

但是只使用 `transform` 来处理测试集, 也就是使用训练集上的词典来向量化测试集. 这个比较好理解, 因为对于模型来说, 通过训练集训练, 理论上来说是不知道测试集的内容的, 因此不需要让词典更新测试集的词汇.

### 构建模型并拟合

```python
model = MultinomialNB()
model.fit(train_x, train_y)
```

我们选择 `MultinomialNB` 模型, 因为它是 `sklearn` 中适合处理离散特征的贝叶斯模型, 有很多可调节的参数, 这里从简, 直接全部默认参数.

把训练集喂进模型的 `fit` 函数, 然后等待一会训练过程.

### 在测试集上测试准确性

```python
pred_y = model.predict(test_x)
print(classification_report(test_y, pred_y, target_names=index2label))
```

将测试集的样本喂进训练之后的模型 `predict` 函数中得到 `pred_y`. 我们直接调包来计算各项指标 (当然包里还有其他分别计算各项指标的函数), 得到如下输出.

```plain
              precision    recall  f1-score   support

          家居       0.88      0.97      0.92        60
          房产       1.00      0.80      0.89        60
          教育       0.82      1.00      0.90        60
          时尚       1.00      0.98      0.99        60
          时政       0.91      0.85      0.88        60
          科技       1.00      0.97      0.98        61
          财经       0.98      0.98      0.98        60

    accuracy                           0.94       421
   macro avg       0.94      0.94      0.94       421
weighted avg       0.94      0.94      0.94       421
```

可以看到效果不错, 稍低一点的是 "房产" 与 "时政", 召回率较低, 猜测可能被误分类到 "家居" 和 "教育" 里面去了.

## 总结

其实做一个调包侠还是挺简单的, 不到 50 行代码就实现了一个看起来似乎挺麻烦的事, 但是能够正确调包的前提是知道各个模型的基本原理, 能够构建合适的特征并选择合适的模型, 同时也需要对常用的机器学习库的 api 有一定了解和使用经验, 不然连调包侠也当不了 X﹏X.

## 相关资源

`scikit-learn` 官方文档: [https://scikit-learn.org/stable/index.html](https://scikit-learn.org/stable/index.html) (其实这文档很少看, 不如搜索引擎现搜).

另外贴一下文章里面用的数据集网盘地址, [点击下载](https://ww-rm.lanzout.com/iTvKz09pcq8b).

没啥其他相关资源了, 课上好好学~~课下慢慢搜~~就完事了.
