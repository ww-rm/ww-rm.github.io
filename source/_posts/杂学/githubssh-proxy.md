---
title: Github SSH 连接设置代理
categories:
  - "杂学"
tags:
    - "SSH"
    - "Github"
date: 2025-11-01 17:42:26
---

解决 Github SSH 连接过慢的问题, 给 SSH 连接也挂上代理.

<!-- more -->

继之前解决过 [解决 Github SSH 连接超时](/posts/2024/01/17/githubssh-timeout/) 超时问题之后, 最近实在是受不了龟速的 ssh 连接, 所以折腾了一下怎么给 ssh 也挂上代理.

经过搜索和 GPT, 下面直接给解决方案.

首先 windows 上安装的 git 软件自带一个工具 `connect.exe`, 通常位于安装目录下面, 例如 `C:\Program Files\Git\mingw64\bin\connect.exe`, 查看用法如下:

```bash
$ connect
connect --- simple relaying command via proxy.
Version 1.105
usage: C:\Program Files\Git\mingw64\bin\connect.exe [-dnhst45] [-p local-port]
          [-H proxy-server[:port]] [-S [user@]socks-server[:port]]
          [-T proxy-server[:port]]
          [-c telnet-proxy-command]
          host port
```

然后在 `.ssh/config` 里增加配置如下:

```bash
Host github.com
  # ...此处省略其他配置项...

  # 增加 ProxyCommand 配置
  ProxyCommand "C:\Program Files\Git\mingw64\bin\connect.exe" -H 127.0.0.1:10809 %h %p
```

使用 `-H` 参数指定本地的 http 代理, 然后使用 ssh 内置的 `%h` 和 `%p` 变量传入实际连接时的主机和端口.

如果是 socks 代理则使用 `-S` 参数, 其他的看着给吧.
