---
title: 对话情绪检测
categories:
  - "个人项目"
tags:
  - "情绪检测"
  - "nlp"
  - "自然语言处理"
date: 2021-09-11 15:30:17
mathjax: true
---

本篇是大三时自然语言处理课程的大作业, 题目选了 "对话情绪检测" (Emotion Detection in Conversations), 目标是对对话中的每个句子进行情绪的分类，以此来识别说话者当时的情绪.

本文整理一下自己的课程报告内容, 并将代码整理至 Github 上, 文末附有项目地址.

<!-- more -->

## 软硬件环境

软件: `python 3.7`, `pytorch 1.6.0`, `pytorch-nlp`

硬件: `GeForce RTX 2080 Ti`

## 数据集

使用的数据集为 [DailyDialog][dataset] 对话数据集, 在这里我们只用到对话文本数据和情绪标签文件.

对话数据为多行文本, 每一行是一段对话, 每一句话用 `__eou__` 作为结束符. 每一段对话只有两个说话人, 且交替出现.

在标签文件中, 每一行与对话数据一一对应, 但是每句话换成标签值, 取值范围 0-6, 共7种不同的情绪类别.

## 网络模型

模型设计主要参考论文: [DialogueRNN: An Attentive RNN for Emotion Detection in Conversations][paper].

整个网络大致分为特征提取和情绪分类两部分.

### 特征提取

首先是文本的嵌入表示, 使用 `GloVe` 预训练词向量来转换原始文本, 词向量维度大小为 300.

在使用预训练词向量之后, 对于每段对话中的每个发言, 采用 `BiLSTM` 进行语义提取, 取正向和反向的最后时刻输出拼接在一起, 最终将每句话转换为等长向量.

### 情绪检测

这一部分存在 4 个状态变量:

- 全局上下文信息: 用于记录当前对话的进行位置以及对话的整个历史信息.
- 两个说话人状态: 用于记录每个说话人在最新发言之前的状态.
- 情绪状态: 用于记录最近一次发言的情绪状态, 用于输出每句话的情绪向量表达.

整个结构可以用下图表示:

![detection_model](/static/image/emodetection/detection_model.jpg)

其中 $U_t$ 就是每一句话, $t$ 代表时刻.

注意力结构使用了简单的乘性注意力, 具体可以看代码, 就是求点积然后 softmax.

最后将每个句子对应的 $E_t$ 放进线性层进行分类.

## 结果

最终的训练参数如下:

```python
Namespace(
   batch_size=16, 
   embedding_size=300, 
   lstm_size=256, 
   hidden_size=256, 
   learning_rate=0.001, 
   epochs=50, 
   seed=1, 
   istrain=True, 
   dev_data_path='./data/Emotion Detection in Conversations/validation/dialogues_validation.txt', 
   dev_label_path='./data/Emotion Detection in Conversations/validation/dialogues_emotion_validation.txt', 
   model_save_path='attn.pt', 
   test_data_path='./data/Emotion Detection in Conversations/test/dialogues_test.txt', 
   test_label_path='./data/Emotion Detection in Conversations/test/dialogues_emotion_test.txt', 
   train_data_path='./data/Emotion Detection in Conversations/train/dialogues_train.txt', 
   train_label_path='./data/Emotion Detection in Conversations/train/dialogues_emotion_train.txt'
)
```

在测试集上的结果如下:

```plain
              precision    recall  f1-score   support

           0       0.91      0.91      0.91      6321
           1       0.43      0.25      0.31       118
           2       0.46      0.23      0.31        47
           3       0.71      0.29      0.42        17
           4       0.60      0.62      0.61      1019
           5       0.28      0.27      0.28       102
           6       0.48      0.43      0.45       116

    accuracy                           0.84      7740
   macro avg       0.55      0.43      0.47      7740
weighted avg       0.84      0.84      0.84      7740
```

咋说呢, 调过很多参数了, 但是效果都不是很好, 个人感觉是数据集太小了, 样本数不够, 或者是炼丹手法不行, 有哪里不对, 看人家论文里也不是特别高就是了. ~~教辅说可能就是这个任务不适合深度学习, 但是我觉得数据量管够啥都能深度学习.~~

## 后记

作为一个结课作业项目, 没有太多创新之处, 只是复现了一下论文里的模型结构, 然后在不同的数据集上做了实验, 效果说不上多好.

主要收获就是增强动手能力吧, 毕竟是纯手搓的网络代码, 让自己能更加熟悉一些基础网络结构和 `pytorch` 框架的使用方法.

## 相关资源

项目地址: [Emotion Detection in Conversations](https://github.com/ww-rm/Emotion-Detection-in-Conversations)

参考论文: [DialogueRNN: An Attentive RNN for Emotion Detection in Conversations][paper]

数据集地址: [DailyDialog][dataset]

[paper]: https://doi.org/10.1609/aaai.v33i01.33016818
[dataset]: http://yanran.li/dailydialog
