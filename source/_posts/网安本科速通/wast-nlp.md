---
title: 再遇文本分类
tags:
  - "深度学习"
  - "pytorch"
  - "文本分类"
  - "nlp"
categories:
  - "网安本科速通"
  - "必备技能"
date: 2022-08-19 14:29:33
---

这是[网安本科速通](/categories/网安本科速通/)系列的最后一篇了, 主题还是 `pytorch`, 但是问题换成了 `NLP`, 并且还是以经典的文本分类作为示例, 数据集使用与前面[经典问题之文本分类](/posts/2022/08/17/wast-ml/)相同的一份小数据集, 方便进行比较.

阅读本篇前需要先看前两篇, [经典问题之文本分类](/posts/2022/08/17/wast-ml/)与[基于 PyTorch 的手写数字分类](/posts/2022/08/17/wast-dl/). 本篇的项目代码和数据集是以前两篇作为基础的, 并且也会精简正文内容.

<!-- more -->

## 环境准备与项目结构

环境使用 `pytorch` 环境.

项目结构与文本分类项目结构一致, 并且使用相同的数据集.

## 快速上手

### 导入库

```python
import jieba
import numpy as np
from sklearn.datasets import load_files
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, f1_score, precision_score, recall_score
import torch
from torch import nn, optim
from torch.utils.data import DataLoader, Dataset
from torch.nn.utils.rnn import pad_sequence

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
```

前两个项目的结合, 都是些常规库.

### 构建数据集

```python
class Vocabulary:
    PAD = "<PAD>"
    UNK = "<UNK>"

    def __init__(self):
        self.token2id = {self.PAD: 0, self.UNK: 1}
        self.id2token = [self.PAD, self.UNK]

    def __len__(self):
        return len(self.token2id)

    def add_token(self, token):
        if token not in self.token2id:
            self.token2id[token] = len(self.token2id)
            self.id2token.append(token)

    def encode(self, text):
        return [self.token2id.get(x, self.token2id[self.UNK]) for x in text]

    def decode(self, ids):
        return [self.id2token[x] for x in ids]
```

先写一个词表类, 这个词表可以按需求添加生词, 并且将分词后的文本进行词与序号之间的编解码操作, 核心目的是提供文本向量化的能力.

```python
def load_raw_data(path):
    raw_data = load_files(path, encoding="utf8", shuffle=True, decode_error="ignore", random_state=1)
    data_x = raw_data["data"]
    data_y = raw_data["target"]
    index2label = raw_data["target_names"]
    label2index = {l: i for i, l in enumerate(index2label)}

    return (data_x, data_y), (index2label, label2index)


def preprocess(data_x, data_y):
    data_x = [jieba.lcut(s) for s in data_x]
    train_x, test_x, train_y, test_y = train_test_split(
        data_x, data_y, train_size=0.7,
        shuffle=True, stratify=data_y, random_state=1
    )

    vocab = Vocabulary()
    for text in train_x:
        for word in text:
            vocab.add_token(word)

    train_x = [vocab.encode(x) for x in train_x]
    test_x = [vocab.encode(x) for x in test_x]

    return (train_x, test_x, train_y, test_y), vocab
```

然后封装一下之前文本分类项目里的数据集加载操作, 手动使用 `jieba.lcut` 进行分词并构建词表, 最后返回划分好的训练集与测试集.

```python
class MyDataset(Dataset):
    def __init__(self, x, y):
        self.inputs = x
        self.targets = y

    def __len__(self):
        return len(self.inputs)

    def __getitem__(self, item):
        input_ = torch.tensor(self.inputs[item]).long().to(DEVICE)
        target = torch.tensor([self.targets[item]]).long().to(DEVICE)
        return (input_, target)
```

自定义数据集类, 与数字分类项目里的定义方式类似, 但是输入参数换成直接获取前面预处理好的数据集.

### 定义神经网络结构

```python
class MyNetwork(nn.Module):
    def __init__(self, vocab_size, output_size=7):
        super().__init__()
        _embedding_size = 128
        _hidden_size = 128
        _filter_sizes = (3, 4, 5)
        self.embedding = nn.Embedding(vocab_size, _embedding_size)
        self.dropout = nn.Dropout()
        self.convs = nn.ModuleList([nn.Conv1d(_embedding_size, _hidden_size, k) for k in _filter_sizes])
        self.fc = nn.Linear(_hidden_size * len(_filter_sizes), output_size)

    def _convpool(self, x):
        outputs = []
        for conv in self.convs:
            output = torch.relu(conv(x))                                # (128, L) -> (128, L-k+1)
            output = torch.max_pool1d(output, output.size(2)).squeeze() # (128, L-k+1) -> (128,)
            outputs.append(output)
        return torch.cat(outputs, -1)                                   # (128,) -> (384,)

    def forward(self, inputs):
        outputs = self.embedding(inputs)                                # (L,) -> (L, 128)
        outputs = self.dropout(outputs)                                 # 
        outputs = outputs.transpose(1, 2)                               # (L, 128) -> (128, L)
        outputs = self._convpool(outputs)                               # (128, L) -> (384,)
        outputs = self.fc(outputs)                                      # (384,) -> (7,)
        outputs = torch.log_softmax(outputs, -1)
        return outputs
```

继续使用与数字分类中相同的卷积结构, 也就是 `TextCNN`, 卷积核选择经典的三个值. 各个步骤的维度变化在注释里有标注.

### 定义指标评价函数

见[定义评价指标函数](/posts/2022/08/18/wast-dl/#定义评价指标函数).

### 训练与评估函数

见[定义训练函数](/posts/2022/08/18/wast-dl/#定义训练函数)与[定义评估函数](/posts/2022/08/18/wast-dl/#定义评估函数)

### 校对函数 (collate_fn)

```python
def collate_fn(data: list):
    inputs, targets = map(list, zip(*data))
    inputs = pad_sequence(inputs, batch_first=True)
    targets = torch.stack(targets)
    return inputs, targets
```

这个东西可能第一次见, 并且用了一些很奇怪的操作, 比如那个 `map`, 但是首先要明白这个函数用于干什么.

回忆我们在数字分类项目里使用 `DataLoader` 时, 它可以给我们提供一个 loader 来迭代我们自定义的 `Dataset`. `Dataset` 每次取出来的东西是一个二元组, 里面包含样本与标签两部分, 而 `Dataloader` 又能够按 `batch_size` 的大小批量获取这些二元组, 形成一个 `list`. 这个长度为 `batch_size`, 内容为二元组的 `list` 就是 `collate_fn` 的输入参数.

再看 `map` 那一行操作, 涉及了几个 `python` 函数用法, 这里直接说结论, 它将 `data` 里的样本与标签拆分成了两个单独的 `list`.

然后再说 `pad_sequence` 操作, 对于神经网络来说, 所有的计算过程都是矩阵计算, 但是对于文本任务, 每个样本句子长度几乎都不是相同的, 因此需要进行对齐操作, 对短句进行填充. 需要注意的是, 默认参数里的填充值是 `0`, 这与我们前面词表里的定义是一致的, 如果不一致则需要手动填一下.

最后是参数的返回值, 直接对应了我们从 loader 里迭代数据时获取的变量形式, 此处就是和之前一样, 分别返回样本列表与标签列表.

### 定义训练超参数

```python
seed = 1
learning_rate = 1e-3
batch_size = 16
epochs = 25

torch.manual_seed(seed)
torch.cuda.manual_seed(seed)
```

与前面的项目类似, 但是 `batch_size` 设的稍小一些, 因为对于文本处理, 按批次训练时, 进行了填充操作, 越大的 `batch_size` 能够得到越快的训练速度, 但是在一个 `batch` 内会引入更多不必要的 `0` 填充值, 可以酌情尝试调整.

### 加载数据集

```python
(data_x, data_y), (index2label, label2index) = load_raw_data("./data/")
(train_x, test_x, train_y, test_y), vocab = preprocess(data_x, data_y)

train_dataset = MyDataset(train_x, train_y)
test_dataset = MyDataset(test_x, test_y)
train_dataloader = DataLoader(train_dataset, shuffle=True, batch_size=batch_size, collate_fn=collate_fn)
test_dataloader = DataLoader(test_dataset, shuffle=True, batch_size=batch_size, collate_fn=collate_fn)
```

最大的不同就是添加了 `collate_fn` 参数, 其余的都是之前涉及过的操作.

### 实例化模型训练需要的对象

```python
model = MyNetwork(len(vocab)).to(DEVICE)
loss_fn = nn.CrossEntropyLoss().to(DEVICE)
optimizer = optim.Adam(model.parameters(), lr=learning_rate)
```

与之前的定义也是几乎一致的, 唯一的不同就是 `MyNetwork` 多了一个 `vocab_size` 的参数需要传进去, 其他参数都用的默认值.

### 训练模型

代码见[训练模型](/posts/2022/08/18/wast-dl/#训练模型), 这里只贴一下后 5 轮的训练结果.

```plain
===============================
Epoch 21
-------------------------------
Train Loss: 0.0071 Acc: 1.0000 F1: 1.0000(1.0000/1.0000)
Eval  Loss: 0.1102 Acc: 0.9667 F1: 0.9669(0.9669/0.9667)
===============================
Epoch 22
-------------------------------
Train Loss: 0.0055 Acc: 1.0000 F1: 1.0000(1.0000/1.0000)
Eval  Loss: 0.1099 Acc: 0.9644 F1: 0.9645(0.9645/0.9643)
===============================
Epoch 23
-------------------------------
Train Loss: 0.0056 Acc: 1.0000 F1: 1.0000(1.0000/1.0000)
Eval  Loss: 0.1062 Acc: 0.9644 F1: 0.9645(0.9645/0.9643)
===============================
Epoch 24
-------------------------------
Train Loss: 0.0048 Acc: 1.0000 F1: 1.0000(1.0000/1.0000)
Eval  Loss: 0.1019 Acc: 0.9667 F1: 0.9669(0.9669/0.9667)
===============================
Epoch 25
-------------------------------
Train Loss: 0.0042 Acc: 1.0000 F1: 1.0000(1.0000/1.0000)
Eval  Loss: 0.1051 Acc: 0.9644 F1: 0.9645(0.9645/0.9643)
===============================
```

可以看到在训练集上已经完全拟合了, 并且测试集上 F1 得分也高达 0.9645.

### 输出最终的测试结果

代码见[输出最终的测试结果](/posts/2022/08/18/wast-dl/#输出最终的测试结果), 这里只贴一下输出结果.

```plain
              precision    recall  f1-score   support

           0     0.9524    1.0000    0.9756        60
           1     0.9667    0.9667    0.9667        60
           2     1.0000    1.0000    1.0000        60
           3     0.9649    0.9167    0.9402        60
           4     0.9833    0.9833    0.9833        60
           5     0.9333    0.9180    0.9256        61
           6     0.9508    0.9667    0.9587        60

    accuracy                         0.9644       421
   macro avg     0.9645    0.9645    0.9643       421
weighted avg     0.9644    0.9644    0.9642       421
```

可以和之前使用朴素贝叶斯的文本分类做个比较, 可以看到还是有明显提升的, `2` 号类别甚至已经完全正确了. 当然这个对比不是很科学, 毕竟这是一个很小的数据集, 而且两者都还有大量的可调整空间. 朴素贝叶斯里有很多超参数, 而且样本的特征提取也有待进一步升级; `TextCNN` 网络里也有很多超参数可调, 比如词向量的长度等等.

不过神经网络的强处正是在于能够自动提取深层次特征, 避免了人工构造特征的麻烦, 也就是非常擅长 "找规律", 只要数据集充足, 选择合适的网络结构, 然后经过一番超参数调整之后, 效果都不会很差. ~~就是玄学炼丹.~~

## 相关资源

各个模块的使用方法可以去看 `pytorch` 的[官方网站](https://pytorch.org/), 项目中使用的数据集在前面的文章里也有, 这里再贴一下, [点击下载](https://ww-rm.lanzout.com/iTvKz09pcq8b).
