---
title: 使用 transformers.Pipeline 迭代生成数据
categories:
  - "码记"
tags:
  - "transformers"
  - "Pipeline"
  - "Python"
date: 2024-05-07 14:55:08
---

最近需要用 [`transformers`](https://huggingface.co/docs/transformers/index) 这个库载入大模型进行特征提取, 但是受限于硬件条件, 不能将所有输入推理后的结果放在内存里, 只能退而求其次分批推理然后写入本地. 于是顺势探索了一下 [Pipelines](https://huggingface.co/docs/transformers/main_classes/pipelines) 的用法.

<!-- more -->

## 基本用法

基本用法参考官方文档 [Pipelines for inference](https://huggingface.co/docs/transformers/pipeline_tutorial).

比如通过下面的方式加载一个 [`FeatureExtractionPipeline`](https://huggingface.co/docs/transformers/main_classes/pipelines#transformers.FeatureExtractionPipeline).

```python
fe_pipline = pipeline(
    "feature-extraction",
    model=AutoModelForTextEncoding.from_pretrained(self.encoder_dir),  # BERT 模型
    tokenizer=AutoTokenizer.from_pretrained(self.encoder_dir),
    device=self.device
)
```

然后这样子进行推理.

```python
inputs = [ "A B C D E", "F G H J K" ]  # 两条输入
outputs = fe_pipline(inputs, batch_size=self.batch_size, return_tensors=False)  # (2, L, E)
```

这种方式可以一次性得到 `inputs` 的所有推理结果.

## 分批输入

官方提供了一个分批输入的示例, [Pipeline batching](https://huggingface.co/docs/transformers/main_classes/pipelines#pipeline-batching).

> ```python
> from transformers import pipeline
> from transformers.pipelines.pt_utils import KeyDataset
> import datasets
> 
> dataset = datasets.load_dataset("imdb", name="plain_text", split="unsupervised")
> pipe = pipeline("text-classification", device=0)
> for out in pipe(KeyDataset(dataset, "text"), batch_size=8, truncation="only_first"):
>     print(out)
>     # [{'label': 'POSITIVE', 'score': 0.9998743534088135}]
>     # Exactly the same output as before, but the content are passed
>     # as batches to the model
> ```

这个示例里指定了每次处理的批大小为 `8`, 同时返回了可迭代结果, 可以按照每次一条的方式获得输出结果.

不过在实际测试的时候发现, 当我给定 `list` 类型的 `inputs` 时, 推理的时候确实是分批推理的, 但是最后返回结果的时候, 其实是把所有结果合在一起返回了一个大的 `list`.

这和我的需求还是有一丢丢差距的, 我希望的是每次推理一个批次之后, 只返回一个批次的结果, 然后继续迭代下一个批次, 这样占用的内存大小最多不超过一个批次.

## 迭代输出

继续找一下文档, 还能发现一些示例 [The pipeline abstraction](https://huggingface.co/docs/transformers/main_classes/pipelines#transformers.pipeline).

其中提到了:

> For ease of use, a generator is also possible:
>
> ```python
> from transformers import pipeline
> 
> pipe = pipeline("text-classification")
> 
> 
> def data():
>     while True:
>         # This could come from a dataset, a database, a queue or HTTP request
>         # in a server
>         # Caveat: because this is iterative, you cannot use `num_workers > 1` variable
>         # to use multiple threads to preprocess data. You can still have 1 thread that
>         # does the preprocessing while the main runs the big inference
>         yield "This is a test"
> 
> 
> for out in pipe(data()):
>     print(out)
>     # {"text": "NUMBER TEN FRESH NELLY IS WAITING ON YOU GOOD NIGHT HUSBAND"}
>     # {"text": ....}
>     # ....
> ```

也就是说 `Pipeline` 还支持未知长度的生成器输入, 在这种情况下, 对 `pipeline` 的调用没有返回全部结果, 而是一个迭代器, 每次能获取其中一条结果.

## 源码分析

不过还是不太放心, 官方文档只有一些示例, 对接口参数和返回值的描述并不是很清晰, 所以干脆 F12 看看内部源码.

`transformers` 版本为 `4.31.0`.

关键函数为 `transformers.pipelines.base.Pipeline.__call__`. 这里摘出来相关的代码片段

> ```python
> @add_end_docstrings(PIPELINE_INIT_ARGS)
> class Pipeline(_ScikitCompat):
>
>     ...
>
>     def __call__(self, inputs, *args, num_workers=None, batch_size=None, **kwargs):
>
>         ...
> 
>         is_dataset = Dataset is not None and isinstance(inputs, Dataset)
>         is_generator = isinstance(inputs, types.GeneratorType)
>         is_list = isinstance(inputs, list)
> 
>         is_iterable = is_dataset or is_generator or is_list
> 
>         # TODO make the get_iterator work also for `tf` (and `flax`).
>         can_use_iterator = self.framework == "pt" and (is_dataset or is_generator or is_list)
> 
>         if is_list:
>             if can_use_iterator:
>                 final_iterator = self.get_iterator(
>                     inputs, num_workers, batch_size, preprocess_params, forward_params, postprocess_params
>                 )
>                 outputs = list(final_iterator)
>                 return outputs
>             else:
>                 return self.run_multi(inputs, preprocess_params, forward_params, postprocess_params)
>         elif can_use_iterator:
>             return self.get_iterator(
>                 inputs, num_workers, batch_size, preprocess_params, forward_params, postprocess_params
>             )
>         elif is_iterable:
>             return self.iterate(inputs, preprocess_params, forward_params, postprocess_params)
>         elif self.framework == "pt" and isinstance(self, ChunkPipeline):
>             return next(
>                 iter(
>                     self.get_iterator(
>                         [inputs], num_workers, batch_size, preprocess_params, forward_params, postprocess_params
>                     )
>                 )
>             )
>         else:
>             return self.run_single(inputs, preprocess_params, forward_params, postprocess_params)
> ```

可以看到对输入 `inputs` 的进行了类型判断, 然后返回值的类型则根据 `inputs` 的类型由最后的 `if ... else ...` 决定.

在使用框架是 `pytorch` 的情况下, 这里大致分成两大类情况:

- 输入是 `list` 类型, 那么返回值一定被处理成和输入数据长度一样的 `list` 进行返回.
- 输入是可迭代的 (`is_iterable`), 那么返回一个迭代器.

`get_iterator` 会返回一个 `PipelineIterator` 对象, 在指定了 `batch_size` 的情况下, 内部会保存一个结果缓冲区, 当缓冲区非空则迭代输出下一个结果, 直到缓冲区空, 则进行下一批的推理, 并更新缓冲区.

这个设计倒是完美符合了我的需求, 但是实际使用的时候还是踩了坑.

原本以为把输入换成 `iter(inputs)` 就可以按迭代方式输出了, 但是却报错了, 仔细看看源码才发现, 这里其中一个判断是 `isinstance(inputs, types.GeneratorType)`, 也就是判断输入是否是生成器. 而在 Python 里, `Generator` 是 `Iterator` 的子类, 因此二者都是可迭代的 (`Iterable`), 但是输入是 `Iterator` 的时候, 此处的逻辑却无法将它判断成可迭代的对象.

又翻了一下源码, 看上去只需要判断是迭代器就行了, 并没有用到生成器的特性, 因此严重怀疑这里是不是写代码的人没注意这个问题搞错了......

不过问题不大, Python 提供了很优雅的生成器表达式语法糖, 不用写繁琐的生成器函数, 只需要 `(v for v in inputs)` 就能把可迭代对象包装成生成器, 之后就能愉快的使用它的缓冲区输出功能了~

## 后记

当然也有别的曲线救国方案, 从它的逻辑上看, 只要不是 `list` 并且 `can_use_iterator` 就可以得到输出迭代器, 那么还可以把输出包装成 `torch.utils.data.Dataset`, 不过这个显然没有使用生成器表达式方便.
