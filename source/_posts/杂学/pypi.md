---
title: 如何在 PyPI 上发布一个包
categories:
  - "杂学"
tags:
  - "python"
  - "pypi"
  - "setuptools"
  - "python 包发布"
date: 2023-11-05 17:43:40
---

基于上一篇[NCM 文件批量转换 (保留专辑和封面信息)](/posts/2023/11/04/ncmdump/), 记录一下自己第一次往 PyPI 上发布包的过程.

本文结合 Python 官方教程 [Packaging Python Projects](https://packaging.python.org/en/latest/tutorials/packaging-projects/) 和 [Setuptools](https://setuptools.pypa.io/en/latest/index.html) 的 [User guide](https://setuptools.pypa.io/en/latest/userguide/) 进行打包和发布.

<!-- more -->

## 项目结构

```plain
ncmdump-py
  ├─ ncmdump
  │   ├─ core.py
  │   ├─ crypto.py
  │   ├─ __init__.py
  │   └─ __main__.py
  ├─ .gitignore
  ├─ LICENSE
  ├─ pyproject.toml
  └─ README.md
```

这是本项目的目录结构, 其中 `ncmdump-py` 是项目根目录, 而 `ncmdump` 是我们要发布的包, 其他文件是一些项目文件.

这种结构被称为 [flat-layout](https://setuptools.pypa.io/en/latest/userguide/package_discovery.html#flat-layout) 布局, 也就是直接将要构建的包放在项目的根目录下.

除此之外还有 [src-layout](https://setuptools.pypa.io/en/latest/userguide/package_discovery.html#src-layout) 和用于单模块构建的 [single-module-distribution](https://setuptools.pypa.io/en/latest/userguide/package_discovery.html#single-module-distribution). 此外 `Setuptools` 还支持各种详细的自定义功能, 具体可以看 [Package Discovery and Namespace Packages](https://setuptools.pypa.io/en/latest/userguide/package_discovery.html) 页面.

## 安装必要的工具库

使用 `pip install build` 安装 `build` 库. 这是一个命令行工具, 能够自动下载 `setuptools` 和其他构建时的必要依赖, 之后通过 `python -m build` 即可完成项目构建.

另一个工具是 `twine`, 使用 `pip install twine` 安装, 该工具用来将我们构建后的文件上传至 PyPI 中.

## 编写项目配置文件

`setuptools` 支持三种方式编写项目配置文件, 在项目根目录下创建 `pyproject.toml`, `setup.cfg` 或者 `setup.py`.

这里我们使用推荐的 `pyproject.toml` 方式, 并且尽量避免使用 `setup.py` ([Why you shouldn’t invoke setup.py directly](https://blog.ganssle.io/articles/2021/10/setup-py-deprecated.html)).

下面贴出本项目的 `pyproject.toml`, 并对其进行解释.

```toml
[build-system]
requires = ["setuptools"]
build-backend = "setuptools.build_meta"

[project]
name = "ncmdump-py"
authors = [
    {name = "ww-rm", email = "ww-rm@qq.com"},
]
description = "Dump ncm files to mp3 or flac files."
requires-python = ">=3.7"
dependencies = [
    "mutagen",
    "Pillow",
    "pycryptodome",
    "rich",
]
dynamic = ["version", "readme"]

[project.urls]
"Homepage" = "https://github.com/ww-rm/ncmdump-py"
"Bug Tracker" = "https://github.com/ww-rm/ncmdump-py/issues"

[tool.setuptools]
packages = ["ncmdump"]

[tool.setuptools.dynamic]
version = {attr = "ncmdump.__version__"}
readme = {file = ["README.md"], content-type = "text/markdown"}
```

首先是 `build-system`, 必填项, 该键下面定义了使用什么方式进行构建, 这里使用 `setuptools`, 一般不需要更改.

接着下面的是 `project` 键, 这下面有很多关于项目的配置, 并且和 PyPI 项目页面上有对应关系, 这里挑一些关键的来解释.

`name` 是包的名字, 指的是用 `pip` 安装时指定的名字, 在代码导入的时候还是和包本身文件夹名字相同. 比如这个项目, 安装的命令是 `pip install ncmdump-py`, 但是代码导入的时候是 `import ncmdump`.

`dependencies` 定义了项目的依赖库, 语法和 `requirements.txt` 一样, 列表里每一项都是一个依赖, 详细语法可以参考 [Dependencies Management in Setuptools](https://setuptools.pypa.io/en/latest/userguide/dependency_management.html).

`dynamic` 定义了一些变量, 常见的就是定义版本号和项目文档, 毕竟手动填写繁琐且容易出错. 它需要与后面 `tool.setuptools.dynamic` 进行对应. 详细语法可以参考 [Dynamic Metadata](https://setuptools.pypa.io/en/latest/userguide/pyproject_config.html#dynamic-metadata) 页面内容.

更多与 `pyproject.toml` 有关的内容可以参考 [Configuring setuptools using pyproject.toml files](https://setuptools.pypa.io/en/latest/userguide/pyproject_config.html), 以及 Python 官方 [Declaring project metadata](https://packaging.python.org/en/latest/specifications/declaring-project-metadata/) 页面规定的项目配置项.

## 打包

首先确保已经安装了前文说的 `build` 库, 以及准备了一个合适的版本号和 `LICENSE` 文件, 可以参考 [Semantic Versioning](https://semver.org/) 与 [Choose an open source license](https://choosealicense.com/) 让自己的项目看起来更规范一点.

然后就是傻瓜式构建, 在当前根目录下运行:

`python -m build`

然后就会生成一个 `dist` 文件夹, 里面包含打包好的项目文件.

```plain
ncmdump-py
  └─ dist
      ├─ ncmdump_py-1.0.1-py3-none-any.whl
      └─ ncmdump-py-1.0.1.tar.gz
```

## 发布

首先确保已经安装了前文说的 `twine` 库, 然后需要去 [TestPyPI](https://test.pypi.org/) 和 [PyPI](https://pypi.org/) 分别注册自己的账号.

其中 `TestPyPI` 是用来测试的, 而 `PyPI` 是真实发布页, 建议第一次尝试还是用 `TestPyPI` 先测试熟悉一下流程, 避免出错无法修改. 下面的内容将分别说明在 `TestPyPI` 和 `PyPI` 上的命令差异.

这里先说说遇到的小问题, 在写本文时, `TestPyPI` 和 `PyPI` 在注册账号后, 已经强制要求开启双因素认证 (2FA), 但是开启了双因素认证的账号不能使用账密的形式上传文件, 因此成功注册账号后, 我们还需要去申请一个通用的 API token.

在 `Account settings` 中往下翻, 可以找到 `API tokens` 设置项, 我们选择 `Add API token`, 并且将 `Scope` 选择为 `Entire account (all projects)` (第一次发布肯定只能选成全局的).

添加完成之后, 我们需要及时的**将 token 复制并保存**下来, 之后再进来就**不会显示** token 了.

然后使用 `twine` 进行上传.

{% tabs upload-by-twine %}
<!-- tab TestPyPI -->
`python -m twine upload --repository testpypi dist/*`
<!-- endtab -->

<!-- tab PyPI -->
`python -m twine upload dist/*`
<!-- endtab -->
{% endtabs %}

运行之后, 会要求你输入 `username` 和 `password`. 在使用 token 的情况下, `username` 填 `__token__`, 而 `password` 填刚刚复制并保存下来的 token 字符串.

成功上传之后, 会显示上传后的页面链接.

然后可以通过 `pip` 测试一下是否可以正常安装:

{% tabs install-by-pip %}
<!-- tab TestPyPI -->
`pip install -i https://test.pypi.org/simple/ ncmdump-py`
<!-- endtab -->

<!-- tab PyPI -->
`pip install ncmdump-py`
<!-- endtab -->
{% endtabs %}

最后的最后, 如果不想每次都输入用户名和密码, 我们可以写一份 `~/.pypirc` 配置文件.

```plain
[testpypi]
username = __token__
password = <token value>

[pypi]
username = __token__
password = <token value>
```

Windows 下把文件放在用户主目录 `%USERPROFILE%` (`C:\Users\<UserName>`) 下即可, 之后每次运行 `twine upload` 就会自动读取 token 完成上传.

## 参考资料

1. [Packaging Python Projects](https://packaging.python.org/en/latest/tutorials/packaging-projects/)
2. [Setuptools](https://setuptools.pypa.io/en/latest/index.html)
3. [Semantic Versioning](https://semver.org/)
4. [Choose an open source license](https://choosealicense.com/)
