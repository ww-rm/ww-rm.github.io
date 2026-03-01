---
title: 对音频进行频谱可视化
categories:
  - "代码块"
tags:
  - "音频处理"
  - "STFT"
  - "可视化"
date: 2026-03-01 11:49:47
---

最近需要对一些音频文件打轴, 里面有一些有规律的节奏音, 但是纯听或者看波形图很难精确对轴, 于是乎想着能不能转成频谱图的视频形式, 这样可以一帧一帧的去找声音事件的精确时间点, 在和 GPT 一番交流之后, 把脚本摸出来了, 在此记录一下.

<!-- more -->

## 基本思路

回忆一下大学学的关于音频处理的一些基础知识, 决定用 `librosa` 这个库来做, 支持对音频进行短时傅里叶变换 (Short-Time Fourier Transform, STFT), 相比于普通的傅里叶变换, STFT 内部会设置一个变换的时间窗得到频谱图, 例如几十或者几百毫秒内, 之后通过滑动窗的方式, 就可以得到整段输入时间内的频谱图.

对于整个视频, 我们需要设置在整个画面中显示的音频时长, 在这里称为视窗时长, 并且确定视频帧率, 于是每一帧画面都可以用 STFT 来得到这一帧的频谱图, 之后逐次移动到下一帧, 再次应用 STFT, 就可以得到连续的频谱视频帧, 最后将所有帧合成完整视频即可.

## 帧生成脚本

```python
import argparse
import shutil
from pathlib import Path

import cv2
import librosa
import numpy as np
from tqdm import tqdm


# ==============================
# 参数工具
# ==============================
def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("path", type=str)
    p.add_argument("--fps", type=int, default=50)
    p.add_argument("--sr", type=int, default=22050)
    p.add_argument("--view-seconds", type=float, default=6.0)
    p.add_argument("--n-fft", type=int, default=1024)
    p.add_argument("--hop-length", type=int, default=256)
    p.add_argument("--width", type=int, default=1280)
    p.add_argument("--height", type=int, default=720)
    p.add_argument("--min-db", type=float, default=-80.0)
    p.add_argument("--max-db", type=float, default=0.0)
    p.add_argument("--out-dir", type=str, default=".tmp.frames")
    return p.parse_args()


# ==============================
# 高速渲染
# ==============================
def fast_render(S_db_slice, out_w, out_h, min_db, max_db):
    # 归一化
    S_norm = (S_db_slice - min_db) / (max_db - min_db)
    S_norm = np.clip(S_norm, 0.0, 1.0)

    img = (S_norm * 255).astype(np.uint8)

    # colormap
    img = cv2.applyColorMap(img, cv2.COLORMAP_MAGMA)

    # 低频在下
    img = np.flipud(img)

    # resize
    img = cv2.resize(img, (out_w, out_h), interpolation=cv2.INTER_LINEAR)

    # 中心红线
    cx = out_w // 2
    cv2.line(img, (cx, 0), (cx, out_h), (0, 0, 255), 2)

    return img


# ==============================
# 主流程
# ==============================
def main():
    args = parse_args()
    audio_path = Path(args.path)
    frames_dir = Path(args.out_dir)

    # 重建帧目录
    if frames_dir.exists():
        shutil.rmtree(frames_dir)
    frames_dir.mkdir(parents=True, exist_ok=True)

    print("Loading audio...")
    y, sr = librosa.load(audio_path, sr=args.sr, mono=True)

    duration = len(y) / sr
    total_frames = int(duration * args.fps)

    print(f"Audio length: {duration:.2f}s")
    print(f"Total video frames: {total_frames}")

    # ==============================
    # 一次性 STFT
    # ==============================
    print("Computing full STFT (once)...")
    D_full = librosa.stft(
        y,
        n_fft=args.n_fft,
        hop_length=args.hop_length,
        win_length=args.n_fft,
        window="hann",
        center=True
    )

    S_full = np.abs(D_full)
    S_db_full = librosa.amplitude_to_db(S_full, ref=np.max)

    # ==============================
    # 时间映射
    # ==============================
    frames_per_sec = sr / args.hop_length
    half_frames = int((args.view_seconds / 2) * frames_per_sec)
    window_frames = 2 * half_frames

    print("Frames per second (STFT domain):", frames_per_sec)
    print("Window frames:", window_frames)

    # ==============================
    # 逐帧生成 PNG
    # ==============================
    print("Rendering frames to disk...")

    for i in tqdm(range(total_frames)):
        t = i / args.fps
        center_frame = int(t * frames_per_sec)

        t0 = center_frame - half_frames
        t1 = center_frame + half_frames

        src0 = max(t0, 0)
        src1 = min(t1, S_db_full.shape[1])

        slice_db = S_db_full[:, src0:src1]

        # padding
        if slice_db.shape[1] < window_frames:
            pad = window_frames - slice_db.shape[1]
            pad_width = ((0, 0), (pad, 0)) if i < total_frames / 2 else ((0, 0), (0, pad))
            slice_db = np.pad(
                slice_db,
                pad_width,
                mode="constant",
                constant_values=args.min_db
            )

        frame = fast_render(
            slice_db,
            args.width,
            args.height,
            args.min_db,
            args.max_db
        )

        # 保存 PNG
        out_path = frames_dir / f"frame_{args.fps:03d}_{i:06d}.png"
        cv2.imwrite(str(out_path), frame)

    print("Done!")
    print("Output:", frames_dir.as_posix())


if __name__ == "__main__":
    main()
```

## 合成视频

本来想直接用 `moviepy` 在脚本里直接合成的, 但是实际测试下来效率很差, 直接用 ffmpeg 命令行快多了.

```bash
ffmpeg -r 50 \
-i ".tmp.frames/frame_050_%06d.png" \
-i "input.mp3" \
-c:v libx264 -pix_fmt yuv420p -c:a aac \
output.mp4
```

## 可视化效果

![效果图](/static/image/wave2spectrum/frame_050_015574.webp)
