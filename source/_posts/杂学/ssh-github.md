---
title: 一次意外的 Github SSH 连接失败
categories:
  - "杂学"
tags:
    - "SSH"
    - "Github"
date: 2024-01-15 23:17:54
---

记录一次失败的 Github SSH 连接问题排查过程.

```bash
$ ssh -T git@github.com
git@github.com: Permission denied (publickey).
```

<!-- more -->

## 起因

自己 Windows 系统上很早生成了一对 ssh 密钥用于 Github 仓库访问, 然后想在 Ubuntu 的虚拟机里也用同样的密钥去访问 Github, 于是乎直接用 Xftp 连接虚拟机传了上去, 放到 `~/.ssh/` 目录下.

但是 clone 仓库时, 出现了如下报错:

```plain
git clone git@github.com:ww-rm/<repo>.git
正克隆到 '<repo>'...
sign_and_send_pubkey: signing failed for RSA "/home/<username>/.ssh/id_rsa" from agent: agent refused operation
git@github.com: Permission denied (publickey).
fatal: 无法读取远程仓库。

请确认您有正确的访问权限并且仓库存在。
```

## 上下求索

很迷茫, 自己 Windows 上一直都是用的这个密钥, 复制过去咋就不认了?

于是搜索一波, 找到了 Github Docs 的 [Error: Permission denied (publickey)](https://docs.github.com/en/authentication/troubleshooting-ssh/error-permission-denied-publickey) 页面.

按照上面说的, 用命令 `ssh -T git@github.com` 分别在 Windows 上和 Ubuntu 上都测试一遍.

然后 Windows 给了一个愉快的输出:

```plain
Hi ww-rm! You've successfully authenticated, but GitHub does not provide shell access.
```

但是 Ubuntu 还是失败:

```plain
sign_and_send_pubkey: signing failed for RSA "/home/<username>/.ssh/id_rsa" from agent: agent refused operation
git@github.com: Permission denied (publickey).
```

我把目光落在 `agent refused operation` 这个提示上.

一番搜索之后, 得到的结论大部分都是说 key 没有添加, 要使用 `ssh-add` 命令. 于是再次尝试.

```bash
$ ssh-add ~/.ssh/id_rsa
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@         WARNING: UNPROTECTED PRIVATE KEY FILE!          @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
Permissions 0644 for '/home/<username>/.ssh/id_rsa' are too open.
It is required that your private key files are NOT accessible by others.
This private key will be ignored.
```

这下子报错很明白了, 它告诉我们由于私钥权限太开放了, 所以忽略了这个密钥. 用 `ll` 看一眼也能发现文件权限是 `-rw-r--r--`.

## 真相

Xftp 在上传文件的时候, 文件权限自动给了 `644`, 然后 `ssh` 忽略了这种高权限的不安全密钥文件.

所以解决方案就是用 `chmod` 修改私钥的文件权限, 把组权限去掉, 也就是将原本 `644` 的权限改成 `600`.

```bash
chmod 600 ~/.ssh/id_rsa
```

修改完之后再次使用 `ssh -T git@github.com` 在 Ubuntu, 就能成功连接了.
