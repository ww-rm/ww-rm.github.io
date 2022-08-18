---
title: 基于 PyTorch 的手写数字分类
tags:
  - "深度学习"
  - "pytorch"
  - "python"
  - "手写数字分类"
categories:
  - "网安本科速通"
  - "必备技能"
date: 2022-08-18 20:29:33
---

本篇算是对 `pytorch` 这一 `python` 深度学习库神器的入门教程, 以手写数字分类这一经典问题做示例, 来概括一下如何使用 `pytorch` 来搭建一个自定义的网络结构, 并加以训练.

<!-- more -->

## 环境准备

所需的第三方库.

`scikit-learn`: 并没有用到里面的算法, 但是小调一下里面现成的指标评价函数, 减少不必要的重复劳动.

`pytorch`: 本篇要使用的核心库, 安装方式需要在[官网](https://pytorch.org/)查询, 且按需安装 `cuda` 工具.

## 项目结构

```plain
example/
    digit_data/
        train/
            0/
                1.jpg
                2.jpg
                ...
            ...
            9/
                ...
                XXX.jpg
        test/
            ...
    main.py
    main.ipynb
```

![vrAZse.png](https://s1.ax1x.com/2022/08/18/vrAZse.png)

## 并不快速的快速上手

### 导入所需要的所有库

```python
import numpy as np
from sklearn.datasets import load_files
from sklearn.metrics import accuracy_score, classification_report, f1_score, precision_score, recall_score
import torch
from torch import nn, optim
from torch.utils.data import DataLoader, Dataset
from torchvision.io import read_image
from torchvision.io.image import ImageReadMode

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
```

除了导入必需的库之外, 还设置了一个全局变量 `DEVICE`, 后续代码会使用它, 将计算放在 `DEVICE` 指定的硬件上进行计算, 推荐尽量用 gpu, 速度快很多, 当然对于这个小小的示例程序, cpu 也是能算的.

### 构建自己的数据集

```python
class MyDataset(Dataset):
    def __init__(self, path):
        data = load_files(path, load_content=False, shuffle=False)
        self.inputs = data["filenames"]
        self.targets = data["target"]

    def __len__(self):
        return len(self.targets)

    def __getitem__(self, item):
        input_ = read_image(self.inputs[item], ImageReadMode.GRAY).float().to(DEVICE)
        target = torch.tensor([self.targets[item]]).long().to(DEVICE)
        return (input_, target)
```

在 `pytorch`, 通过继承类 `Dataset`, 并且重写 `__init__`, `__len__` 和 `__getitem__` 来构建自定义数据集.

`__init__`: 通常在构造函数里定义如何获取原始数据集.

`__len__`: 定义数据集的大小计算方式.

`__getitem__`: 定义如何通过索引来获取一个样本.

这里我们使用之前用过的 `load_files` 来加载数据集的路径, 并使用 `pytorch` 提供的图像读取函数 `read_image` 读取样本.

### 搭建一个简单的神经网络

```python
class MyNetwork(nn.Module):
    def __init__(self, intput_size=28, input_channels=1, output_size=10):
        super().__init__()
        self.convpooling = nn.Sequential(
            nn.Conv2d(input_channels, 16, 5),           # 28 - 4 = 24
            nn.ReLU(),
            nn.MaxPool2d(2),                            # 24 // 2 = 14
            nn.Conv2d(16, 64, 3),                       # 14 - 2 = 12
            nn.ReLU(),
            nn.MaxPool2d(2),                            # 12 // 2 = 6
        )
        _size = ((intput_size - 4) // 2 - 2) // 2
        self.fc = nn.Sequential(
            nn.Flatten(),
            nn.Dropout(),
            nn.Linear(64*_size*_size, output_size)      # 64*6*6 -> 10
        )

    def forward(self, inputs):
        outputs = self.convpooling(inputs)
        outputs = self.fc(outputs)
        return outputs
```

通过继承 `Module` 类并重写其中的 `__init__` 和 `forward` 来自定义网络结构与前向传播方式.

`__init__`: 在构造函数里给出自定义网络的所有层次结构. 使用 `Module` 的子类进行定义, 会自动将需要学习的参数注册到整个网络结构上.

`forward`: 定义输入数据如何进行前向传播, 也就是如何使用在构造函数里定义的各个网络层.

这里对于手写数字分类问题, 我们写了一个简单的两层 CNN 网络, 并加上一个全连接层.

网络的输入是 `input_size*input_size` 大小, 通道数为 `input_channels` 的图片, 而输出则是 `output_size` 的一个分类向量, 每个位置代表不同类别的得分.

代码注释里给出了每一层样本大小的变化情况, 每一层之间需要相互对齐才能正确计算.

### 定义评价指标函数

```python
def eval_metrics(y_true, y_pred):
    acc = accuracy_score(y_true, y_pred)
    p = precision_score(y_true, y_pred, average="macro")
    r = recall_score(y_true, y_pred, average="macro")
    f1 = f1_score(y_true, y_pred, average="macro")
    report = classification_report(y_true, y_pred, digits=4)

    return (acc, p, r, f1, report)
```

这里调用了 `scikit-learn` 的一些常用指标计算函数, 包括准确率, 精度, 召回率, F1 得分, 以及一份汇总结果.

输入数据就是真实标签与预测标签.

### 定义训练函数

```python
def train(model, train_data_loader, criterion, optimizer):
    model.train()
    loss_list = []
    pred_list = []
    true_list = []
    for inputs, targets in train_data_loader:
        targets = targets.flatten()
        outputs = model(inputs)
        loss = criterion(outputs, targets)

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        loss_list.append(loss.item())
        pred_list.append(outputs.argmax(dim=-1).cpu().numpy())
        true_list.append(targets.cpu().numpy())

    y_pred = np.concatenate(pred_list)
    y_true = np.concatenate(true_list)

    loss = np.mean(loss_list)
    result = eval_metrics(y_true, y_pred)

    return (loss, *result)
```

训练函数有四个参数.

`model`: 模型, 也就是前面我们自己定义的神经网络实例.

`train_data_loader`: 训练数据集加载器. 是一个 `DataLoader` 实例, 可以进行迭代从里面按批次大小获得训练数据.

`criterion`: 损失函数, 用来计算每次输出与真实标签之间的损失值, 并进行反向传播计算梯度.

{% note info %}
需要注意的是, 对 `targets` 使用了一次 `flatten` 操作.
因为使用 `DataLoader` 对数据集进行加载时, 每次是按照 `batch_size` 来批量获取的, 因此会自动将单个样本进行拼接变成一个 batch. 所以 `targets` 是 `(batch_size, 1)` 的形状.
但是我们要使用的损失函数是 `CrossEntropy` 交叉熵损失函数, 它的输入要求真实标签是一个一维的向量 `(batch_size, )`, 因此使用 `flatten` 对 `targets` 进行展平操作.
{% endnote %}

`optimizer`: 优化器, 在使用之前已经将 `model` 中需要训练的参数注册进去, 每次调用 `step` 方法可以对 `model` 注册的参数通过梯度进行更新.

训练的流程共有以下几步.

1. 将 `model` 转为 `train` 模式.
2. 迭代数据集加载器, 按批次获取每一次要学习的样本.
3. 将样本喂进 `model` 进行前向传播, 并计算损失.
4. 清空优化器中上一次梯度值.
5. 从损失处开始反向传播, 计算本次参数需进行学习的梯度.
6. 调用优化器的 `step`, 根据梯度值完成对网络参数的更新.

后面还有一些额外的统计操作, 用来记录本次训练过程时的平均损失和准确度等情况.

### 定义评估函数

```python
def evaluate(model, eval_data_loader, criterion):
    model.eval()
    loss_list = []
    pred_list = []
    true_list = []
    with torch.no_grad():
        for inputs, targets in eval_data_loader:
            targets = targets.flatten()
            outputs = model(inputs)
            loss = criterion(outputs, targets)

            loss_list.append(loss.item())
            pred_list.append(torch.argmax(outputs, dim=-1).cpu().numpy())
            true_list.append(targets.cpu().numpy())

    y_pred = np.concatenate(pred_list)
    y_true = np.concatenate(true_list)

    loss = np.mean(loss_list)
    result = eval_metrics(y_true, y_pred)

    return (loss, *result)
```

评估函数的过程与训练函数类似, 不同之处在于前者的参数里没有优化器, 因为评估函数用于模型在测试集上进行测试, 不需要反向传播与参数更新的操作.

评估函数的关键是 `torch.no_grad` 操作, 在此上下文内对 `model` 的操作不会计算任何梯度值, 只会进行单纯的前向求值计算操作.

### 定义训练超参数

```python
seed = 1
learning_rate = 1e-3
batch_size = 500
epochs = 5

torch.manual_seed(seed)
torch.cuda.manual_seed(seed)
```

这里我们设置了学习率和训练轮数, 由于只是示例因此轮数只有 5 来展示效果.

将随机数种子列入了超参数并且固定了 `torch` 随机数模块的种子, 目的是为了稳定复现结果.

### 加载数据集

```python
train_dataset = MyDataset("./digit_data/train/")
test_dataset = MyDataset("./digit_data/test/")
train_dataloader = DataLoader(train_dataset, shuffle=True, batch_size=batch_size)
test_dataloader = DataLoader(test_dataset, shuffle=True, batch_size=batch_size)
```

导入了自己的手写数字数据集并使用 `DataLoader` 来进行加载, 可以设置是否打乱与批次大小等加载参数.

### 实例化模型与训练需要的对象

```python
model = MyNetwork().to(DEVICE)
loss_fn = nn.CrossEntropyLoss().to(DEVICE)
optimizer = optim.Adam(model.parameters(), lr=learning_rate)
```

模型使用了默认参数, 数据集图片大小为 `28*28`, 且加上了 `to(DEVICE)`. 在前面构建数据集部分也使用了 `to(DEVICE)` 操作, 其目的是为了保证所有要参与计算的 `Tensor` 都在同一个硬件设备上进行计算.

然后是实例化损失函数与优化器. 在优化器的参数中需要填入 `model` 所有需要更新的网络参数, 并填入学习率.

优化器选择了 `Adam`, 一个几乎万用的优化器.

### 训练模型

```python
print("===============================")
for i in range(epochs):
    print(f"Epoch {i+1}")
    print("-------------------------------")
    *train_metrics, _ = train(model, train_dataloader, loss_fn, optimizer)
    *evaluate_metrics, _ = evaluate(model, test_dataloader, loss_fn)
    print("Train Loss: {:.4f} Acc: {:.4f} F1: {:.4f}({:.4f}/{:.4f})".format(*train_metrics))
    print("Eval  Loss: {:.4f} Acc: {:.4f} F1: {:.4f}({:.4f}/{:.4f})".format(*evaluate_metrics))
    print("===============================")
```

得到如下训练过程输出.

```plain
===============================
Epoch 1
-------------------------------
Train Loss: 11.0961 Acc: 0.4295 F1: 0.4297(0.4272/0.4281)
Eval  Loss: 0.7999 Acc: 0.8052 F1: 0.8232(0.8059/0.8014)
===============================
Epoch 2
-------------------------------
Train Loss: 0.8910 Acc: 0.8009 F1: 0.8002(0.8000/0.7999)
Eval  Loss: 0.3495 Acc: 0.9106 F1: 0.9111(0.9103/0.9103)
===============================
Epoch 3
-------------------------------
Train Loss: 0.4862 Acc: 0.8683 F1: 0.8675(0.8675/0.8674)
Eval  Loss: 0.2554 Acc: 0.9324 F1: 0.9324(0.9322/0.9320)
===============================
Epoch 4
-------------------------------
Train Loss: 0.3536 Acc: 0.9016 F1: 0.9013(0.9008/0.9010)
Eval  Loss: 0.2114 Acc: 0.9396 F1: 0.9393(0.9397/0.9393)
===============================
Epoch 5
-------------------------------
Train Loss: 0.2802 Acc: 0.9173 F1: 0.9170(0.9170/0.9169)
Eval  Loss: 0.1861 Acc: 0.9470 F1: 0.9474(0.9471/0.9469)
===============================
```

训练时每训练一轮同时也在测试集上评估一次, 可以看到两个损失值都是成功下降, 且正确率逐步上升. 有时间的话可以多训练几轮, 看看损失值的变化情况.

### 输出最终的测试结果

```python
*_, report = evaluate(model, test_dataloader, loss_fn)
print(report)
```

输出.

```plain
              precision    recall  f1-score   support

           0     0.9344    0.9913    0.9620       460
           1     0.9653    0.9737    0.9695       571
           2     0.9176    0.9660    0.9412       530
           3     0.9346    0.9720    0.9529       500
           4     0.9459    0.9440    0.9449       500
           5     0.9566    0.9671    0.9618       456
           6     0.9644    0.9372    0.9506       462
           7     0.9467    0.9023    0.9240       512
           8     0.9585    0.8978    0.9271       489
           9     0.9503    0.9192    0.9345       520

    accuracy                         0.9470      5000
   macro avg     0.9474    0.9471    0.9469      5000
weighted avg     0.9474    0.9470    0.9468      5000
```

其实就是再次调用了一下 `evaluate` 函数, 但是输出了 report 结果.

可以看到正确率尚可, 达到了 0.94 多, 多训练几轮说不定会更高. 贴一下训练了 22 轮的结果.

```plain
              precision    recall  f1-score   support

           0     0.9620    0.9913    0.9764       460
           1     0.9758    0.9895    0.9826       571
           2     0.9701    0.9792    0.9746       530
           3     0.9839    0.9760    0.9799       500
           4     0.9739    0.9720    0.9730       500
           5     0.9759    0.9759    0.9759       456
           6     0.9868    0.9697    0.9782       462
           7     0.9631    0.9688    0.9659       512
           8     0.9710    0.9571    0.9640       489
           9     0.9706    0.9519    0.9612       520

    accuracy                         0.9732      5000
   macro avg     0.9733    0.9731    0.9732      5000
weighted avg     0.9733    0.9732    0.9732      5000
```

~~提高了足足 **3 个百分点**! 足以让我们发一篇 CVPR 了!~~ 看得出没有太明显的提升, 一是数据集较小, 二是网络结构比较简单, 不过也足以见到神经网络的强大了.

## 总结

万变不离其宗, 虽然本篇是一个只是一个非常精简的手写数字分类, 但是麻雀虽小五脏俱全, 再大型再复杂的网络结构, 它的基本流程都离不开那几个步骤, 唯一没提到了可能就是面对长时间训练情况下, 怎么 "断点续训" 记录存档点, 这个靠自己摸索了. ~~都是网安的了, 自学什么的早就会了吧.~~

实际中, 很少真的自己手搓网络了, 就算是学习论文里的模型, 也都是尽可能的直接拉开源代码下来跑. 那么学习本篇的主要目的是知道使用 `pytorch` 的最基本的几个步骤, 在看开源代码时, 能够快速找到各个部件都在哪, 理解作者的项目组织方式, 并且必要时可以对源代码做出一定的调整.

## 相关资源

`pytorch` 的官方网站: [https://pytorch.org/](https://pytorch.org/).

这个官方网站挺好的, 不仅文档详细, 同时也提供了很多示例教学, 很适合入门或者详细了解各种接口.

另附上项目中使用的数据集下载地址, [点击下载](https://ww-rm.lanzout.com/iTPkK09pfnha).
