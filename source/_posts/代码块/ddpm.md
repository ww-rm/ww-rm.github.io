---
title: 从零开始的 DDPM 动漫头像生成
categories:
  - "代码块"
tags:
  - "DDPM"
  - "动漫头像生成"
  - "概率扩散模型"
date: 2024-02-16 13:18:17
---

Stable Diffusion 已经火了很久了, 在此之前也是在自己电脑上部署过 Github 上那个 [stable-diffusion-webui](https://github.com/AUTOMATIC1111/stable-diffusion-webui). 作为一个折腾分子, 本着更深入了解一下概率扩散模型的想法, 决定在参考其他教程的基础上从零开始炼制一个基于 DDPM 的动漫头像生成模型.

<!-- more -->

## 基础设施

没钱没精力折腾服务器, 用的自己的笔记本.

- Win11
- CPU `i7-13700H`
- 内存 16 GB
- 显卡 `NVIDIA GeForce RTX 4060 Laptop GPU`, 8 GB 显存.
- 显卡驱动版本 `551.23`
- CUDA 版本 `12.4`
- python `3.9.13`
- torch `2.0.1+cu118`

## 数据集

有两个数据集, 都是从 [Kaggle](https://www.kaggle.com/) 上下的.

- [Anime Faces](https://www.kaggle.com/datasets/soumikrakshit/anime-faces), 21551 张.
- [Anime Face Dataset](https://www.kaggle.com/datasets/splcher/animefacedataset), 63632 张.

合起来有 8 万多张 (前一个貌似是第二个的子集?).

但是最后只用了 2 万张那个, 因为 6 万的质量不是太高, 训练出来不是很稳定.

## 依赖库

主要用的原生 PyTorch, 训练和测试都是手写的, 其他库只是辅助输出和使用.

```python
import math
import time
from argparse import ArgumentParser
from pathlib import Path
from typing import List, Optional, Sequence

import rich.progress
import torch
from PIL import Image
from torch import nn
from torch.nn import functional as F
from torch.optim.adam import Adam
from torch.utils.data.dataloader import DataLoader
from torch.utils.data.dataset import Dataset
from torchvision import transforms as T
from torchvision.utils import make_grid
```

## 模型结构

这部分内容主要参考 [annotated_deep_learning_paper_implementations][annotated_repo] 这个仓库, 一个开源的复现各种论文模型的库, 但是参考的时候发现还是有很多问题, 所以仅供参考.

另外一个库则是 [denoising-diffusion-pytorch][ddpm_pytorch], 是原论文的 PyTorch 实现, 但是和原论文的实现细节有很大不同, 所以也仅仅用于参考.

此外模型结构上还参考了一篇知乎帖子, [深入浅出扩散模型(Diffusion Model)系列：基石DDPM（源码解读篇）][ddpm_zhihu], 这篇帖子是对 [annotated_deep_learning_paper_implementations][annotated_repo] 源码的分析, 省去了不少自己读代码的时间.

{% note "**[点击展开]** 模型代码" %}

```python
class TimeEmbedding(nn.Module):
    """Sinusoidal Time Embedding."""

    def __init__(self, fourier_channels: int, time_channels: int, theta: int = 10000):
        """Sinusoidal Time Embedding.

        Inputs:
            t: (B, )

        Outputs:
            time_embedding: (B, time_c)
        """

        super().__init__()

        self.fourier_channels = fourier_channels
        self.time_channels = time_channels
        self.theta = theta
        self.half_dim = self.fourier_channels // 2

        self.mlp = nn.Sequential(
            nn.Linear(self.fourier_channels, self.time_channels),
            nn.SiLU(),
            nn.Linear(self.time_channels, self.time_channels),
        )

        emb_coef = math.log(self.theta) / (self.half_dim - 1)
        emb_coef = torch.exp(torch.arange(self.half_dim) * -emb_coef)

        self.emb_coef: torch.Tensor
        self.register_buffer("emb_coef", emb_coef, False)

    def forward(self, t: torch.Tensor):
        emb = t[:, None] * self.emb_coef[None, :]
        emb = torch.cat((emb.sin(), emb.cos()), dim=1)
        emb = self.mlp(emb)
        return emb


class ResidualBlock(nn.Module):
    """Residual block.

    A residual block has two convolution layers with group normalization.
        Each resolution is processed with two residual blocks.
    """

    def __init__(self, in_channels: int, out_channels: int, time_channels: int, num_groups: int = 32, dropout: float = 0.1):
        """Residual block.

        Inputs:
            x: (B, in_c, h, w)
            t: (B, time_c)

        Outputs:
            x: (B, out_c, h, w)
        """

        super().__init__()

        self.conv1 = nn.Sequential(
            nn.GroupNorm(num_groups, in_channels),
            nn.SiLU(),
            nn.Conv2d(in_channels, out_channels, kernel_size=(3, 3), padding=(1, 1))
        )

        self.time_emb = nn.Sequential(
            nn.SiLU(),
            nn.Linear(time_channels, out_channels),
        )

        self.conv2 = nn.Sequential(
            nn.GroupNorm(num_groups, out_channels),
            nn.SiLU(),
            nn.Dropout(dropout),
            nn.Conv2d(out_channels, out_channels, kernel_size=(3, 3), padding=(1, 1))
        )

        if in_channels != out_channels:
            self.shortcut = nn.Conv2d(in_channels, out_channels, kernel_size=(1, 1))
        else:
            self.shortcut = nn.Identity()

    def forward(self, x: torch.Tensor, t: torch.Tensor):
        h = self.conv1(x)
        h = h + self.time_emb(t)[:, :, None, None]
        h = self.conv2(h)

        return h + self.shortcut(x)


class AttentionBlock(nn.Module):
    """Multihead Attention block"""

    def __init__(self, num_channels: int, num_heads: int = 1, num_groups: int = 32):
        """Multihead Attention block

        Inputs:
            x: (B, num_c, h, w)

        Outputs:
            x: (B, num_c, h, w)
        """

        super().__init__()

        self.norm = nn.GroupNorm(num_groups, num_channels)
        self.attn = nn.MultiheadAttention(num_channels, num_heads)

    def forward(self, x: torch.Tensor):
        B, C, H, W = x.shape

        x = self.norm(x)
        x = x.view(B, C, -1).permute(0, 2, 1)

        res, _ = self.attn(x, x, x, need_weights=False)
        x = x + res

        x = x.permute(0, 2, 1).view(B, C, H, W)
        return x


class DownBlock(nn.Module):
    """Down block

    This combines `ResidualBlock` and `AttentionBlock`. These are used in the first half of U-Net at each resolution.
    """

    def __init__(self, in_channels: int, out_channels: int, time_channels: int, has_attn: bool):
        """Down block.

        Inputs:
            x: (B, in_c, h, w)
            t: (B, time_c)

        Outputs:
            x: (B, out_c, h, w)
        """

        super().__init__()

        self.res = ResidualBlock(in_channels, out_channels, time_channels)
        if has_attn:
            self.attn = AttentionBlock(out_channels)
        else:
            self.attn = nn.Identity()

    def forward(self, x: torch.Tensor, t: torch.Tensor):
        x = self.res(x, t)
        x = self.attn(x)
        return x


class MiddleBlock(nn.Module):
    """Middle block

    It combines a `ResidualBlock`, `AttentionBlock`, followed by another `ResidualBlock`.
        This block is applied at the lowest resolution of the U-Net.
    """

    def __init__(self, num_channels: int, time_channels: int):
        """Middle block

        Inputs:
            x: (B, num_c, h, w)
            t: (B, time_c)

        Outputs:
            x: (B, num_c, h, w)
        """

        super().__init__()
        self.res1 = ResidualBlock(num_channels, num_channels, time_channels)
        self.attn = AttentionBlock(num_channels)
        self.res2 = ResidualBlock(num_channels, num_channels, time_channels)

    def forward(self, x: torch.Tensor, t: torch.Tensor):
        x = self.res1(x, t)
        x = self.attn(x)
        x = self.res2(x, t)
        return x


class UpBlock(nn.Module):
    """Up block

    This combines `ResidualBlock` and `AttentionBlock`. These are used in the second half of U-Net at each resolution.
    """

    def __init__(self, in_channels: int, out_channels: int, time_channels: int, has_attn: bool):
        """Up block.

        Inputs:
            x: (B, in_c, h, w)
            x_left: (B, out_c, h, w)
            t: (B, time_c)

        Outputs:
            x: (B, out_c, h, w)
        """

        super().__init__()
        self.res = ResidualBlock(in_channels + out_channels, out_channels, time_channels)
        if has_attn:
            self.attn = AttentionBlock(out_channels)
        else:
            self.attn = nn.Identity()

    def forward(self, x: torch.Tensor, x_left: torch.Tensor, t: torch.Tensor):
        x = torch.cat([x, x_left], 1)
        x = self.res(x, t)
        x = self.attn(x)
        return x


class DownSample(nn.Module):
    """Scale down the feature map by 1/2"""

    def __init__(self, n_channels):
        """Down Sample

        Inputs:
            x: (B, num_c, h, w)

        Outputs:
            x: (B, num_c, h // 2, w // 2)
        """

        super().__init__()
        self.conv = nn.Conv2d(n_channels, n_channels, (3, 3), (2, 2), (1, 1))

    def forward(self, x: torch.Tensor):
        return self.conv(x)


class UpSample(nn.Module):
    """Scale up the feature map by 2x"""

    def __init__(self, num_channels):
        """Up Sample

        Inputs:
            x: (B, num_c, h, w)

        Outputs:
            x: (B, num_c, h * 2, w * 2)
        """

        super().__init__()
        self.conv = nn.ConvTranspose2d(num_channels, num_channels, (4, 4), (2, 2), (1, 1))

    def forward(self, x: torch.Tensor):
        return self.conv(x)


class UNet(nn.Module):
    """U-Net used to predict noise."""

    def __init__(
        self,
        img_channels: int = 3,
        num_channels: int = 64,
        channel_multiples: Sequence[int] = (1, 2, 4, 8),
        has_attn: Sequence[bool] = (False, False, True, True),
        num_blocks: int = 2,
    ):
        """U-Net

        Args:
            img_channels: the number of channels in the image. 3 for RGB.
            num_channels: number of channels in the initial feature map that we transform the image into.
            channel_multiples: the list of channel multiple number at each resolution.
            has_attn: a list of booleans that indicate whether to use attention at each resolution.
            num_blocks: the number of `DownBlock` and `UpBlock` at each resolution.

        Inputs:
            x: (B, img_c, h, w)
            t: (B, )

        Outputs:
            x: (B, img_c, h, w)
        """

        super().__init__()

        num_resolutions = len(channel_multiples)
        time_channels = num_channels * 4

        self.time_emb = TimeEmbedding(num_channels, time_channels)
        self.in_conv = nn.Conv2d(img_channels, num_channels, kernel_size=(3, 3), padding=(1, 1))
        self.out_conv = nn.Sequential(
            nn.GroupNorm(32, num_channels),
            nn.SiLU(),
            nn.Conv2d(num_channels, img_channels, kernel_size=(3, 3), padding=(1, 1)),
        )

        # Down and Up
        self.down = nn.ModuleList()
        self.up = nn.ModuleList()
        in_c = num_channels
        for i in range(num_resolutions):
            out_c = num_channels * channel_multiples[i]

            # down blocks
            self.down.append(DownBlock(in_c, out_c, time_channels, has_attn[i]))
            for _ in range(num_blocks - 1):
                self.down.append(DownBlock(out_c, out_c, time_channels, has_attn[i]))

            # up blocks
            self.up.append(UpBlock(out_c, in_c, time_channels, has_attn[i]))
            for _ in range(num_blocks):
                self.up.append(UpBlock(out_c, out_c, time_channels, has_attn[i]))

            # up/down sample
            if i < num_resolutions - 1:
                self.down.append(DownSample(out_c))
                self.up.append(UpSample(out_c))

            in_c = out_c

        # Middle
        self.middle = MiddleBlock(num_channels * channel_multiples[-1], time_channels)

    def forward(self, x: torch.Tensor, t: torch.Tensor):
        t = self.time_emb(t)

        x = self.in_conv(x)

        h = [x]
        for m in self.down:
            if isinstance(m, DownBlock):
                x = m(x, t)
            else:
                x = m(x)
            h.append(x)

        x = self.middle(x, t)

        for m in reversed(self.up):
            if isinstance(m, UpBlock):
                x = m(x, h.pop(), t)
            else:
                x = m(x)

        assert len(h) == 0

        x = self.out_conv(x)
        return x


class GaussianDiffusion(nn.Module):
    """Gaussian Diffusion"""

    def __init__(self, eps_model: nn.Module, timesteps: int = 1000, beta_min: float = 0.0001, beta_max: float = 0.02):
        """Gaussian Diffusion

        Args:
            eps_model: epsilon theta model
            timesteps: T.
        """

        super().__init__()

        self.eps_model = eps_model
        self.timesteps = timesteps

        beta: torch.Tensor = torch.linspace(beta_min, beta_max, timesteps, dtype=torch.float32)
        alpha: torch.Tensor = 1.0 - beta
        alpha_bar: torch.Tensor = torch.cumprod(alpha, dim=0)

        # forward parameters
        self.q_mu_coef: torch.Tensor
        self.register_buffer("q_mu_coef", alpha_bar.sqrt(), False)

        self.q_sigma: torch.Tensor
        self.register_buffer("q_sigma", (1.0 - alpha_bar).sqrt(), False)

        # reverse parameters
        self.p_mu_coef: torch.Tensor
        self.register_buffer("p_mu_coef", 1.0 / alpha.sqrt(), False)

        self.p_eps_coef: torch.Tensor
        self.register_buffer("p_eps_coef", beta / (1.0 - alpha_bar).sqrt(), False)

        self.p_sigma: torch.Tensor
        self.register_buffer("p_sigma", beta.sqrt(), False)

    def q_sample(self, x0: torch.Tensor, t: torch.Tensor, eps: Optional[torch.Tensor] = None) -> torch.Tensor:
        """Forward from x0 to xt.

        Args:
            x0: (B, c, h, w)
            t: (B, )

        Returns:
            xt: (B, c, h, w)
        """

        if eps is None:
            eps = torch.randn_like(x0)

        mu = self.q_mu_coef.gather(-1, t).view(-1, 1, 1, 1) * x0
        sigma = self.q_sigma.gather(-1, t).view(-1, 1, 1, 1)

        return mu + sigma * eps

    def p_sample(self, xt: torch.Tensor, t: torch.Tensor, eps: Optional[torch.Tensor] = None) -> torch.Tensor:
        """Reverse from xt to xt_1.

        Args:
            xt: (B, c, h, w)
            t: (B, )

        Returns:
            xt_1: (B, c, h, w)
        """

        if eps is None:
            eps = torch.randn_like(xt)

        eps_theta = self.eps_model(xt, t)

        mu_coef = self.p_mu_coef.gather(-1, t).view(-1, 1, 1, 1)
        eps_coef = self.p_eps_coef.gather(-1, t).view(-1, 1, 1, 1)

        mu = mu_coef * (xt - eps_coef * eps_theta)
        sigma = self.p_sigma.gather(-1, t).view(-1, 1, 1, 1)

        return mu + sigma * eps

    def forward(self, x0: torch.Tensor, t: Optional[torch.Tensor] = None, noise: Optional[torch.Tensor] = None) -> torch.Tensor:
        """Compute losses for x0.

        Args:
            x0: (B, c, h, w)
            t: (B, )
            noise: (B, c, h, w)

        Returns:
            loss: MSE loss value
        """

        if t is None:
            t = torch.randint(0, self.timesteps, x0.shape[0:1], device=x0.device, dtype=torch.long)

        if noise is None:
            noise = torch.randn_like(x0)

        xt = self.q_sample(x0, t, eps=noise)
        eps_theta = self.eps_model(xt, t)

        return F.mse_loss(noise, eps_theta)
```

{% endnote %}

主要是实现一个 UNet, 并且结构如下.

![UNet](https://nn.labml.ai/unet/unet.png)

![UNet-DDPM](https://pic3.zhimg.com/80/v2-f396d21e0cfdfe324a2dc7a8636ac88e_1440w.webp)

第一个是原始 UNet 结构, 第二个是对应于 DDPM 的 UNet 结构, 参考一下理解原理即可.

对于扩散部分的代码, 可以参考很久之前的总结[扩散模型阅读笔记](/posts/2022/10/29/diffusion-model/), 里面有前向和反向的计算公式, 对着写就好了.

## 主程序

包含训练和生成部分代码, 以及命令行参数选项.

{% note "**[点击展开]** 训练和采样代码" %}

```python
class ProgressBar(rich.progress.Progress):
    def __init__(self, **kwargs):
        super().__init__(
            rich.progress.SpinnerColumn(),
            rich.progress.TextColumn("[progress.description]{task.description}"),
            rich.progress.BarColumn(),
            rich.progress.TaskProgressColumn("[progress.percentage]{task.completed:d}/{task.total:d}"),
            rich.progress.TimeElapsedColumn(),
            rich.progress.TimeRemainingColumn(),
            **kwargs
        )


class ImageDataset(Dataset):
    """Image Dataset."""

    def __init__(self, *folders: str, img_size: int = 64, img_mode: str = "RGB") -> None:
        """Anime Faces Dataset.

        Args:
            folders: dataset folders, containing pictures.
            img_size: to resize images to (img_size, img_size)
            img_mode: image mode, same as PIL options.
        """

        super().__init__()

        self.paths = [str(p) for f in folders for p in Path(f).iterdir()]
        self.trans = T.Compose([
            T.ToTensor(),
            T.Resize(img_size, antialias=True),
            T.CenterCrop(img_size),
            T.Normalize([0.5], [0.5])
        ])

        self.random_flip = T.RandomHorizontalFlip()

        self.img_mode = img_mode

        # load in memory to avoid io operations
        self.imgs = [self.trans(Image.open(p).convert(self.img_mode)) for p in self.paths]

    def __len__(self):
        return len(self.paths)

    def __getitem__(self, index):
        return self.random_flip(self.imgs[index])


class Program:
    """Diffusion Program"""

    def __init__(self, args) -> None:
        self.args = args

        self.img_mode: str = {1: "L", 3: "RGB"}[args.img_channels]
        self.imgtrans = T.Compose([
            T.Normalize([-1], [2]),
            T.ToPILImage(self.img_mode),
        ])

        self.model = GaussianDiffusion(
            UNet(args.img_channels,
                 args.num_channels,
                 args.channel_multiples,
                 args.has_attn,
                 args.num_blocks),
            args.timesteps,
            args.beta_min,
            args.beta_max
        ).to(args.device)

        if self.args.train:
            self.dataset = ImageDataset(*args.data_folders, img_size=args.img_size, img_mode=self.img_mode)
            self.dataloader = DataLoader(self.dataset, args.batch_size, True)
            self.optim = Adam(self.model.parameters(), args.lr)

    @torch.inference_mode()
    def ddpm(self, n: int, return_steps: bool = False, step: int = 100) -> List[torch.Tensor]:
        """DDPM Sample

        Args:
            n: n samples.
            return_steps: if return steps.
            step: if return steps, steps between steps.

        Returns:
            x_steps: List of x, the last is the final result, each one has shape of (B, c, h, w).
        """

        self.model.eval()
        n_steps = self.args.timesteps

        x_steps = []

        x = torch.randn([n, self.args.img_channels, self.args.img_size, self.args.img_size], device=self.args.device)

        if return_steps:
            x_steps.append(x)

        with ProgressBar() as progress:
            task_sample = progress.add_task("[red]DDPM Sample", total=n_steps)

            with torch.autocast(self.args.device):
                for t in reversed(range(n_steps)):
                    x = self.model.p_sample(x, x.new_full((n,), t, dtype=torch.long))

                    if (n_steps - t) % step == 0:
                        x_steps.append(x)

                    progress.advance(task_sample)

        x_steps.append(x)

        return x_steps

    def save_image(self, x: torch.Tensor, path: str):
        x: Image.Image = self.imgtrans(x.clamp(-1.0, 1.0))
        x.save(path)

    def save_ckpt(self, path: str):
        torch.save(self.model.state_dict(), path)

    def load_ckpt(self, path: str):
        self.model.load_state_dict(torch.load(path, self.args.device))

    def train(self) -> List[float]:
        """Train model.

        Returns:
            losses: Losses of each epoch.
        """

        losses = []
        self.model.train()
        save_dir = Path(self.args.ckpt_save_dir)

        with ProgressBar() as progress:
            task_epoch = progress.add_task("[#00DEF2]Epochs", total=self.args.epochs)

            for epoch in range(self.args.epochs):
                task_batch = progress.add_task("[#00DF75]Batches", total=len(self.dataset))

                epoch_losses = []
                start_t = time.time()
                for i, data in enumerate(self.dataloader):
                    data = data.to(args.device)
                    self.optim.zero_grad()
                    loss = self.model(data)
                    loss.backward()
                    self.optim.step()

                    if i % 100 == 0:
                        epoch_losses.append(loss.item())

                    progress.advance(task_batch, len(data))

                end_t = time.time()
                epoch_mean_loss = sum(epoch_losses) / len(epoch_losses)
                progress.print(f"[Epoch {epoch}] Loss: {epoch_mean_loss:.6f} Elapsed: {(end_t - start_t) / 60:.2f} min")
                losses.append(epoch_mean_loss)

                self.save_ckpt(save_dir.joinpath(f"ckpt-{epoch % 5}.pth"))

                progress.remove_task(task_batch)
                progress.advance(task_epoch)

        return losses

    def generate(self, n: int):
        """Generate random images."""

        imgs = self.ddpm(n)[-1]
        save_dir = Path(self.args.save_dir)
        for i in range(len(imgs)):
            self.save_image(imgs[i], save_dir.joinpath(f"ddpm-{i}.png"))

        all_img = make_grid(imgs)
        if self.args.img_channels == 1:
            all_img = all_img[0:1]
        self.save_image(all_img, save_dir.joinpath(f"ddpm-all.png"))

    def save_forward_steps(self, path: str):
        batch = next(iter(self.dataloader)).to(self.args.device)
        n = len(batch)
        forward_steps = [batch]
        for t in range(99, self.args.timesteps, 100):
            x_t = self.model.q_sample(batch, batch.new_full((n,), t, dtype=torch.long))
            forward_steps.append(x_t)
        self.save_image(torch.cat([torch.cat(v.unbind(), 1) for v in forward_steps], 2), path)

    def save_reverse_steps(self, path: str):
        self.save_image(torch.cat([torch.cat(v.unbind(), 1) for v in self.ddpm(8, True)], 2), path)

    def run(self):
        if self.args.loadckpt:
            self.load_ckpt(self.args.loadckpt)

        if self.args.train:
            # self.save_forward_steps("run-forward.png")
            self.save_reverse_steps("run-before.png")
            try:
                self.train()
            except KeyboardInterrupt:
                print("[*] Stopped by user.")
            self.save_reverse_steps("run-after.png")
        else:
            self.generate(self.args.batch_size)


if __name__ == "__main__":
    parser = ArgumentParser()

    # data args
    parser.add_argument("--data-folders", type=str, nargs="*")
    parser.add_argument("--img-channels", type=int, default=3)
    parser.add_argument("--img-size", type=int, default=64)

    # model args
    parser.add_argument("--num-channels", type=int, default=64)
    parser.add_argument("--channel-multiples", type=int, nargs="+", default=[1, 2, 4, 8])
    parser.add_argument("--has-attn", type=lambda x: x.lower() == "t", nargs="+", default=[False, False, True, True])
    parser.add_argument("--num-blocks", type=int, default=2)

    # diffusion args
    parser.add_argument("--timesteps", type=int, default=1000)
    parser.add_argument("--beta-min", type=float, default=0.0001)
    parser.add_argument("--beta-max", type=float, default=0.02)

    # train args
    parser.add_argument("--train", action="store_true")
    parser.add_argument("--lr", type=float, default=1e-4)
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--ckpt-save-dir", type=str, default="ckpt")

    # inference args
    parser.add_argument("--save-dir", type=str, default="output")

    # run args
    parser.add_argument("--seed", type=int, default=None)
    parser.add_argument("--device", type=str, default=("cuda" if torch.cuda.is_available() else "cpu"))
    parser.add_argument("--loadckpt", type=str, default=None)
    parser.add_argument("--batch-size", type=int, default=64)

    args = parser.parse_args()
    print(args)

    if args.seed:
        torch.manual_seed(args.seed)
        torch.cuda.manual_seed(args.seed)

    Program(args).run()
```

{% endnote %}

## 训练参数

模型参数都用的默认值, 与原论文非常接近, 但是不知道为啥模型体积比预期大了一点.

学习率可能需要调整一两次, 实测可以先按 `1e-3` 跑个 10 ~ 20 轮, 然后按 `1e-4` 跑到损失差不多稳定 (30 ~ 40 轮), 有出图效果之后, 再按 `1e-5` 和 `1e-6` 一直跑到收敛.

学习率一定不能太大了, 否则很容易崩.

用全部的 8 万数据集质量不是很高, 所以只用了 2 万那个, 并且在读取数据集的时候加了随机水平翻转图像.

当然了, 毕竟是炼丹, 说不定有更玄乎的参数设置咔咔就收敛效果还好.

## 炼丹结果

采样的时候为了快一点, 加了 `inference_mode` 和 `autocast`, PyTorch 提供的推理模式和自动混合精度.

实测加了混合精度后只需要原本 60% 左右的时间, 确实有明显的加速优势.

放几张反向去噪的结果图, 效果还行, 颇有毕加索的美术风格.

{% note success "**[点击展开]** 未收敛时反向扩散结果" %}
![ckpt-1e03x10.png](/static/image/ddpm/ckpt-1e03x10.png)
![ckpt-1e03x15.png](/static/image/ddpm/ckpt-1e03x15.png)
![ckpt-1e03x20.png](/static/image/ddpm/ckpt-1e03x20.png)
![ckpt-1e04x05.png](/static/image/ddpm/ckpt-1e04x05.png)
![ckpt-1e04x10.png](/static/image/ddpm/ckpt-1e04x10.png)
![ckpt-1e04x15.png](/static/image/ddpm/ckpt-1e04x15.png)
![ckpt-1e04x20.png](/static/image/ddpm/ckpt-1e03x20.png)
![ckpt-1e04x25.png](/static/image/ddpm/ckpt-1e04x25.png)
{% endnote %}

{% note success "**[点击展开]** 收敛之后反向扩散结果" %}
![ckpt-1e07x10.png](/static/image/ddpm/ckpt-1e07x10.png)
![ckpt-1e07x20.png](/static/image/ddpm/ckpt-1e07x20.png)
![ckpt-1e08x10.png](/static/image/ddpm/ckpt-1e08x10.png)
![ckpt-1e08x20.png](/static/image/ddpm/ckpt-1e08x20.png)
![ckpt-1e09x10.png](/static/image/ddpm/ckpt-1e09x10.png)
![ckpt-1e09x20.png](/static/image/ddpm/ckpt-1e09x20.png)
![ckpt-1e10x10.png](/static/image/ddpm/ckpt-1e10x10.png)
![ckpt-1e10x20.png](/static/image/ddpm/ckpt-1e10x20.png)
{% endnote %}

{% note success "**[点击展开]** 同一组高斯噪声随模型收敛采样结果" %}
![ckpt-all.png](/static/image/ddpm/ckpt-all.png)
{% endnote %}

最后放一个抽卡结果, 随机抽 64 张.

![sample-64.png](/static/image/ddpm/sample-64.png)

说实话, 炼丹效果和数据集有相当大关系, 越高质量的数据集炼出来的模型越好, 越不容易出问题, 并且数据量越大生成的结果也越丰富~~模型其实都不是什么特别重要的事情, 反正都是乱拟合一个~~.

## 参考

1. [Denoising Diffusion Probabilistic Models][ddpm_paper]
2. [diffusion][ddpm_tf]
3. [深入浅出扩散模型(Diffusion Model)系列：基石DDPM（源码解读篇）][ddpm_zhihu]
4. [annotated_deep_learning_paper_implementations][annotated_repo]
5. [denoising-diffusion-pytorch][ddpm_pytorch]

[ddpm_paper]: https://arxiv.org/pdf/2006.11239.pdf
[ddpm_tf]: https://github.com/hojonathanho/diffusion
[annotated_repo]: https://github.com/labmlai/annotated_deep_learning_paper_implementations
[ddpm_pytorch]: https://github.com/lucidrains/denoising-diffusion-pytorch
[ddpm_zhihu]: https://zhuanlan.zhihu.com/p/655568910
