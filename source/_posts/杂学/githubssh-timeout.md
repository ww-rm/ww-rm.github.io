---
title: 解决 Github SSH 连接超时
categories:
  - "杂学"
tags:
    - "SSH"
    - "Github"
date: 2024-01-17 11:55:32
---

解决 Github SSH 连接超时.

```bash
$ ssh -T git@github.com
ssh: connect to host github.com port 22: Connection timed out
```

<!-- more -->

众所周知 Github 的网页端访问极其不稳定, 用 http 协议 clone 仓库的时候非常难受, 但是用公钥走 ssh 协议进行连接体感稳定很多.

但是最近 ssh 也不行了, 稳定连接超时, 本地一堆仓库都没办法进行推送.

网上搜了一大圈, 发现都是加 ssh 配置, 增加下面的内容:

```ssh_config
Host github.com
  Hostname ssh.github.com
  Port 443
```

意思是原先的 22 端口被墙了, 换个 443 的端口就好了.

这么试了之后确实好了, 但是总感觉哪里不对劲, 因为我的印象里, 在指定 `Hostname` 的情况下, `Host` 的作用是别名.

也就是说这个配置项的作用其实是将所有连接到 `github.com` 的换到了 `ssh.github.com`.

然后我把 `Port 443` 给注释了, 结果发现也能跑通, 这说明和端口压根没啥关系, 纯粹是域名的问题.

分别 ping 一下两个域名, 可以发现 `github.com` 完全不通, 但是 `ssh.github.com` 是通的.

```bash
$ ping github.com

正在 Ping github.com [20.205.243.166] 具有 32 字节的数据:
请求超时。
请求超时。
请求超时。
请求超时。

20.205.243.166 的 Ping 统计信息:
    数据包: 已发送 = 4，已接收 = 0，丢失 = 4 (100% 丢失)，

$ ping ssh.github.com

正在 Ping ssh.github.com [20.205.243.160] 具有 32 字节的数据:
来自 20.205.243.160 的回复: 字节=32 时间=95ms TTL=98
来自 20.205.243.160 的回复: 字节=32 时间=98ms TTL=98
来自 20.205.243.160 的回复: 字节=32 时间=111ms TTL=98
来自 20.205.243.160 的回复: 字节=32 时间=98ms TTL=98

20.205.243.160 的 Ping 统计信息:
    数据包: 已发送 = 4，已接收 = 4，丢失 = 0 (0% 丢失)，
往返行程的估计时间(以毫秒为单位):
    最短 = 95ms，最长 = 111ms，平均 = 100ms
```

至此, 可以确定就是最近解析的主域名 `github.com` 的 IP 被彻底墙了, 但是供 ssh 连接的子域名 `ssh.github.com` IP 还活着.

因此, 目前的解决方案就是对于已有的仓库, 添加下面的配置:

```ssh_config
Host github.com
  Hostname 20.205.243.160
```

将现有的 `github.com` 主机名换一个可以用的 IP.

另外, 找到了 Github 官方的文档 [Using SSH over the HTTPS port](https://docs.github.com/en/authentication/troubleshooting-ssh/using-ssh-over-the-https-port).

这里面教你如何在 22 端口不可用时, 转用 443 端口, 但是 443 端必须使用 `ssh.github.com`. 这也是网上大部分教程的出处. 但是由于这个问题不是端口导致的, 因此方法有效只是巧合罢了.

最后, Github 官方提供了它们的服务 IP 范围, [About GitHub's IP addresses](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-githubs-ip-addresses), 从里面可以找一个 ssh 连接成功, 然后写到配置里.
