---
title: 基于 NumPy 的手写数字识别 (卷积神经网络) (三)
categories:
  - "代码块"
tags:
  - "手写数字识别"
  - "卷积神经网络"
  - "pytorch"
  - "深度学习"
date: 2023-10-15 15:59:21
mathjax: true
---

> "基于 numpy 的手写数字识别", 这一经典问题除了用作深度学习入门内容, 还被广泛作为各大课程的课程作业, 因此在各大搜索引擎上搜索率也是相当之高~~(代码复用率也是相当之高)~~. 网上确实有挺多现成的可使用代码, 但是大部分都是造的全连接网络, 并且很多时候内部原理不是特别清晰. 因此决定自己也来造一次轮子, 使用 `numpy` 实现一个简单的卷积神经网络进行手写数字识别, 正好也能借此机会梳理一下神经网络的基本原理.
>
> 全文包含完整的卷积网络实现, 以及矩阵梯度和卷积矩阵化的推导过程, 由于全文过长, 因此分成了三部分, 内容上是完全连着的.

本文为第三篇, 也是最后一篇, 结合前两篇的内容搭建完整的卷积神经网络并完成训练和评估.

<!-- more -->

本系列文章传送门:

- [基于 NumPy 的手写数字识别 (卷积神经网络) (一)][1]
- [基于 NumPy 的手写数字识别 (卷积神经网络) (二)][2]
- [基于 NumPy 的手写数字识别 (卷积神经网络) (三)][3]

## 卷积神经网络

### 模型结构

因为只是一个简单的示例, 所以弄一个小一点的网络, 大概长这样.

![cnn.jpg](https://ww-rm.github.io/static/image/cnn-numpy-3/cnn.jpg)

然后就是按照这个结构用代码把前面实现的层串起来.

```python
class ConvolutionNeuralNetwork:
    """
    Conv -> Pool -> ReLU -> Conv -> Pool -> ReLU -> Flatten -> Linear -> CrossEntropy
    """

    def __init__(self) -> None:
        self.layers = [
            ConvolutionLayer(1, 4, 5, 5),  # 24 * 24
            MaxPoolingLayer(2, 2),  # 12 * 12
            ReLULayer(),
            ConvolutionLayer(4, 16, 3, 3),  # 10 * 10
            MaxPoolingLayer(2, 2),  # 5 * 5
            ReLULayer(),
            FlattenLayer(),
            LinearLayer(16 * 5 * 5, 10)
        ]
        self.loss_func = CrossEntropyLoss()
        self.layer_inputs = []

    def forward(self, x: np.ndarray, keepgrad: bool = False) -> np.ndarray:
        """
        Args:
            x: (B, C_ch, H, W), images
            keepgrad: whether keep temp layer inputs

        Returns:
            x: (B, C_cls), logits
        """

        for layer in self.layers:
            if keepgrad:
                self.layer_inputs.append(x)
            x = layer.forward(x)
        return x

    def backward(self, last_x_grad: np.ndarray) -> np.ndarray:
        """
        Args:
            last_x_grad: (B, C_cls), computed by loss function

        Returns:
            last_x_grad: (B, C_ch, H, W)
        """

        for x, layer in zip(self.layer_inputs[::-1], self.layers[::-1]):
            last_x_grad = layer.backward(x, last_x_grad)
        return last_x_grad

    def update(self, lr: float) -> None:
        for layer in self.layers:
            if isinstance(layer, ParamLayer):
                layer.update(lr)
```

这里网络同样需要实现 `forward` 和 `backward` 方法, 但是增加了 `layer_inputs` 成员, 用于保存网络的计算图中间节点, 在反向传播时能直接读取数据计算.

至于网络每层的参数填多大, 得视数据量和网络深度决定~~玄学问题~~, 这里就填了几个比较小的值, 方便下一步训练.

### 训练

然后实现网络的训练代码.

训练分几个固定步骤:

1. 前向传播
2. 计算损失
3. 反向传播
4. 更新参数
5. 清空本次计算的中间值和梯度

```python
class ConvolutionNeuralNetwork:
    """
    Conv -> Pool -> ReLU -> Conv -> Pool -> ReLU -> Flatten -> Linear -> CrossEntropy
    """

    def __init__(self) -> None: ...
    def forward(self, x: np.ndarray, keepgrad: bool = False) -> np.ndarray: ...
    def backward(self, last_x_grad: np.ndarray) -> np.ndarray: ...
    def update(self, lr: float) -> None: ...

    def train(self, train_x: np.ndarray, train_y: np.ndarray, batch_size: int, epochs: int, lr: float) -> float:
        """

        Returns:
            loss: mean loss for train_x
        """
        losses = []
        for i in range(0, train_x.shape[0], batch_size):
            inputs, targets = train_x[i:i+batch_size], train_y[i:i+batch_size]

            # forward
            logits = self.forward(inputs, True)
            loss = self.loss_func.forward(logits, targets)
            losses.append(loss)

            # backward
            last_x_grad = self.loss_func.backward(logits, targets)
            self.backward(last_x_grad)

            # update
            self.update(lr)

            # clear temp values
            self.layer_inputs.clear()

        return sum(losses) / len(losses)
```

### 测试和预测

测试和训练步骤是类似的, 但是不需要计算损失和梯度, 同时也不需要保留中间计算结果.

而预测则是在 `forward` 的基础上, 将输出结果使用 `Softmax` 函数转换成概率值, 公式如下:

$$
\begin{aligned}
  Softmax(x_{ij}) &= \frac{\exp\left( {x_{ij}} \right)}{\sum_{j=1}^{C}{\exp\left(x_{ij}\right)}} \\\\
  ~ &= \frac{\exp\left( {x_{ij} - \max_{j=1}^{C}{x_{ij}}} \right)}{\sum_{j=1}^{C}{\exp\left(x_{ij} - \max_{j=1}^{C}{x_{ij}}\right)}} \\\\
  ~ &= \frac{\exp\left( {x_{ij}'} \right)}{\sum_{j=1}^{C}{\exp\left(x_{ij}'\right)}}
\end{aligned}
$$

其实就是在计算交叉熵损失中间 $\log$ 括号内的内容, 并且同样可以减去最大值来防止数据溢出.

```python
class ConvolutionNeuralNetwork:
    """
    Conv -> Pool -> ReLU -> Conv -> Pool -> ReLU -> Flatten -> Linear -> CrossEntropy
    """

    def __init__(self) -> None: ...
    def forward(self, x: np.ndarray, keepgrad: bool = False) -> np.ndarray: ...
    def backward(self, last_x_grad: np.ndarray) -> np.ndarray: ...
    def update(self, lr: float) -> None: ...
    def train(self, train_x: np.ndarray, train_y: np.ndarray, batch_size: int, epochs: int, lr: float) -> float: ...

    def test(self, test_x: np.ndarray, test_y: np.ndarray, batch_size: int) -> float:
        """
        Returns:
            loss: mean loss for test_x
        """

        losses = []
        for i in range(0, test_x.shape[0], batch_size):
            inputs, targets = test_x[i:i+batch_size], test_y[i:i+batch_size]

            # forward
            logits = self.forward(inputs)
            loss = self.loss_func.forward(logits, targets)
            losses.append(loss)

        return sum(losses) / len(losses)

    def predict(self, x: np.ndarray) -> np.ndarray:
        """
        Args:
            x: (B, C_ch, H, W), images

        Returns:
            x: (B, C_cls), probs by softmax
        """

        x = self.forward(x)
        exp_x = np.exp(x - x.max(-1, keepdims=True))
        outputs = exp_x / exp_x.sum(-1, keepdims=True)
        return outputs
```

## 训练并评估网络

完成网络搭建后, 接下来就是进行训练和评估. 先贴上完整的代码.

```python
if __name__ == "__main__":
    np.random.seed(1234)

    train_x, train_y = load_dataset("./cv-data/train", True)
    test_x, test_y = load_dataset("./cv-data/test")

    print(train_x.shape, train_y.shape)
    print(test_x.shape, test_y.shape)

    batch_size = 100
    epochs = 200
    lr = 0.1
    cnn = ConvolutionNeuralNetwork()

    train_losses = []
    test_losses = []
    print("=============== Begin Train ===============")
    start_time = time.time()
    for i in range(epochs):
        train_loss = cnn.train(train_x, train_y, batch_size, epochs, lr)
        test_loss = cnn.test(test_x, test_y, batch_size)
        print(f"Epoch: {i + 1:3d} Train Loss: {train_loss:.4f} Test Loss: {test_loss:.4f}")

        train_losses.append(train_loss)
        test_losses.append(test_loss)

    time_elapsed = time.time() - start_time
    print(f"=============== End Train: {time_elapsed / 60:.2f} min ===============")

    train_losses = np.array(train_losses)
    test_losses = np.array(test_losses)

    # 绘制损失变化曲线, 忽略第一轮损失
    plt.plot(np.arange(train_losses.shape[0]-1), train_losses[1:], label="train")
    plt.plot(np.arange(test_losses.shape[0]-1), test_losses[1:], label="test")
    plt.legend()
    plt.savefig("loss.png")

    y_true = train_y
    y_pred = cnn.predict(train_x).argmax(-1)
    report = classification_report(y_true, y_pred, digits=4)
    print("=============== Classification Report: Train ===============")
    print(report)

    y_true = test_y
    y_pred = cnn.predict(test_x).argmax(-1)
    report = classification_report(y_true, y_pred, digits=4)
    print("=============== Classification Report: Test ===============")
    print(report)
```

这里为了稳定结果, 固定了一下随机种子为 `1234`.

有三个训练的超参数:

- `batch_size`: 每一轮 mini-batch 的大小.
- `epochs`: 共训练多少轮.
- `lr`: 网络学习率.

具体填多少得反复尝试~~也是炼丹的精髓~~, 这里学习率是尝试后收敛比较快而且比较稳定的一个值.

中途把每一轮的损失记录一下, 并且用 `matplotlib.pyplot` 画个简单的曲线图, 对比一下训练集和测试集损失随轮数的变化关系.

最后借用一下 `classification_report` 来看看网络在训练集和测试集上的分类性能报告.

200 轮的训练大概跑了 20 分钟左右, 挺久的.

损失曲线图:

![loss.jpg](https://ww-rm.github.io/static/image/cnn-numpy-3/loss.png)

分类性能报告:

```plain
=============== Classification Report: Train ===============
              precision    recall  f1-score   support

           0     0.9970    0.9900    0.9935       999
           1     0.9955    0.9928    0.9941      1106
           2     0.9871    0.9765    0.9818      1020
           3     0.9814    0.9786    0.9800      1027
           4     0.9958    0.9712    0.9834       973
           5     0.9821    0.9854    0.9838       891
           6     0.9959    0.9939    0.9949       977
           7     0.9750    0.9887    0.9818      1063
           8     0.9567    0.9888    0.9725       984
           9     0.9781    0.9771    0.9776       960

    accuracy                         0.9844     10000
   macro avg     0.9845    0.9843    0.9843     10000
weighted avg     0.9845    0.9844    0.9844     10000

=============== Classification Report: Test ===============
              precision    recall  f1-score   support

           0     0.9517    0.9848    0.9679       460
           1     0.9723    0.9825    0.9774       571
           2     0.9618    0.9491    0.9554       530
           3     0.9298    0.9540    0.9418       500
           4     0.9630    0.9360    0.9493       500
           5     0.9538    0.9518    0.9528       456
           6     0.9581    0.9416    0.9498       462
           7     0.9384    0.9219    0.9300       512
           8     0.9039    0.9427    0.9229       489
           9     0.9324    0.9019    0.9169       520

    accuracy                         0.9466      5000
   macro avg     0.9465    0.9466    0.9464      5000
weighted avg     0.9468    0.9466    0.9466      5000
```

效果还不错, 损失曲线也很经典, 大约从 15 轮开始收敛, 120 轮左右测试集损失就差不多到底了. 中途试过一些别的随机种子, 收敛速度有差异, 但是最终的损失值都差不多.

分类性能的话, 训练集的 F1 值和测试集差了 4% 左右, 看着也还不错, 正常表现.

## 进一步探索

到这里我们就已经彻底完成了基于纯 NumPy 手工搭建的卷积神经网络了, 从这个过程中我们可以了解到很多底层原理以及一些细节问题, 比如参数的初始化和训练超参数的调节. 大部分时间我们都是使用深度学习框架来完成这些事情, 我们只需要专注于搭积木即可. 这里联系一下我常用的 PyTorch 库, 里面内置了很多不同的模块, 分别对应整个网络搭建和训练过程中的基本环节.

- `torch.utils.data`: 数据处理模块, 控制数据的读取和迭代方式.
- `torch.nn`: 常用的网络模块, 例如 `Linear` 和 `Conv2d`.
- `torch.nn.functional`: `torch.nn` 中模块的函数形式, 需要手动传入计算的参数.
- `torch.nn.init`: 不同的网络参数初始化方法.
- `torch.optim`: 优化器模块, 包含不同的学习率调整算法, 控制网络的优化过程.

这是一些常用的, 还有很多, 可以去看看 [PyTorch 文档](https://pytorch.org/docs/stable/index.html)并加以实践.

## 后记

这份文档写了很久, 起因是觉得要是下次再碰到相关的问题, 自己有轮子和内容就不用上网找了~~属实是闲着没事~~. 前后花了一两周的时间, 因为要从头跑一份代码, 然后又是调公式又是画图, 不过算是彻底复习了一遍神经网络, 把很多深度学习框架的使用原理都串起来了, 还是挺好的.

这个系列就此圆满结束~~作业报告从此一劳永逸~~.

[1]: /posts/2023/10/13/cnn-numpy-1/
[2]: /posts/2023/10/14/cnn-numpy-2/
[3]: /posts/2023/10/15/cnn-numpy-3/
