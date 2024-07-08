---
title: Simpleperf 三部曲 (一)
categories:
  - "阅读笔记"
tags:
  - "Simpleperf"
  - "Android"
  - "安卓性能分析"
date: 2024-07-07 23:18:25
---

本文是对性能分析工具 [Simpleperf](https://android.googlesource.com/platform/system/extras/+/main/simpleperf/doc/README.md) 使用文档总结, 也可以看作是文档翻译.

<!-- more -->

## 简介

### 概述

相比与直接使用 Simpleperf, Android Studio 提供了一个基于 simpleperf 的图形化前端, [Inspect CPU activity with CPU Profiler](https://developer.android.com/studio/profile/cpu-profiler) 文档中介绍了如何使用 CPU Profiler 来分析安卓上的应用性能.

Simpleperf 是 Android 的本地 CPU 分析工具. 它可以用来分析 Android 应用程序和运行在 Android 上的本地进程. 它可以分析 Android 上的 Java 和 c++ 代码. Simpleperf 可执行文件可以在 Android >= L 上运行, Python 脚本可以在 Android >= N 上使用.

Simpleperf 包含两个部分: simpleperf 可执行文件和 Python 脚本.

simpleperf 可执行文件类似于 linux-tools-perf, 但在 Android 性能分析环境中具有一些特定功能:

- 在性能分析数据中收集更多信息. 由于常见的工作流程是"在设备上记录, 并在主机上报告", simpleperf 不仅在性能分析数据中收集样本, 还收集所需的符号, 设备信息和记录时间.
- 提供新的记录功能.
    - 在记录基于 dwarf 的调用图时, simpleperf 在将样本写入文件之前展开堆栈. 这是为了节省设备上的存储空间.
    - 支持使用 `--trace-offcpu` 选项跟踪 CPU 时间和非 CPU 时间.
    - 支持在 Android P 及以上版本上记录 JIT 编译和解释的 Java 代码的调用图.
- 与 Android 平台紧密相关.
    - 了解 Android 环境, 例如使用系统属性启用性能分析, 使用 `run-as` 在应用程序的上下文中进行性能分析.
    - 支持从 `.gnu_debugdata` 部分读取符号和调试信息, 因为系统库从 Android O 开始使用 `.gnu_debugdata` 部分构建.
    - 支持分析嵌入在 apk 文件中的共享库.
    - 使用标准的 Android 堆栈展开器, 因此其结果与所有其他 Android 工具一致.
- 构建用于不同用途的可执行文件和共享库.
    - 在设备上构建静态可执行文件. 由于静态可执行文件不依赖于任何库, simpleperf 可执行文件可以推送到任何 Android 设备上并用于记录性能分析数据.
    - 在不同的主机上构建可执行文件: Linux, Mac 和 Windows. 这些可执行文件可用于在主机上报告.
    - 在不同的主机上构建报告共享库. 报告库由不同的 Python 脚本使用来解析性能分析数据.

有关 simpleperf 可执行文件的详细文档见 [executable-commands-reference](https://android.googlesource.com/platform/system/extras/+/main/simpleperf/doc/README.md#executable-commands-reference).

Python 脚本根据其功能分为三个部分:

- 用于记录的脚本, 如 `app_profiler.py`, `run_simpleperf_without_usb_connection.py`.
- 用于报告的脚本, 如 `report.py`, `report_html.py`, `inferno`.
- 用于解析性能分析数据的脚本, 如 `simpleperf_report_lib.py`.

这些 Python 脚本在 Python >= 3.9 版本上进行了测试. 旧版本可能不受支持. 有关 Python 脚本的详细文档见 [scripts-reference](https://android.googlesource.com/platform/system/extras/+/main/simpleperf/doc/README.md#scripts-reference).

### simpleperf 中的工具

simpleperf 可执行文件和 Python 脚本位于 NDK 发布版的 simpleperf/ 目录中, 以及 AOSP 的 system/extras/simpleperf/scripts/ 目录中. 它们的功能如下所列.

- `bin/`: 包含可执行文件和共享库.
    - `bin/android/${arch}/simpleperf`: 用于设备上的静态 simpleperf 可执行文件.
    - `bin/${host}/${arch}/simpleperf`: 用于主机上的 simpleperf 可执行文件, 仅支持报告功能.
    - `bin/${host}/${arch}/libsimpleperf_report.${so/dylib/dll}`: 用于主机上的报告共享库.

- `*.py`, `inferno`, `purgatorio`: 用于记录和报告的 Python 脚本. 详细信息见 [scripts_reference.md](https://android.googlesource.com/platform/system/extras/+/main/simpleperf/doc/scripts_reference.md).

### 常见问题

#### 在不同 Android 版本上的支持

在 Android < N 上, 内核可能过旧 (< 3.18), 不支持记录基于 DWARF 的调用图等功能. 在 Android M - O 上, 我们只能分析 C++ 代码和完全编译的 Java 代码. 在 Android >= P 上, ART 解释器支持基于 DWARF 的展开, 因此我们可以分析 Java 代码. 在 Android >= Q 上, 我们可以使用设备上的 simpleperf 来分析已发布的 Android 应用, 只需在 AndroidManifest.xml 中添加 `<profileable android:shell="true" />`.

#### 比较基于 DWARF 和基于堆栈帧的调用图

Simpleperf 支持两种方式记录调用栈. 一个是基于 DWARF 的调用图, 另一个是基于堆栈帧的调用图. 以下是它们的比较:

记录基于 DWARF 的调用图:

- 需要二进制文件中调试信息的支持.
- 在 ARM 和 ARM64 上表现良好, 对 Java 代码和 C++ 代码都适用.
- 每个样本只能展开 64K 的堆栈. 因此不总是可能展开到最底部. 然而, 这在 simpleperf 中得到了缓解, 如下一节所述.
- 比基于堆栈帧的调用图占用更多的 CPU 时间. 因此它的开销更大, 无法以很高的频率采样 (通常 <= 4000 Hz).

记录基于堆栈帧的调用图:

- 需要堆栈帧寄存器的支持.
- 在 ARM 上表现不佳. 因为 ARM 缺少寄存器, 且 ARM 和 THUMB 代码有不同的堆栈帧寄存器. 因此内核无法展开同时包含 ARM 和 THUMB 代码的用户堆栈.
- 在 Java 代码上也表现不佳. 因为 ART 编译器不保留堆栈帧寄存器, 并且它无法获取解释的 Java 代码的帧.
- 在分析 ARM64 上的本机程序时表现良好. 一个例子是分析 surfacelinger. 当它表现良好时, 通常会显示完整的火焰图.
- 比基于 DWARF 的调用图占用更少的 CPU 时间. 因此采样频率可以达到 10000 Hz 或更高.

所以, 如果需要在 ARM 上分析代码或分析 Java 代码, 基于 DWARF 的调用图更好. 如果需要在 ARM64 上分析 C++ 代码, 基于堆栈帧的调用图可能更好. 总之, 可以先尝试基于 DWARF 的调用图, 这是使用 `-g` 时的默认选项. 因为它总能产生合理的结果. 如果效果不够好, 再尝试基于堆栈帧的调用图.

#### 修复基于 DWARF 的破损调用图

基于 DWARF 的调用图是通过展开线程堆栈生成的. 当记录一个样本时, 内核会转储最多 64KB 的堆栈数据. 通过基于 DWARF 信息展开堆栈, 我们可以得到调用栈.

造成调用栈破损的两个原因:

- 内核每个样本只能转储最多 64KB 的堆栈数据, 但线程可能有更大的堆栈. 在这种情况下, 我们无法展开到线程的起始点.
- 我们需要包含 DWARF 调用帧信息的二进制文件来展开堆栈帧. 二进制文件应具有以下部分之一: `.eh_frame`, `.debug_frame`, `.ARM.exidx` 或 `.gnu_debugdata`.

为缓解这些问题:

关于缺少堆栈数据的问题:

为缓解这个问题, simpleperf 在记录后会连接调用链 (调用栈). 如果一个线程的两个调用链有包含相同 ip 和 sp 地址的条目, 那么 simpleperf 尝试连接它们以延长调用链. 因此, 通过更长时间的记录和更多样本的连接, 我们可以获得更完整的调用链. 虽然这不能保证获得完整的调用图, 但通常效果很好.

simpleperf 在展开样本前将其存储在缓冲区中. 如果缓冲区空闲空间不足, simpleperf 可能会决定将样本的堆栈数据截断为 1K. 希望通过调用链连接可以恢复这些数据. 但如果大量样本被截断, 许多调用链可能会破损. 我们可以通过记录命令的输出判断样本是否被截断, 例如:

```bash
$ simpleperf record ...
simpleperf I cmd_record.cpp:809] Samples recorded: 105584 (cut 86291). Samples lost: 6501.

$ simpleperf record ...
simpleperf I cmd_record.cpp:894] Samples recorded: 7,365 (1,857 with truncated stacks).
```

有两种方法可以避免截断样本. 一种是增加缓冲区大小, 例如 `--user-buffer-size 1G`. 但 `--user-buffer-size` 仅在最新的 simpleperf 中可用. 如果该选项不可用, 可以使用 `--no-cut-samples` 禁止截断样本.

关于缺少 DWARF 调用帧信息的问题:

大多数 C++ 代码生成的二进制文件包含调用帧信息, 位于 `.eh_frame` 或 `.ARM.exidx` 部分. 这些部分不会被剥离, 通常足以进行堆栈展开.

对于 C 代码和一小部分编译器确定不会生成异常的 C++ 代码, 调用帧信息生成在 `.debug_frame` 部分. 通常 `.debug_frame` 部分会与其他调试部分一起被剥离 (strip). 解决方法之一是在设备上下载未剥离的二进制文件, 如[这里](https://android.googlesource.com/platform/system/extras/+/main/simpleperf/doc/README.md#fix-broken-callchain-stopped-at-c-functions)所述.

编译器不会为函数的序言和尾声生成展开指令, 因为它们操作堆栈帧且不会生成异常. 但分析可能会遇到这些指令, 并且无法展开它们. 这通常在帧图中不重要, 但在基于时间的堆栈图表 (如 Android Studio 和 Firefox 分析器中) 中, 偶尔会导致堆栈间隙. 我们可以通过 `--remove-gaps` 移除堆栈间隙, 默认情况下已启用此选项.

#### 修复在 C 函数中停止的破损调用链

使用基于 DWARF 的调用图时, simpleperf 在记录期间生成调用链以节省空间. 展开 C 函数所需的调试信息在 `.debug_frame` 部分, 通常在 apk 中的本机库中被剥离. 为解决此问题, 我们可以在设备上下载未剥离的本机库, 并在记录时要求 simpleperf 使用它们.

直接使用 simpleperf:

```bash
# 在设备上创建 native_libs 目录, 并推送未剥离的库到其中 (不支持嵌套目录). 
$ adb shell mkdir /data/local/tmp/native_libs
$ adb push <unstripped_dir>/*.so /data/local/tmp/native_libs
# 使用 --symfs 选项运行 simpleperf record. 
$ adb shell simpleperf record xxx --symfs /data/local/tmp/native_libs
```

使用 `app_profiler.py`:

```bash
./app_profiler.py -lib <unstripped_dir>
```

#### 如何解决报告中缺少符号的问题

`simpleperf record` 命令在设备上的 `perf.data` 中收集符号. 但如果你在设备上使用的本机库被剥离, 这会导致报告中有很多未知符号. 解决方案是在主机上构建 `binary_cache`.

```bash
# 收集 perf.data 中需要的二进制文件到 binary_cache/ 中. 
$ ./binary_cache_builder.py -lib NATIVE_LIB_DIR,...
```

传递给 `-lib` 选项的 NATIVE_LIB_DIR 是包含主机上未剥离本机库的目录. 运行后, 包含符号表的本机库将收集到 binary_cache/ 中供报告使用.

```bash
$ ./report.py --symfs binary_cache

# report_html.py 会自动搜索 binary_cache/, 因此不需要传递任何参数. 
$ ./report_html.py
```

#### 显示注释的源代码和反汇编

要在源代码和指令级别显示热点位置, 我们需要显示带有事件计数注释的源代码和反汇编. simpleperf 支持显示 C++ 代码和完全编译的 Java 代码的注释源代码和反汇编. simpleperf 支持两种方法来实现这一点:

通过 `report_html.py`:

- 生成 perf.data 并将其拉到主机上.
- 生成包含调试信息的 elf 文件的 binary_cache. 使用 `-lib` 选项添加带有调试信息的库. 通过 `binary_cache_builder.py -i perf.data -lib <dir_of_lib_with_debug_info>` 实现.
- 使用 `report_html.py` 生成带有注释源代码和反汇编的 `report.html`, 如[此处](https://android.googlesource.com/platform/system/extras/+/main/simpleperf/doc/scripts_reference.md#report_html_py)所述.

通过 `pprof`:

- 如上所述生成 `perf.data` 和 `binary_cache`.
- 使用 `pprof_proto_generator.py` 生成 pprof 原型文件.
- 使用 pprof 报告带有注释源代码的函数, 如[此处](https://android.googlesource.com/platform/system/extras/+/main/simpleperf/doc/scripts_reference.md#pprof_proto_generator_py)所述.

#### 减少丢失的样本和堆栈被截断的样本

使用 simpleperf 记录时, 我们可能会看到丢失的样本或堆栈数据被截断的样本. 在将样本保存到文件之前, simpleperf 使用两个缓冲区在内存中缓存样本. 一个是内核缓冲区, 另一个是用户空间缓冲区. 内核将样本放入内核缓冲区. simpleperf 在处理样本之前将样本从内核缓冲区移动到用户空间缓冲区. 如果缓冲区溢出, 我们会丢失样本或得到堆栈数据被截断的样本. 以下是一个示例.

```bash
$ simpleperf record -a --duration 1 -g --user-buffer-size 100k
simpleperf I cmd_record.cpp:799] Recorded for 1.00814 seconds. Start post processing.
simpleperf I cmd_record.cpp:894] Samples recorded: 79 (16 with truncated stacks).
                                 Samples lost: 2,129 (kernelspace: 18, userspace: 2,111).
simpleperf W cmd_record.cpp:911] Lost 18.5567% of samples in kernel space, consider increasing
                                 kernel buffer size(-m), or decreasing sample frequency(-f), or
                                 increasing sample period(-c).
simpleperf W cmd_record.cpp:928] Lost/Truncated 97.1233% of samples in user space, consider
                                 increasing userspace buffer size(--user-buffer-size), or
                                 decreasing sample frequency(-f), or increasing sample period(-c).
```

在上述示例中, 我们得到了 79 个样本, 其中 16 个样本的堆栈数据被截断. 我们在内核缓冲区中丢失了 18 个样本, 在用户空间缓冲区中丢失了 2111 个样本.

要减少内核缓冲区中丢失的样本, 我们可以通过 `-m` 增加内核缓冲区大小. 要减少用户空间缓冲区中丢失的样本或减少堆栈数据被截断的样本, 我们可以通过 `--user-buffer-size` 增加用户空间缓冲区大小.

我们还可以减少在固定时间段内生成的样本数量, 例如使用 `-f` 减少采样频率, 减少监控的线程数量, 不同时监控多个 perf 事件.

## Android 应用程序分析

原文见 [Android application profiling](https://android.googlesource.com/platform/system/extras/+/main/simpleperf/doc/android_application_profiling.md).

分析安卓应用程序涉及三个步骤:

1. 准备安卓应用程序.
2. 记录性能分析数据.
3. 报告性能分析数据.

### 准备安卓应用

根据分析情况, 我们可能需要定制构建脚本, 以专门生成用于分析的 apk 文件. 以下是一些建议.

---

如果你想分析应用程序的调试版本:

对于调试版本类型, Android Studio 在 `AndroidManifest.xml` 中设置 `android:debuggable="true"`, 启用 JNI 检查, 并且可能不会优化 C/C++ 代码. 无需任何更改, simpleperf 就可以分析它.

---

如果你想分析应用程序的发布版本:

对于发布版本类型, Android Studio 在 `AndroidManifest.xml` 中设置 `android:debuggable="false"`, 禁用 JNI 检查并优化 C/C++ 代码. 然而, 由于安全限制, 只有设置了 `android:debuggable` 为 `true` 的应用程序才能被分析. 因此, simpleperf 只能在以下三种情况下分析发布版本:

1. 如果你使用的是已 root 的设备, 可以分析任何应用程序.
2. 如果你使用的是 Android >= Q, 可以在 `AndroidManifest.xml` 中添加 profileableFromShell 标志, 这使得预装的分析工具可以分析发布的应用程序. 在这种情况下, 通过 adb 下载的 simpleperf 将调用系统镜像中预装的 simpleperf 来分析应用程序.

    ```xml
    <manifest ...>
        <application ...>
        <profileable android:shell="true" />
        </application>
    </manifest>
    ```

3. 如果你使用的是 Android >= O, 我们可以使用 `wrap.sh` 来分析发布版本:
    1. 第一步: 在 `AndroidManifest.xml` 中添加 `android:debuggable="true"` 以启用分析.

        ```xml
        <manifest ...>
            <application android:debuggable="true" ...>
        ```

    2. 第二步: 在 `lib/arch` 目录中添加 `wrap.sh`. `wrap.sh` 在不传递任何调试标志给 ART 的情况下运行应用程序, 因此应用程序作为发布应用程序运行. 可以通过在 `app/build.gradle` 中添加以下脚本来实现 `wrap.sh`.

        ```groovy
        android {
            buildTypes {
                release {
                    sourceSets {
                        release {
                            resources {
                                srcDir {
                                    "wrap_sh_lib_dir"
                                }
                            }
                        }
                    }
                }
            }
        }

        task createWrapShLibDir {
            for (String abi : ["armeabi-v7a", "arm64-v8a", "x86", "x86_64"]) {
                def dir = new File("app/wrap_sh_lib_dir/lib/" + abi)
                dir.mkdirs()
                def wrapFile = new File(dir, "wrap.sh")
                wrapFile.withWriter { writer ->
                    writer.write('#!/system/bin/sh\n$@\n')
                }
            }
        }
        ```

---

如果你想分析 C/C++ 代码:

Android Studio 会在 apk 中剥离本机库的符号表和调试信息. 因此, 分析结果可能包含未知符号或损坏的调用图. 为了解决这个问题, 我们可以通过 `-lib` 选项将包含未剥离本机库的目录传递给 `app_profiler.py`. 通常, 这个目录可以是你的 Android Studio 项目的路径.

---

如果你想分析 Java 代码:

- 在 Android >= P 上, simpleperf 支持分析 Java 代码, 无论是通过解释器执行, 还是通过 JIT 编译, 或者编译成本机指令. 因此, 你不需要做任何事情.
- 在 Android O 上, simpleperf 支持分析编译成本机指令的 Java 代码, 并且还需要 wrap.sh 来使用编译后的 Java 代码. 要编译 Java 代码, 我们可以传递 --compile_java_code 选项给 app_profiler.py.
- 在 Android N 上, simpleperf 支持分析编译成本机指令的 Java 代码. 要编译 Java 代码, 我们可以传递 --compile_java_code 选项给 app_profiler.py.
- 在 Android <= M 上, simpleperf 不支持分析 Java 代码.

以下是使用 [SimpleperfExampleCpp](https://android.googlesource.com/platform/system/extras/+/main/simpleperf/demo/SimpleperfExampleCpp) 应用程序的示例. 它构建了一个用于分析的 app-debug.apk.

```bash
$ git clone https://android.googlesource.com/platform/system/extras
$ cd extras/simpleperf/demo
# 用 Android Studio 打开 SimpleperfExampleCpp 项目, 并成功构建此项目, 否则下面的 `./gradlew` 命令将失败. 
$ cd SimpleperfExampleCpp

# 在 Windows 上, 使用 "gradlew" 而不是 "./gradlew". 
$ ./gradlew clean assemble
$ adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### 记录和报告分析数据

我们可以使用 `app_profiler.py` 来分析安卓应用程序.

```bash
# 切换到 simpleperf 脚本的目录. 记录 perf.data. 
# -p 选项通过包名选择被分析的应用程序. 
# --compile_java_code 选项将 Java 代码编译成本机指令, Android >= P 上不需要这个选项. 
# -a 选项选择要分析的 Activity. 
# -lib 选项指定查找调试本机库的目录. 
$ ./app_profiler.py -p simpleperf.example.cpp -a .MixActivity -lib path_of_SimpleperfExampleCpp
```

这将在当前目录中收集 `perf.data` 作为性能分析数据, 并在 `binary_cache/` 中存储相关的本机二进制文件.

通常我们在分析时需要使用应用程序, 否则可能不会记录任何样本. 但在这种情况下, MixActivity 启动了一个忙线程, 因此我们在分析时不需要使用应用程序.

```bash
# 在 stdio 界面中报告 perf.data. 
$ ./report.py
Cmdline: /data/data/simpleperf.example.cpp/simpleperf record ...
Arch: arm64
Event: task-clock:u (type 1, config 1)
Samples: 10023
Event count: 10023000000

Overhead  Command     Pid   Tid   Shared Object              Symbol
27.04%    BusyThread  5703  5729  /system/lib64/libart.so    art::JniMethodStart(art::Thread*)
25.87%    BusyThread  5703  5729  /system/lib64/libc.so      long StrToI<long, ...
...
```

`report.py` 在 stdio 界面中报告性能分析数据. 如果报告中有许多未知符号, 请检查此处.

```bash
# 在 html 界面中报告 perf.data. 
$ ./report_html.py

# 添加源代码和反汇编. 如果 source_dirs 路径不正确, 请进行更改. 
$ ./report_html.py --add_source_code --source_dirs path_of_SimpleperfExampleCpp --add_disassembly
```

`report_html.py` 会在 `report.html` 中生成报告, 并弹出浏览器标签页显示它.

### 记录和报告调用图

我们可以按如下步骤记录和报告调用图.

```bash
# 记录基于 DWARF 的调用图: 在 -r 选项中添加 "-g". 
$ ./app_profiler.py -p simpleperf.example.cpp -r "-e task-clock:u -f 1000 --duration 10 -g" -lib path_of_SimpleperfExampleCpp

# 记录基于栈帧的调用图: 在 -r 选项中添加 "--call-graph fp". 
$ ./app_profiler.py -p simpleperf.example.cpp -r "-e task-clock:u -f 1000 --duration 10 --call-graph fp" \
        -lib path_of_SimpleperfExampleCpp

# 在 stdio 界面中报告调用图. 
$ ./report.py -g

# 在 Python Tk 界面中报告调用图. 
$ ./report.py -g --gui

# 在 html 界面中报告调用图. 
$ ./report_html.py

# 在 flamegraphs 中报告调用图. 
# 在 Windows 上, 使用 inferno.bat 而不是 ./inferno.sh. 
$ ./inferno.sh -sc
```

### 通过网页接口进行报告

我们可以使用 report_html.py 在网页浏览器中显示性能分析结果. report_html.py 集成了图表统计, 样本表, 火焰图, 源代码注释和反汇编注释. 它是显示报告的推荐方式.

```bash
./report_html.py
```

### 展示火焰图

要显示火焰图, 我们需要先记录调用图. 火焰图可以在 report_html.py 的 "Flamegraph" 标签中显示. 我们也可以使用 inferno 直接显示火焰图.

```bash
# 在 Windows 上, 使用 inferno.bat 而不是 ./inferno.sh. 
$ ./inferno.sh -sc
```

我们还可以使用 [FlameGraph](https://github.com/brendangregg/FlameGraph) 来生成火焰图. 请确保已安装 Perl.

```bash
git clone https://github.com/brendangregg/FlameGraph.git
./report_sample.py --symfs binary_cache > out.perf
FlameGraph/stackcollapse-perf.pl out.perf > out.folded
FlameGraph/flamegraph.pl out.folded > a.svg
```

### 在 Android Studio 中进行报告

simpleperf 的 `report-sample` 命令可以将 `perf.data` 转换为 Android Studio CPU 分析器接受的 protobuf 格式. 转换可以在设备上或主机上完成. 如果在主机上有更多符号信息, 建议使用 `--symdir` 选项在主机上进行转换.

```bash
$ simpleperf report-sample --protobuf --show-callchain -i perf.data -o perf.trace
# 然后在 Android Studio 中打开 perf.trace 进行查看. 
```

### 去混淆 Java 符号

Java 符号可能会被 ProGuard 混淆. 要在报告中恢复原始符号, 可以通过 `--proguard-mapping-file` 将 ProGuard 映射文件传递给 report 脚本或 `report-sample` 命令.

```bash
./report_html.py --proguard-mapping-file proguard_mapping_file.txt
```

### 记录 CPU 时间和非 CPU 时间

我们可以记录 CPU 时间和非 CPU 时间.

首先检查设备是否支持 `trace-offcpu` 功能.

```bash
$ ./run_simpleperf_on_device.py list --show-features
dwarf-based-call-graph
trace-offcpu
```

如果支持 trace-offcpu 功能, 它会显示在功能列表中. 然后我们可以尝试使用它.

```bash
./app_profiler.py -p simpleperf.example.cpp -a .SleepActivity -r "-g -e task-clock:u -f 1000 --duration 10 --trace-offcpu" -lib path_of_SimpleperfExampleCpp
./report_html.py --add_disassembly --add_source_code --source_dirs path_of_SimpleperfExampleCpp
```

### 从启动开始分析

我们可以从应用程序启动时进行分析.

```bash
# 开始 simpleperf 录制, 然后启动要分析的 Activity. 
$ ./app_profiler.py -p simpleperf.example.cpp -a .MainActivity
```

我们也可以在设备上手动启动 Activity.

1. 确保应用程序没有运行或不是最近的应用程序之一.
2. 开始 simpleperf 录制.

    ```bash
    ./app_profiler.py -p simpleperf.example.cpp
    ```

3. 在设备上手动启动应用程序.

### 在应用程序代码中控制记录

Simpleperf 支持从应用程序代码中控制记录. 以下是工作流程:

1. 运行 `api_profiler.py prepare -p <package_name>` 以允许应用程序使用 simpleperf 记录自身. 默认情况下, 权限在设备重启后会被重置. 因此, 我们需要在每次设备重启后运行该脚本. 但是在 Android >= 13 上, 我们可以使用 `--days` 选项设置权限持续的天数.
2. 在应用程序中链接 simpleperf app_api 代码. 应用程序需要设置为 debuggable 或 profileableFromShell, 如 [Prepare an Android application](https://android.googlesource.com/platform/system/extras/+/main/simpleperf/doc/android_application_profiling.md#prepare-an-android-application) 所述. 然后, 应用程序可以使用 API 来开始/暂停/恢复/停止记录. 为了开始记录, app_api 会 fork 一个运行 simpleperf 的子进程, 并使用管道文件向子进程发送命令. 记录完成后, 会生成一个分析数据文件.
3. 运行 `api_profiler.py collect -p <package_name>` 将分析数据文件收集到主机.

示例可以在 demo 中的 CppApi 和 JavaApi 找到.

### 手动解析性能分析数据

我们也可以通过编写 Python 脚本来手动解析分析数据, 通过使用 [`simpleperf_report_lib.py`](https://android.googlesource.com/platform/system/extras/+/main/simpleperf/doc/scripts_reference.md#simpleperf_report_libpy) 库. 示例包括 `report_sample.py` 和`report_html.py`.

## 查看分析结果

使用 `simpleperf record` 或 `app_profiler.py` 后, 我们会得到一个分析数据文件. 该文件包含一个样本列表. 每个样本都有时间戳、线程 ID、调用栈、在此样本中使用的事件（如 cpu-cycles 或 cpu-clock）等. 我们有多种查看分析结果的选择. 我们可以按时间顺序显示样本, 或者显示聚合的火焰图. 我们可以以文本格式显示报告, 或者在一些交互式 UI 中显示报告.

以下是一些推荐的查看分析结果的 UI. Google 开发者可以在 go/gmm-profiling 中找到更多示例.

- Continuous PProf UI (great flamegraph UI, but only available internally)
- Firefox Profiler (great chronological UI)
- FlameScope (great jank-finding UI)
- Differential FlameGraph
- Android Studio Profiler
- Simpleperf HTML Report
- PProf Interactive Command Line
- Simpleperf Report Command Line
- Custom Report Interface

### Android Studio Profiler

Android Studio Profiler 支持记录和报告应用进程的分析数据. 它支持几种记录方法, 包括使用 simpleperf 作为后端的方法. 您可以使用 Android Studio Profiler 进行记录和报告.

在 Android Studio 中: Open View -> Tool Windows -> Profiler -> Click + -> Your Device -> Profileable Processes -> Your App

点击 "CPU" 图表

选择 Callstack Sample Recording. 即使您使用 Java, 这也能提供更好的可观察性, 包括 ART、malloc 和内核.

点击 Record, 在设备上运行您的测试, 完成后点击 Stop.

点击一个线程轨迹, 并选择 "Flame Chart" 以在左侧查看按时间顺序排列的图表, 在右侧查看聚合的火焰图:

如果您希望在记录选项上有更多灵活性, 或希望添加 proguard 映射文件, 可以使用 simpleperf 进行记录, 并使用 Android Studio Profiler 进行报告.

我们可以使用 `simpleperf report-sample` 将 `perf.data` 转换为 Android Studio Profiler 的跟踪文件.

```bash
# 将 perf.data 转换为 Android Studio Profiler 的 perf.trace 文件. 
# 如果在 Mac/Windows 上, 使用相应平台的 simpleperf 主机可执行文件. 
bin/linux/x86_64/simpleperf report-sample --show-callchain --protobuf -i perf.data -o perf.trace

# 使用 proguard 映射文件将 perf.data 转换为 perf.trace. 
bin/linux/x86_64/simpleperf report-sample --show-callchain --protobuf -i perf.data -o perf.trace \
    --proguard-mapping-file proguard.map
```

在 Android Studio 中: 打开 File -> Open -> 选择 perf.trace

---

在原文 [View the profile](https://android.googlesource.com/platform/system/extras/+/main/simpleperf/doc/view_the_profile.md) 查看更多 UI 的介绍和用法.
