---
title: NCM 文件批量转换 (保留专辑和封面信息)
categories:
  - "个人项目"
tags:
  - "ncm"
  - "格式转换"
  - "ncmdump"
  - "python 库"
  - "PyPI"
  - "网易云音乐"
date: 2023-11-04 23:04:33
---

这段时间打算用网易云音乐屯点资源, 但是下载之后才发现内容已经全部加密, 变成了 `ncm` 后缀的文件. 搜索一番, 找到了一些现成的转换工具和源码. 但是功能都十分有限, 而且转换出来之后的文件都没有专辑和封面信息~~强迫症大怒~~. 看了看有关的分析和源码之后, 决定自己重新整理一下转换功能, 并且把专辑和封面信息也加进去, 做个完善的命令行工具自用, 顺便打包成 Python 库, 上传到 PyPI 上.

本文包括以下内容, 首先整理一下网上已有的 `ncm` 格式转换代码, 然后增加补充专辑和封面信息的功能, 并实现批量转换和界面友好, 最后打包成二进制文件和 Python 库, 并上传到 PyPI 上.

文末附有项目的 Github 地址, 以及使用 PyInstaller 打包的二进制文件下载地址和 PyPI 项目地址.

<!-- more -->

## NCM 格式分析

Github 上搜 `ncmdump`, 有很多现成的项目, 通过源码和自己尝试后总结一下 `ncm` 格式如下表:

| 字段 | 长度 | 含义 |
| :---:  | :---:  | :---:  |
| `MAGIC_HEADER` | 8 字节 | ncm 文件的文件头标识, 内容为 `b"CTENFDAM"` |
| `gap1` | 2 字节 | 不确定, 据观察所有的文件都相同, 为 `b"\x01\x61"`, 猜测也是文件头一部分 |
| `rc4_key_enc_size` | 4 字节 | `int` 整数 |
| `rc4_key_enc` | `rc4_key_enc_size` | 加密后的 RC4 算法密钥 |
| `metadata_enc_size` | 4 字节 | `int` 整数 |
| `metadata_enc` | `metadata_enc_size` | 加密后的 `metadata`, 包含音乐的专辑和封面信息 |
| `crc32` | 4 字节 | 不确定, 据网上流传为 CRC32 校验码, 但是没找到是算哪个值的 |
| `gap2` | 5 字节 | 不确定, 据观察都为 `b"\x01"` 开头, `b"\x00"` 结尾 |
| `cover_data_size` | 4 字节 | `int` 整数 |
| `cover_data` | `cover_data_size` | 专辑封面图片二进制数据 |
| `music_data_enc` | 任意长度 | 加密后的音乐二进制数据, 处于 `ncm` 文件的最末尾 |

格式很清晰, 虽然有一些未知项, 但是不影响核心内容. 其中 `rc4_key_enc`, `metadata_enc`, `music_data_enc` 是加密过的, 只要全部解密就能还原出原本完整的音乐文件.

## NCM 文件解密

这部分内容也是总结已有的源码.

`ncm` 文件中使用了两种密码算法:

- 一种是经过魔改的 `RC4` 算法, 后文称它为 `NCMRC4`
- 另一种是标准的 `AES` 算法, 分组长度 `128` 比特, 工作模式 `ECB`, 填充算法为 `PKCS7`, 后文称它为 `NCMAES`

`ncm` 文件的加密方式如下:

- `music_data_enc = NCMRC4.encrypt(music_data, rc4_key)`
- `metadata_enc = NCMAES.encrypt(metadata_enc, AES_KEY_METADATA)`
- `rc4_key_enc = NCMAES.encrypt(rc4_key, AES_KEY_RC4_KEY)`

较大的 `music_data` 用魔改后的流密码加密, 节省时间; 较短的 `metadata` 和 `rc4_key` 用对称密码加密, 提高安全性.

这里 `AES_KEY_RC4_KEY` 和 `AES_KEY_METADATA` 是两个关键的对称密码密钥, 前人已经通过逆向等手段挖出来了, 这里就不放出来了, 可以去看看别人的分析或者看本文的源码, 里面都有.

除了使用加密手段, 还有一些简单的混淆操作, 以及去除解密后内容多余的头部字段等, 这里也不详细写了, 源码里面写的很清楚, 可以直接看源码.

## 添加专辑和封面信息

来到本文的重点部分, 前面对 `ncm` 格式和加密方式的分析都是已有的, 我们主要想扩展功能, 自动添加专辑和封面信息到解密后的文件里, 这里主要用到 `mutagen` 这个库, 支持向 `mp3` 和 `flac` 文件内加入专辑等信息.

解密后的 `metadata` 是一份 `json` 数据, 格式如下:

```json
{
    "format": "flac", 
    "musicId": 431259256, 
    "musicName": "カタオモイ", 
    "artist": [["Aimer", 16152]], 
    "album": "daydream", 
    "albumId": 34826361, 
    "albumPicDocId": 109951165052089697, 
    "albumPic": "http://p1.music.126.net/2QRYxUqXfW0zQpm2_DVYRA==/109951165052089697.jpg", 
    "mvId": 0, 
    "flag": 4, 
    "bitrate": 876923, 
    "duration": 207866, 
    "alias": [], 
    "transNames": ["单相思"]
}
```

我们需要把 `musicName`, `artist`, `album` 这三个字段的内容保留, 同时把 `ncm` 中附带的封面图片也保留.

我们导入一下要用到的库:

```python
from mutagen import flac, id3, mp3
from PIL import Image
```

对于 `mp3`, 如下操作:

```python
    def _addinfo_mp3(self, path: Union[str, PathLike]) -> None:
        """Add info for mp3 format."""

        audio = mp3.MP3(path)

        audio["TIT2"] = id3.TIT2(text=self.name, encoding=id3.Encoding.UTF8)  # title
        audio["TALB"] = id3.TALB(text=self.album, encoding=id3.Encoding.UTF8)  # album
        audio["TPE1"] = id3.TPE1(text="/".join(self.artists), encoding=id3.Encoding.UTF8)  # artists
        audio["TPE2"] = id3.TPE2(text="/".join(self.artists), encoding=id3.Encoding.UTF8)  # album artists

        if self._cover_data_size > 0:
            audio["APIC"] = id3.APIC(type=id3.PictureType.COVER_FRONT, mime=self.cover_mime, data=self._cover_data)  # cover

        audio.save()
```

这里 `cover_mime` 就是图像的内容类型, 例如 `image/jpeg` 这种, 可以通过 `mimetypes` 库获取.

而对于 `flac`, 如下操作:

```python
    def _addinfo_flac(self, path: Union[str, PathLike]) -> None:
        """Add info for flac format."""

        audio = flac.FLAC(path)

        # add music info
        audio["title"] = self.name
        audio["artist"] = self.artists
        audio["album"] = self.album
        audio["albumartist"] = "/".join(self.artists)

        # add cover
        if self._cover_data_size > 0:
            cover = flac.Picture()
            cover.type = id3.PictureType.COVER_FRONT
            cover.data = self._cover_data

            with BytesIO(self._cover_data) as data:
                with Image.open(data) as f:
                    cover.mime = self.cover_mime
                    cover.width = f.width
                    cover.height = f.height
                    cover.depth = len(f.getbands()) * 8

            audio.add_picture(cover)

        audio.save()
```

添加专辑封面图片的时候稍微复杂一点, 需要使用 `Pillow` 库读取一下图像的基本信息, 然后填进去.

值得注意的是, `ncm` 文件里可能没有存放专辑封面图片, 这种时候可以借助 `metadata` 里的 `albumPic` 字段, 它代表专辑封面图片的一个 url, 我们可以用 `urllib` 尝试联网获取内容, 代码片段如下:

```python
            # if no cover data, try get cover data by url in metadata
            if self._cover_data_size <= 0:
                try:
                    with request.urlopen(self._metadata.get("albumPic", "")) as res:
                        if res.status < 400:
                            self._cover_data = res.read()
                            self._cover_data_size = len(self._cover_data)
                except:
                    pass
```

值得注意的是, 代码里需要判断, 如果最终就是没有办法获得图片数据, 那么就放弃添加图片信息, 避免报错.

## 命令行工具

到这里, 我们的包目录结构长这样:

```plain
ncmdump
  ├── core.py
  ├── crypto.py
  ├── __init__.py
  └── __main__.py
```

共有四份文件, 为了能够在命令行里运行这个包, 我们需要在 `__main__.py` 里添加一些内容.

这里我们使用 `ArgumentParser` 解析命令行输入, `rich` 库显示进度条和日志输出, 完整代码如下.

```python
from argparse import ArgumentParser
from pathlib import Path

from rich.progress import Progress, SpinnerColumn, TimeElapsedColumn

from ncmdump import NeteaseCloudMusicFile

if __name__ == "__main__":
    parser = ArgumentParser("ncmdump", description="Dump ncm files with progress bar and logging info, only process files with suffix '.ncm'")
    parser.add_argument("files", nargs="*", help="Files to dump, can follow multiple files.")
    parser.add_argument("--in-folder", help="Input folder of files to dump.")
    parser.add_argument("--out-folder", help="Output folder of files dumped.", default=".")

    parser.add_argument("--dump-metadata", help="Whether dump metadata.", action="store_true")
    parser.add_argument("--dump-cover", help="Whether dump album cover.", action="store_true")

    args = parser.parse_args()

    out_folder = Path(args.out_folder)
    out_folder.mkdir(parents=True, exist_ok=True)

    dump_metadata = args.dump_metadata
    dump_cover = args.dump_cover

    files = args.files
    if args.in_folder:
        files.extend(Path(args.in_folder).iterdir())
    files = list(filter(lambda p: p.suffix == ".ncm", map(Path, files)))

    if not files:
        parser.print_help()
    else:
        with Progress(SpinnerColumn(), *Progress.get_default_columns(), TimeElapsedColumn()) as progress:
            task = progress.add_task("[#d75f00]Dumping files", total=len(files))

            for ncm_path in files:
                output_path = out_folder.joinpath(ncm_path.stem)

                try:
                    ncmfile = NeteaseCloudMusicFile(ncm_path).decrypt()
                    music_path = ncmfile.dump_music(output_path)

                    if dump_metadata:
                        ncmfile.dump_metadata(output_path)
                    if dump_cover:
                        ncmfile.dump_cover(output_path)

                except Exception as e:
                    progress.log(f"[red]ERROR[/red]: {ncm_path} -> {e}")

                else:
                    if not ncmfile.metadata:
                        progress.log(f"[yellow]WARNING[/yellow]: {ncm_path} -> {music_path}, no metadata found")
                    if not ncmfile.cover_data:
                        progress.log(f"[yellow]WARNING[/yellow]: {ncm_path} -> {music_path}, no cover data found")

                finally:
                    progress.advance(task)
```

该命令行可以接收若干数量的 `.ncm` 文件作为输入, 可以用 `--in-folder` 指定一整个文件夹, 会和输入的单个文件合并一起处理, 比如有下面几种使用示例.

```bat
REM 指定某些文件
python -m ncmdump file1.ncm file2.ncm
```

```bat
REM 指定一整个文件夹, 同时指定输出目录
python -m ncmdump --folder ncmfiles --out-folder musicfolder
```

```bat
REM 同时指定
python -m ncmdump file1.ncm file2.ncm --folder ncmfiles --out-folder musicfolder
```

输出文件的文件名和原本的 `.ncm` 文件名相同, 但是后缀会自动替换成对应格式的后缀 (`.mp3` 或者 `.flac`).

## 打包到 PyPI

最后就是打包上传~~造福大众的时间~~, 这也是我第一次在 PyPI 上上传自己的包, 之后会单独写一篇文章说说中途遇到的一些问题.

上传完成之后, 就可以通过命令 `pip install ncmdump-py` 安装使用了~

PS: 虽然库名字叫 `ncmdump-py`, 但是导入的时候还是 `import ncmdump`, 因为 `ncmdump` 这个项目名字在 PyPI 上已经被前人注册了, 只好加点东西区分一下.

## 相关资源

Github 地址: [https://github.com/ww-rm/ncmdump-py/](https://github.com/ww-rm/ncmdump-py)

PyPI 项目页: [https://pypi.org/project/ncmdump-py/](https://pypi.org/project/ncmdump-py/)

PyInstaller 打包的命令行工具: [ncmdump.zip](https://ww-rm.lanzout.com/ilKCJ1ds0e7e)
