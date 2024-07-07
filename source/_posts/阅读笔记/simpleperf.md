---
title: Simpleperf 使用指南
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

## 可执行命令参考

原文见 [Executable commands reference](https://android.googlesource.com/platform/system/extras/+/main/simpleperf/doc/executable_commands_reference.md).

### Simpleperf 是如何工作的

现代 CPU 有一个名为性能监控单元 (PMU) 的硬件组件. PMU有几个硬件计数器, 用于计数诸如发生了多少CPU周期, 执行了多少指令或发生了多少缓存未命中等事件.

Linux 内核将这些硬件计数器封装成硬件性能事件. 此外, Linux 内核还提供与硬件无关的软件事件和跟踪点事件. Linux 内核通过 `perf_event_open` 系统调用将所有事件暴露给用户空间, 这个调用被 simpleperf 使用.

Simpleperf 有三个主要命令: `stat`, `record` 和 `report`.

`stat` 命令总结在一段时间内被分析的进程中发生的事件数量. 其工作原理如下:

- 根据用户选项, simpleperf 通过对内核进行系统调用来启用分析.
- 在分析的进程运行时, 内核启用计数器.
- 分析结束后, simpleperf 从内核读取计数器, 并报告计数器摘要.

`record` 命令在一段时间内记录被分析进程的样本. 其工作原理如下:

- 根据用户选项, simpleperf 通过对内核进行系统调用来启用分析.
- Simpleperf 在 simpleperf 和内核之间创建映射缓冲区.
- 在分析的进程运行时, 内核启用计数器.
- 每当发生一定数量的事件时, 内核将样本转储到映射缓冲区.
- Simpleperf 从映射缓冲区读取样本, 并将分析数据存储在名为`perf.data`的文件中.

`report` 命令读取 `perf.data` 文件和任何被分析进程使用的共享库, 并输出显示时间花费在哪些地方的报告.

Simpleperf 支持以下几个命令:

- `debug-unwind` 命令: 调试/测试基于 DWARF 的离线展开, 用于调试 simpleperf.
- `dump` 命令: 转储 `perf.data` 中的内容, 用于调试 simpleperf.
- `help` 命令: 打印其他命令的帮助信息.
- `kmem` 命令: 收集内核内存分配信息 (将被Python脚本替代) .
- `list` 命令: 列出 Android 设备上支持的所有事件类型.
- `record` 命令: 分析进程并将分析数据存储在 `perf.data` 中.
- `report` 命令: 报告 `perf.data` 中的分析数据.
- `report-sample` 命令: 报告 `perf.data` 中的每个样本, 用于支持 simpleperf 在 Android Studio 中的集成.
- `stat` 命令: 分析进程并打印计数器摘要.

每个命令支持不同的选项, 可以通过帮助信息查看.

```bash
# 列出所有命令. 
$ simpleperf --help

# 打印 record 命令的帮助信息. 
$ simpleperf record --help
```

以下描述了最常用的命令, 分别是 list, stat, record 和 report.

### list

这个命令列出了设备上所有可用的事件列表. 不同的设备可能支持不同的事件, 因为它们具有不同的硬件和内核.

```bash
$ simpleperf list
List of hw-cache events:
  branch-loads
  ...
List of hardware events:
  cpu-cycles
  instructions
  ...
List of software events:
  cpu-clock
  task-clock
  ...
```

在 ARM/ARM64 架构上, `list` 命令还显示了一组原始事件列表, 这些事件是设备上 ARM 性能监视器单元 (PMU) 支持的事件. 内核已经将其中的一部分包装成了硬件事件和硬件缓存事件. 例如, `raw-cpu-cycles` 被包装成了 `cpu-cycles`, `raw-instruction-retired` 被包装成了`instructions`. 原始事件的提供是为了在我们希望使用设备上支持的某些事件时, 但不幸的是内核没有将其包装成硬件事件时使用.

### stat

stat 命令用于获取被分析进程的事件计数器值. 通过传递选项, 我们可以选择使用哪些事件, 监控哪些进程/线程, 监控多长时间以及打印间隔.

```bash
# Stat using default events (cpu-cycles,instructions,...), and monitor process 7394 for 10 seconds.
$ simpleperf stat -p 7394 --duration 10
Performance counter statistics:

#         count  event_name                # count / runtime
     16,513,564  cpu-cycles                # 1.612904 GHz
      4,564,133  stalled-cycles-frontend   # 341.490 M/sec
      6,520,383  stalled-cycles-backend    # 591.666 M/sec
      4,900,403  instructions              # 612.859 M/sec
         47,821  branch-misses             # 6.085 M/sec
  25.274251(ms)  task-clock                # 0.002520 cpus used
              4  context-switches          # 158.264 /sec
            466  page-faults               # 18.438 K/sec

Total test time: 10.027923 seconds.
```

#### 选择要统计的事件

我们可以通过 `-e` 选项选择要使用的事件 (event).

```bash
# Stat event cpu-cycles.
$ simpleperf stat -e cpu-cycles -p 11904 --duration 10

# Stat event cache-references and cache-misses.
$ simpleperf stat -e cache-references,cache-misses -p 11904 --duration 10
```

当运行 stat 命令时, 如果硬件事件的数量大于 PMU 可用的硬件计数器数量, 内核会在事件之间共享硬件计数器, 因此每个事件仅在总时间的一部分被监控. 结果, 显示的事件数量小于实际发生的事件数量. 以下是一个示例.

```bash
# Stat using event cache-references, cache-references:u,....
$ simpleperf stat -p 7394 -e cache-references,cache-references:u,cache-references:k \
      -e cache-misses,cache-misses:u,cache-misses:k,instructions --duration 1
Performance counter statistics:

#   count  event_name           # count / runtime
  490,713  cache-references     # 151.682 M/sec
  899,652  cache-references:u   # 130.152 M/sec
  855,218  cache-references:k   # 111.356 M/sec
   61,602  cache-misses         # 7.710 M/sec
   33,282  cache-misses:u       # 5.050 M/sec
   11,662  cache-misses:k       # 4.478 M/sec
        0  instructions         #

Total test time: 1.000867 seconds.
simpleperf W cmd_stat.cpp:946] It seems the number of hardware events are more than the number of
available CPU PMU hardware counters. That will trigger hardware counter
multiplexing. As a result, events are not counted all the time processes
running, and event counts are smaller than what really happens.
Use --print-hw-counter to show available hardware counters.
```

在上述示例中, 我们监控了 7 个事件. 每个事件仅在总时间的一部分被监控. 因为 `cache-references` 的数量小于 `cache-references:u` (仅在用户空间的 `cache-references`) 和 `cache-references:k` (仅在内核中的 `cache-references`) . 指令数为零. 在打印结果后, simpleperf 会检查 CPU 是否有足够的硬件计数器来同时计数硬件事件. 如果没有, 它会打印一个警告.

为了避免硬件计数器复用, 我们可以使用 `simpleperf stat --print-hw-counter` 来显示每个 CPU 上的可用计数器. 然后不要监控比可用计数器更多的硬件事件.

```bash
$ simpleperf stat --print-hw-counter
There are 2 CPU PMU hardware counters available on cpu 0.
There are 2 CPU PMU hardware counters available on cpu 1.
There are 2 CPU PMU hardware counters available on cpu 2.
There are 2 CPU PMU hardware counters available on cpu 3.
There are 2 CPU PMU hardware counters available on cpu 4.
There are 2 CPU PMU hardware counters available on cpu 5.
There are 2 CPU PMU hardware counters available on cpu 6.
There are 2 CPU PMU hardware counters available on cpu 7.
```

当发生计数器复用时, 无法保证哪些事件在何时被监控. 如果我们希望确保某些事件始终同时被监控, 我们可以使用 `--group` 选项.

```bash
# Stat using event cache-references, cache-references:u,....
$ simpleperf stat -p 7964 --group cache-references,cache-misses \
      --group cache-references:u,cache-misses:u --group cache-references:k,cache-misses:k \
      --duration 1
Performance counter statistics:

#     count  event_name           # count / runtime
  2,088,463  cache-references     # 181.360 M/sec
     47,871  cache-misses         # 2.292164% miss rate
  1,277,600  cache-references:u   # 136.419 M/sec
     25,977  cache-misses:u       # 2.033265% miss rate
    326,305  cache-references:k   # 74.724 M/sec
     13,596  cache-misses:k       # 4.166654% miss rate

Total test time: 1.029729 seconds.
simpleperf W cmd_stat.cpp:946] It seems the number of hardware events are more than the number of
...
```

#### 选择要统计的目标

我们可以通过 `-p` 或`-t` 选项选择要监控的进程或线程. 监控一个进程相当于监控该进程中的所有线程. Simpleperf 还可以派生一个子进程来运行新命令, 然后监控该子进程.

```bash
# 统计进程 11904 和 11905.
$ simpleperf stat -p 11904,11905 --duration 10

# 统计名字里包含 "chrome" 的进程.
$ simpleperf stat -p chrome --duration 10

# 正则表达式统计进程名.
$ simpleperf stat -p "chrome:(privileged|sandboxed)" --duration 10

# 统计线程 11904 和 11905.
$ simpleperf stat -t 11904,11905 --duration 10

# 开启子进程 ls 并进行统计.
$ simpleperf stat ls

# 统计安卓应用, 在非 root 设备上, 只能统计 debuggable
# 或者 profileable from shell 的应用.
$ simpleperf stat --app simpleperf.example.cpp --duration 10

# 仅统计应用的某个线程.
$ simpleperf stat --app simpleperf.example.cpp -t 11904 --duration 10

# 使用 -a 进行系统范围的统计.
$ simpleperf stat -a --duration 10
```

#### 决定统计的时长

在监控现有线程时, 我们可以使用 `--duration` 选项来决定监控的时长. 在监控运行新命令的子进程时, simpleperf 会一直监控直到子进程结束. 在这种情况下, 我们可以随时使用 Ctrl-C 来停止监控.

```bash
# Stat process 11904 for 10 seconds.
$ simpleperf stat -p 11904 --duration 10

# Stat until the child process running `ls` finishes.
$ simpleperf stat ls

# Stop monitoring using Ctrl-C.
$ simpleperf stat -p 11904 --duration 10
^C
```

如果您希望编写脚本来控制监控时长, 可以向 simpleperf 发送 `SIGINT`, `SIGTERM` 或 `SIGHUP` 信号来停止监控.

---

更多内容见 [The stat command](https://android.googlesource.com/platform/system/extras/+/main/simpleperf/doc/executable_commands_reference.md#the-stat-command).

### record

record 命令用于转储被分析进程的样本. 每个样本可以包含生成样本的时间, 自上次样本以来的事件数量, 线程的程序计数器, 线程的调用链等信息.

通过传递选项, 我们可以选择使用哪些事件, 监控哪些进程/线程, 转储样本的频率, 监控多长时间, 以及存储样本的位置.

```bash
# Record on process 7394 for 10 seconds, using default event (cpu-cycles), 
# using default sample frequency (4000 samples per second),
# writing records to perf.data.
$ simpleperf record -p 7394 --duration 10
simpleperf I cmd_record.cpp:316] Samples recorded: 21430. Samples lost: 0.
```

#### 选择要记录的事件

默认情况下, 使用 `cpu-cycles` 事件来评估消耗的 CPU 周期. 但我们也可以通过 `-e` 选项使用其他事件.

```bash
# Record using event instructions.
$ simpleperf record -e instructions -p 11904 --duration 10

# Record using task-clock, which shows the passed CPU time in nanoseconds.
$ simpleperf record -e task-clock -p 11904 --duration 10
```

#### 选择要记录的目标

`record` 命令中选择目标的方式类似于 `stat` 命令.

```bash
# Record process 11904 and 11905.
$ simpleperf record -p 11904,11905 --duration 10

# Record processes with name containing "chrome".
$ simpleperf record -p chrome --duration 10
# Record processes with name containing part matching regex "chrome:(privileged|sandboxed)".
$ simpleperf record -p "chrome:(privileged|sandboxed)" --duration 10

# Record thread 11904 and 11905.
$ simpleperf record -t 11904,11905 --duration 10

# Record a child process running `ls`.
$ simpleperf record ls

# Record the process of an Android application. On non-root devices, this only works for debuggable
# or profileable from shell apps.
$ simpleperf record --app simpleperf.example.cpp --duration 10

# Record only selected thread 11904 in an app.
$ simpleperf record --app simpleperf.example.cpp -t 11904 --duration 10

# Record system wide.
$ simpleperf record -a --duration 10
```

#### 设置记录频率

我们可以通过 `-f` 或 `-c` 选项设置转储记录的频率. 例如, `-f 4000` 表示在监控的线程运行时, 每秒钟大约转储 4000 条记录. 如果一个监控的线程在一秒钟内运行了 0.2 秒 (在其他时间它可能被抢占或阻塞) , simpleperf 每秒钟大约转储 4000 * 0.2 / 1.0 = 800 条记录. 另一种方式是使用 `-c`. 例如, `-c 10000` 表示每当发生 10000 个事件时转储一条记录.

```bash
# 使用采样频率 1000 进行记录: 每秒运行采样 1000 次. 
$ simpleperf record -f 1000 -p 11904,11905 --duration 10

# 使用采样周期 100000 进行记录: 每 100000 个事件采样一次. 
$ simpleperf record -c 100000 -t 11904,11905 --duration 10
```

为了避免生成样本花费过多时间, kernel >= 3.10 设置了用于生成样本的最大 CPU 时间百分比 (默认是 25%) , 并在达到该限制时降低允许的最大采样频率. simpleperf 使用 `--cpu-percent` 选项来调整它, 但这需要 root 权限或运行 Android >= Q.

```bash
# 使用采样频率 10000 进行记录, 允许的最大 CPU 使用率为 50%. 
$ simpleperf record -f 1000 -p 11904,11905 --duration 10 --cpu-percent 50
```

#### 决定记录的时长

与 `stat` 类似, 也可以通过 `--duration` 来控制记录时长.

#### 设置存储分析数据的路径

默认情况下, simpleperf 将分析数据存储在当前目录的 `perf.data` 文件中. 但可以使用 `-o` 选项更改存储路径.

```bash
# Write records to data/perf2.data.
$ simpleperf record -p 11904 -o data/perf2.data --duration 10
```

#### 记录调用图

调用图是显示函数调用关系的树结构. 以下是一个示例.

```plain
main() {
    FunctionOne();
    FunctionTwo();
}
FunctionOne() {
    FunctionTwo();
    FunctionThree();
}
a call graph:
    main-> FunctionOne
       |    |
       |    |-> FunctionTwo
       |    |-> FunctionThree
       |
       |-> FunctionTwo
```

调用图显示了一个函数如何调用其他函数, 反向调用图则显示一个函数如何被其他函数调用. 要显示调用图, 我们首先需要记录它, 然后再报告它.

有两种记录调用图的方法, 一种是记录基于 dwarf 的调用图, 另一种是记录基于栈帧的调用图. 记录基于 dwarf 的调用图需要本地二进制文件中的调试信息支持. 而记录基于栈帧的调用图则需要栈帧寄存器的支持.

```bash
# 记录基于 dwarf 的调用图
$ simpleperf record -p 11904 -g --duration 10

# 记录基于栈帧的调用图
$ simpleperf record -p 11904 --call-graph fp --duration 10
```

#### 记录 CPU 时间和非 CPU 时间

Simpleperf 是一个 CPU 分析器, 它只在线程运行在 CPU 上时生成样本. 但有时我们想知道线程在 CPU 外的时间是如何花费的 (例如, 被其他线程抢占, 在 IO 中阻塞或等待某些事件) . 为支持这一点, simpleperf 在 `record` 命令中添加了 `--trace-offcpu` 选项. 当使用 `--trace-offcpu` 时, simpleperf 会执行以下操作:

1. 仅允许 `cpu-clock``/task-clock` 事件与 `--trace-offcpu` 一起使用, 这使得 simpleperf 为 `cpu-clock` 事件生成 on-cpu 样本.
2. Simpleperf 还监控 `sched:sched_switch` 事件, 每次监控的线程从 CPU 上调度时会生成一个 sched_switch 样本.
3. Simpleperf 还记录上下文切换记录, 因此它知道线程何时被调度回 CPU.

simpleperf 为线程收集的样本和上下文切换记录如下所示:

![simpleperf_trace_offcpu_sample_mode][simpleperf_trace_offcpu_sample_mode]

这里有两种类型的样本:

1. 为 cpu-clock 事件生成的 on-cpu 样本. 每个样本中的周期值表示在 CPU 上花费了多少纳秒 (针对该样本的调用链) .
2. 为 sched:sched_switch 事件生成的 off-cpu (sched_switch) 样本. 周期值由 simpleperf 计算为下一个 switch on 记录的时间戳减去当前样本的时间戳. 因此, 每个样本中的周期值表示在 CPU 外花费了多少纳秒 (针对该样本的调用链) .

注意: 实际上, switch on 记录和样本可能会丢失. 为了减轻精度损失, 我们计算一个 off-cpu 样本的周期为下一个 switch on 记录或样本的时间戳减去当前样本的时间戳.

通过 Python 脚本报告时, `simpleperf_report_lib.py` 提供 `SetTraceOffCpuMode()` 方法来控制如何报告样本:

1. on-cpu 模式: 仅报告 on-cpu 样本.
2. off-cpu 模式: 仅报告 off-cpu 样本.
3. on-off-cpu 模式: 报告 on-cpu 和 off-cpu 样本, 可以按事件名称分开.
4. mixed-on-off-cpu 模式: 在相同事件名称下报告 on-cpu 和 off-cpu 样本.

如果未设置, 将使用 mixed-on-off-cpu 模式进行报告.

使用 `report_html.py`, `inferno` 和 `report_sample.py` 时, 可以通过 `--trace-offcpu` 选项设置报告模式.

以下是一些记录和报告 trace offcpu 配置文件的示例.

```bash
# Check if --trace-offcpu is supported by the kernel (should be available on kernel >= 4.2).
$ simpleperf list --show-features
trace-offcpu
...

# Record with --trace-offcpu.
$ simpleperf record -g -p 11904 --duration 10 --trace-offcpu -e cpu-clock

# Record system wide with --trace-offcpu.
$ simpleperf record -a -g --duration 3 --trace-offcpu -e cpu-clock

# Record with --trace-offcpu using app_profiler.py.
$ ./app_profiler.py -p com.google.samples.apps.sunflower \
    -r "-g -e cpu-clock:u --duration 10 --trace-offcpu"

# Report on-cpu samples.
$ ./report_html.py --trace-offcpu on-cpu
# Report off-cpu samples.
$ ./report_html.py --trace-offcpu off-cpu
# Report on-cpu and off-cpu samples under different event names.
$ ./report_html.py --trace-offcpu on-off-cpu
# Report on-cpu and off-cpu samples under the same event name.
$ ./report_html.py --trace-offcpu mixed-on-off-cpu
```

### report

report 命令用于报告由 record 命令生成的分析数据. 报告包含一个样本条目表, 每个样本条目是报告中的一行. report 命令将属于同一进程, 线程, 库, 函数的样本分组到同一个样本条目中. 然后根据样本条目的事件计数对样本条目进行排序.

通过传递选项, 我们可以决定如何过滤掉不感兴趣的样本, 如何将样本分组到样本条目中, 以及在哪里查找分析数据和二进制文件.

下面是一个示例. 记录被分组为 4 个样本条目, 每个条目是一行. 有几列, 每列显示属于样本条目的一部分信息. 第一列是 Overhead, 显示当前样本条目中事件占总事件的百分比. 由于 perf 事件是 cpu-cycles, overhead 是每个函数使用的 CPU 周期的百分比.

```bash
# Reports perf.data, using only records sampled in libsudo-game-jni.so, grouping records using
# thread name(comm), process id(pid), thread id(tid), function name(symbol), and showing sample
# count for each row.
$ simpleperf report --dsos /data/app/com.example.sudogame-2/lib/arm64/libsudo-game-jni.so \
      --sort comm,pid,tid,symbol -n
Cmdline: /data/data/com.example.sudogame/simpleperf record -p 7394 --duration 10
Arch: arm64
Event: cpu-cycles (type 0, config 0)
Samples: 28235
Event count: 546356211

Overhead  Sample  Command    Pid   Tid   Symbol
59.25%    16680   sudogame  7394  7394  checkValid(Board const&, int, int)
20.42%    5620    sudogame  7394  7394  canFindSolution_r(Board&, int, int)
13.82%    4088    sudogame  7394  7394  randomBlock_r(Board&, int, int, int, int, int)
6.24%     1756    sudogame  7394  7394  @plt
```

#### 设置读取分析数据的路径

默认情况下, report 命令从当前目录的 perf.data 文件中读取分析数据. 但可以使用 `-i` 选项更改读取路径.

```bash
simpleperf report -i data/perf2.data
```

#### 设置查找二进制文件的路径

为了报告函数符号, simpleperf 需要读取被监控进程使用的可执行二进制文件以获取符号表和调试信息. 默认情况下, 路径是记录时被监控进程使用的可执行二进制文件. 然而, 这些二进制文件在报告时可能不存在或不包含符号表和调试信息. 因此, 我们可以使用 `--symfs` 选项重定向路径.

```bash
# In this case, when simpleperf wants to read executable binary /A/b, it reads file in /A/b.
$ simpleperf report

# In this case, when simpleperf wants to read executable binary /A/b, it prefers file in
# /debug_dir/A/b to file in /A/b.
$ simpleperf report --symfs /debug_dir

# Read symbols for system libraries built locally. Note that this is not needed since Android O,
# which ships symbols for system libraries on device.
$ simpleperf report --symfs $ANDROID_PRODUCT_OUT/symbols
```

#### 报告调用图

要报告调用图, 请确保分析数据是带有调用图记录的, 如 [Record call graphs](https://android.googlesource.com/platform/system/extras/+/main/simpleperf/doc/executable_commands_reference.md#record-call-graphs) 所示.

---

更多详细内容见 [The record command](https://android.googlesource.com/platform/system/extras/+/main/simpleperf/doc/executable_commands_reference.md#the-record-command).

## 脚本参考

### 记录分析数据

#### app_profiler.py

`app_profiler.py` 用于记录 Android 应用程序和本地可执行文件的分析数据.

```bash
# 记录一个 Android 应用程序. 
$ ./app_profiler.py -p simpleperf.example.cpp

# 记录包含编译成本地指令的 Java 代码的 Android 应用程序. 
$ ./app_profiler.py -p simpleperf.example.cpp --compile_java_code

# 记录一个 Android 应用程序的 Activity 启动. 
$ ./app_profiler.py -p simpleperf.example.cpp -a .SleepActivity

# 记录一个本地进程. 
$ ./app_profiler.py -np surfaceflinger

# 根据 pid 记录一个本地进程. 
$ ./app_profiler.py --pid 11324

# 记录一个命令. 
$ ./app_profiler.py -cmd \
    "dex2oat --dex-file=/data/local/tmp/app-debug.apk --oat-file=/data/local/tmp/a.oat"

# 记录一个 Android 应用程序, 并使用 -r 向 record 命令发送自定义选项. 
$ ./app_profiler.py -p simpleperf.example.cpp \
    -r "-e cpu-clock -g --duration 30"

# 记录 CPU 时间和非 CPU 时间. 
$ ./app_profiler.py -p simpleperf.example.cpp \
    -r "-e task-clock -g -f 1000 --duration 10 --trace-offcpu"

# 将分析数据保存到自定义文件 (如 perf_custom.data) 而不是 perf.data. 
$ ./app_profiler.py -p simpleperf.example.cpp -o perf_custom.data
```

#### 从应用程序启动时进行分析

有时我们想分析应用程序的启动时间. 为支持这一点, 我们在 record 命令中添加了 --app 选项. --app 选项设置要分析的 Android 应用程序的包名. 如果应用程序尚未运行, record 命令将以 1 毫秒的间隔轮询应用程序进程. 因此, 要从应用程序启动时开始分析, 我们可以先使用 --app 启动 record 命令, 然后再启动应用程序. 下面是一个示例.

```bash
$ ./run_simpleperf_on_device.py record --app simpleperf.example.cpp \
    -g --duration 1 -o /data/local/tmp/perf.data
# Start the app manually or using the `am` command.
```

为了方便使用, app_profiler.py 支持使用 `-a` 选项在记录开始后启动一个 Activity.

```bash
./app_profiler.py -p simpleperf.example.cpp -a .MainActivity
```

#### binary_cache_builder.py

`binary_cache` 目录是一个保存分析数据文件所需二进制文件的目录. 这些二进制文件应为未剥离版本, 包含调试信息和符号表. report 脚本使用 `binary_cache` 目录读取二进制文件的符号, `report_html.py` 也使用该目录生成带注释的源代码和反汇编代码.

默认情况下, `app_profiler.py` 在记录后构建 `binary_cache` 目录. 但我们也可以使用 `binary_cache_builder.py` 为现有的分析数据文件构建 `binary_cache`. 这在您直接使用 `simpleperf record` 进行系统范围的分析或在未连接 USB 线缆的情况下记录数据时非常有用.

`binary_cache_builder.py` 可以从 Android 设备中拉取二进制文件, 或在主机上的目录中查找二进制文件 (通过 -lib 选项) .

```bash
# Generate binary_cache for perf.data, by pulling binaries from the device.
$ ./binary_cache_builder.py

# Generate binary_cache, by pulling binaries from the device and finding binaries in
# SimpleperfExampleCpp.
$ ./binary_cache_builder.py -lib path_of_SimpleperfExampleCpp
```

#### run_simpleperf_on_device.py

这个脚本将 simpleperf 可执行文件推送到设备上, 并在设备上运行 simpleperf 命令. 它比手动运行 adb 命令更方便.

### 查看分析数据

本节中的脚本用于查看分析结果或将分析数据转换为外部 UI 使用的格式. 有关推荐的 UI, 请参见 view_the_profile.md.

#### report.py

`report.py` 是主机上 report 命令的包装器. 它接受 report 命令的所有选项.

```bash
# 报告调用图
$ ./report.py -g

# 在由 Python Tk 实现的 GUI 窗口中报告调用图
$ ./report.py -g --gui
```

#### report_html.py

`report_html.py` 根据分析数据生成 `report.html`. 然后 `report.html` 可以在不依赖其他文件的情况下显示分析结果. 因此, 它可以在本地浏览器中显示或传输到其他机器上. 根据使用的命令行选项, `report.html` 的内容可以包括: 图表统计, 样本表, 火焰图, 每个函数的注释源代码, 每个函数的注释反汇编.

```bash
# 基于 perf.data 生成图表统计, 样本表和火焰图. 
$ ./report_html.py

# 添加源代码. 
$ ./report_html.py --add_source_code --source_dirs path_of_SimpleperfExampleCpp

# 添加反汇编. 
$ ./report_html.py --add_disassembly

# 为所有二进制文件添加反汇编可能会花费很多时间. 因此, 我们可以选择仅为选定的二进制文件添加反汇编. 
$ ./report_html.py --add_disassembly --binary_filter libgame.so

# 为属于包名为 com.example.myapp 的应用程序的二进制文件添加反汇编和源代码. 
$ ./report_html.py --add_source_code --add_disassembly --binary_filter com.example.myapp

# report_html.py 接受多个记录数据文件. 
$ ./report_html.py -i perf1.data perf2.data
```

下面是为 SimpleperfExampleCpp 生成 html 分析结果的示例.

```bash
./app_profiler.py -p simpleperf.example.cpp
./report_html.py --add_source_code --source_dirs path_of_SimpleperfExampleCpp --add_disassembly
```

在浏览器中打开生成的 report.html 后, 有几个标签页:

第一个标签页是 "Chart Statistics". 您可以点击饼图以显示每个进程, 线程, 库和函数所消耗的时间.

第二个标签页是 "Sample Table". 它显示每个函数所花费的时间. 通过点击表格中的一行, 我们可以跳转到一个名为"Function"的新标签页.

第三个标签页是 "Flamegraph". 它显示了由 inferno 生成的图表.

第四个标签页是 "Function". 只有当用户点击 "Sample Table" 标签页中的一行时才会出现. 它显示一个函数的信息, 包括:

- 显示该函数调用的函数的火焰图.
- 显示调用该函数的函数的火焰图.
- 该函数的注释源代码. 只有在该函数有源代码文件时才会出现.
- 该函数的注释反汇编. 只有在包含该函数的二进制文件存在时才会出现.

#### inferno

inferno 是一个用于在 HTML 文件中生成火焰图的工具.

```bash
# 基于 perf.data 生成火焰图. 
# 在 Windows 上, 使用 inferno.bat 代替 ./inferno.sh. 
$ ./inferno.sh -sc --record_file perf.data

# 记录一个本地程序并生成火焰图. 
$ ./inferno.sh -np surfaceflinger
```

#### purgatorio

purgatorio 是一个可视化工具, 用于按时间顺序显示样本.

#### pprof_proto_generator.py

它将分析数据文件转换为 pprof.proto 格式, 该格式由 pprof 使用.

```bash
# 将当前目录中的 perf.data 转换为 pprof.proto 格式. 
$ ./pprof_proto_generator.py

# 以 PDF 格式显示报告. 
$ pprof -pdf pprof.profile

# 以 HTML 格式显示报告. 要显示反汇编, 添加 --tools 选项, 如: 
# --tools=objdump:<ndk_path>/toolchains/llvm/prebuilt/linux-x86_64/aarch64-linux-android/bin
# 要显示注释源代码或反汇编, 在视图菜单中选择 `top`, 点击一个函数并选择 `source` 或 `disassemble`. 
$ pprof -http=:8080 pprof.profile
```

#### gecko_profile_generator.py

将 perf.data 转换为 Gecko Profile 格式, 该格式可被 <https://profiler.firefox.com/> 读取.

Firefox Profiler 是一个功能强大的通用分析器 UI, 可以在任何浏览器 (不仅仅是 Firefox) 本地运行, 具有:

- 每线程轨迹
- 火焰图
- 搜索, 聚焦于特定的堆栈
- 时间序列视图, 以时间戳顺序查看样本
- 按线程和持续时间过滤

使用方法:

```bash
# 记录应用程序的分析数据
$ ./app_profiler.py -p simpleperf.example.cpp

# 转换并压缩. 
$ ./gecko_profile_generator.py -i perf.data | gzip > gecko-profile.json.gz
```

然后在 <https://profiler.firefox.com/> 中打开 gecko-profile.json.gz.

#### report_sample.py

report_sample.py 将分析数据文件转换为 linux-perf-tool 输出的 perf 脚本文本格式.

这种格式可以导入到:

- FlameGraph
- Flamescope
- Firefox Profiler, 但更推荐使用 gecko_profile_generator.py.
- Speedscope

```bash
# 将分析数据记录到 perf.data
$ ./app_profiler.py <args>

# 将当前目录中的 perf.data 转换为 FlameGraph 使用的格式. 
$ ./report_sample.py --symfs binary_cache >out.perf

$ git clone https://github.com/brendangregg/FlameGraph.git
$ FlameGraph/stackcollapse-perf.pl out.perf >out.folded
$ FlameGraph/flamegraph.pl out.folded >a.svg
```

#### stackcollapse.py

stackcollapse.py 将分析数据文件 (perf.data) 转换为 Brendan Gregg 的  "折叠堆栈"  格式.

折叠堆栈是以分号分隔的堆栈帧 (从根到叶) , 后跟在该堆栈中采样的事件计数的行, 例如:

```plaintext
BusyThread;__start_thread;__pthread_start(void*);java.lang.Thread.run 17889729
```

所有相似的堆栈都被聚合, 样本时间戳不被使用.

折叠堆栈格式可被以下工具读取:

- The FlameGraph toolkit
- Inferno (FlameGraph 的 Rust 移植版)
- Speedscope

示例:

```bash
# 将分析数据记录到 perf.data
$ ./app_profiler.py <args>

# 转换为折叠堆栈格式
$ ./stackcollapse.py --kernel --jit | gzip > profile.folded.gz

# 使用 FlameGraph 可视化 Java 堆栈和纳秒时间
$ git clone https://github.com/brendangregg/FlameGraph.git
$ gunzip -c profile.folded.gz \
    | FlameGraph/flamegraph.pl --color=java --countname=ns \
    > profile.svg
```

### 一些工具库

#### simpleperf_report_lib.py

simpleperf_report_lib.py 是一个用于解析由 record 命令生成的分析数据文件的 Python 库. 内部它使用 libsimpleperf_report.so 来完成工作. 通常, 对于每个分析数据文件, 我们创建一个 ReportLib 实例, 传递文件路径 (通过 SetRecordFile) . 然后我们可以通过 GetNextSample() 读取所有样本. 对于每个样本, 我们可以读取其事件信息 (通过 GetEventOfCurrentSample) , 符号信息 (通过 GetSymbolOfCurrentSample) 和调用链信息 (通过 GetCallChainOfCurrentSample) . 我们还可以获取一些全局信息, 如记录选项 (通过 GetRecordCmd) , 设备架构 (通过 GetArch) 和元信息字符串 (通过 MetaInfo) .

使用 simpleperf_report_lib.py 的示例可以在 report_sample.py, report_html.py, pprof_proto_generator.py 和 inferno/inferno.py 中找到.

#### ipc.py

ipc.py 捕获系统在指定持续时间内的每周期指令数 (IPC) .

示例:

```bash
./ipc.py
./ipc.py 2 20          # 设置间隔为2秒, 总持续时间为20秒
./ipc.py -p 284 -C 4   # 仅在核4上分析PID 284
./ipc.py -c 'sleep 5'  # 仅分析运行的命令
```

结果如下所示:

```plaintext
K_CYCLES   K_INSTR      IPC
36840      14138       0.38
70701      27743       0.39
104562     41350       0.40
138264     54916       0.40
```

#### sample_filter.py

sample_filter.py 根据 [sample_filter.md](https://android.googlesource.com/platform/system/extras/+/refs/heads/main/simpleperf/doc/sample_filter.md) 中的文档生成样本过滤器文件. 运行报告脚本时, 可以通过 `--filter-file` 选项传递过滤器文件.

例如, 它可以用于将一个大型记录文件拆分为多个报告文件.

```bash
$ sample_filter.py -i perf.data --split-time-range 2 -o sample_filter
$ gecko_profile_generator.py -i perf.data --filter-file sample_filter_part1 \
    | gzip >profile-part1.json.gz
$ gecko_profile_generator.py -i perf.data --filter-file sample_filter_part2 \
    | gzip >profile-part2.json.gz
```

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

[simpleperf_trace_offcpu_sample_mode]:data:image/png;base64,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
