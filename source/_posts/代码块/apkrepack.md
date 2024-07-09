---
title: 安卓 APK 重打包
categories:
  - "代码块"
tags:
  - "安卓"
  - "APK"
  - "重打包"
date: 2024-07-09 23:17:28
---

为了用 Simpleperf 在非 root 机上进行性能分析, 需要在 apk 的清单文件中设置 `android:debuggable="true"` 的标记, 因此研究了一下怎么对 apk 进行重打包, 对修改后的包进行性能分析.

<!-- more -->

## 步骤

重打包大概分成几个步骤:

1. 解包
2. 修改包体
3. 重打包
4. 对齐
5. 重签名

顺序很重要, 签名的步骤一定是最后完成.

其中解包和重打包用 [apktool](https://apktool.org/) 解决.

修改包体可以自己按需手动或者脚本修改.

对齐和重签名分别用 Android Sdk 的 build-tools 里的 `zipalign.exe` 和 `apksigner.jar` 完成.

上述提到的工具都可以通过 `--help` 查看用法, 比较简单.

值得一提的是重签名的时候需要用 java 自带的工具 `keytool` 生成一份自签名的证书文件, 可以用类似下面的命令生成:

```bash
keytool -genkeypair -v -keystore repacker.keystore -keyalg RSA -keysize 4096 -validity 10000
```

要填很多信息, 可以随便填, 比如都填 `repacker`, 最后输入 `y` 确认, 但是开头的口令可以怎么简单怎么来, 比如 `123456`.

## 一键脚本

写了个一键重打包脚本, 并且可以选择增加调试标志.

```python
import os
import subprocess as sp
from argparse import ArgumentParser
from pathlib import Path
from time import sleep
from typing import Optional, Union
from xml.dom import minidom


DEFAULT_ANDROID_SDK_DIR = Path(os.getenv("LOCALAPPDATA"), "Android", "Sdk")


def find_bin_path(filename: str, *extra_search_dirs: list[os.PathLike]) -> Optional[Path]:
    """Try to find bin file in system path and return full file path."""

    search_dirs = os.get_exec_path()
    search_dirs.extend(extra_search_dirs)

    for p in map(Path, search_dirs):
        exec_path = p.joinpath(filename)
        if exec_path.is_file():
            return exec_path.resolve()
    return None


class AndroidSdkBuildTool:
    def __init__(self, tool_dir) -> None:
        self._dir = Path(tool_dir).resolve()

    @property
    def version(self):
        return self._dir.name

    @property
    def apksigner(self):
        return self._dir.joinpath("lib", "apksigner.jar")

    @property
    def zipalign(self):
        return self._dir.joinpath("zipalign.exe")


class AndroidSdk:
    def __init__(self, sdk_dir: os.PathLike) -> None:
        self._dir = Path(sdk_dir).resolve()

    def get_build_tools(self):
        return [AndroidSdkBuildTool(p) for p in self._dir.joinpath("build-tools").iterdir()]


class AndroidManifest:
    def __init__(self, path: os.PathLike) -> None:
        self._tree = minidom.parse(str(path))

    def enable_debuggable(self, flag: bool = True):
        application_node = self._tree.getElementsByTagName("application")[0]
        application_node.setAttribute("android:debuggable", ("true" if flag else "false"))

    def save(self, path: os.PathLike):
        path = Path(path)
        path.write_bytes(self._tree.toxml(encoding="utf-8", standalone=False))
        return path


class APKRepacker:

    def __init__(
        self,
        *extra_bin_dirs,
        android_sdk_dir: Optional[Path] = None,
        ks_file: Optional[os.PathLike] = None,
        ks_pwd: Optional[str] = None
    ) -> None:
        if android_sdk_dir is None:
            android_sdk_dir = DEFAULT_ANDROID_SDK_DIR
        self._java_path = find_bin_path("java.exe", *extra_bin_dirs)
        self._apktool_path = find_bin_path("apktool.jar", *extra_bin_dirs)
        self._android_sdk = AndroidSdk(android_sdk_dir)
        self._android_build_tool = self._android_sdk.get_build_tools()[-1]

        self._ks_file = None if ks_file is None else Path(ks_file)
        self._ks_pwd = ks_pwd

    def _exec(self, bin_path: os.PathLike, *args):
        args = [str(Path(bin_path).resolve()), *map(str, args)]
        print(f"Exec: {args}")
        return sp.run(args)

    def _exec_jar(self, jar_path: os.PathLike, *args):
        return self._exec(self._java_path, "-jar", jar_path, args)

    def print_executables(self):
        print(f"java: {self._java_path}")
        print(f"apktool: {self._apktool_path}")
        print(f"zipalign: {self._android_build_tool.zipalign}")
        print(f"apksigner: {self._android_build_tool.apksigner}")

    def unpack(self, apk_path: os.PathLike, output_dir: os.PathLike):
        self._exec_jar(self._apktool_path, "-f", "d", str(apk_path), "-o", str(output_dir))
        return Path(output_dir)

    def pack(self, apk_dir: os.PathLike, output_path: os.PathLike):
        self._exec_jar(self._apktool_path, "-f", "b", str(apk_dir), "-o", str(output_path))
        return Path(output_path)

    def align(self, apk_path: os.PathLike, output_path: os.PathLike):
        # MUST use absolute path
        apk_path = Path(apk_path).resolve()
        output_path = Path(output_path).resolve()
        self._exec(self._android_build_tool.zipalign, "-f", "-p", "4", str(apk_path), str(output_path))
        return Path(output_path)

    def sign(self, apk_path: os.PathLike, output_path: os.PathLike):
        if self._ks_file is None or self._ks_pwd is None:
            raise ValueError("apksigner needs ks file and ks password")

        p = sp.Popen(
            [str(self._java_path), "-jar",
             str(self._android_build_tool.apksigner), "sign",
             "--ks", str(self._ks_file), "--out", str(output_path), str(apk_path)],
            stdin=sp.PIPE
        )
        sleep(1)
        print(self._ks_pwd, file=p.stdin, end="\n")
        return Path(output_path)

    def add_debuggable_flag(self, apk_dir: os.PathLike):
        manifest_path = Path(apk_dir).joinpath("AndroidManifest.xml")
        manifest = AndroidManifest(manifest_path)
        manifest.enable_debuggable(True)
        manifest.save(manifest_path)


def main():
    parser = ArgumentParser()
    parser.add_argument("-p", "--apk", type=str, help="要修改的 APK 文件路径", required=True)
    parser.add_argument("-o", "--output", type=str, help="重新打包后 APK 的输出路径", required=True)

    parser.add_argument("--sdk-dir", type=str, help="Android Sdk 目录")
    parser.add_argument("--extra-search-dir", nargs="+", type=str, help="可执行文件或者 jar 包的额外搜索路径", default=())
    parser.add_argument("--ks-file", type=str, help="keytool 生成的自签名证书文件")
    parser.add_argument("--ks-pwd", type=str, help="ks 文件的口令")

    parser.add_argument("--enable-debuggable", action="store_true", help="在 AndroidManifest.xml 增加可调试标记")

    args = parser.parse_args()

    tmp = Path("./tmp").resolve()
    tmp.mkdir(parents=True, exist_ok=True)

    repacker = APKRepacker(
        *args.extra_search_dir,
        android_sdk_dir=args.sdk_dir,
        ks_file=args.ks_file,
        ks_pwd=args.ks_pwd
    )
    repacker.print_executables()

    # apk paths and dirs
    apk_path = Path(args.apk)
    apk_name = apk_path.stem
    apk_dir = tmp.joinpath(apk_name)
    apk_repack_path = tmp.joinpath(f"{apk_name}_repack.apk")
    apk_align_path = tmp.joinpath(f"{apk_name}_align.apk")
    apk_output_path = Path(args.output)

    # unpack apk to dir
    repacker.unpack(apk_path, apk_dir)

    # do some modifications
    if args.enable_debuggable:
        repacker.add_debuggable_flag(apk_dir)

    # pack and resign
    repacker.pack(apk_dir, apk_repack_path)
    repacker.align(apk_repack_path, apk_align_path)
    repacker.sign(apk_align_path, apk_output_path)


if __name__ == "__main__":
    main()
```

会自动搜索本机上存在的可执行文件, 也可以提供额外的文件搜索路径.
