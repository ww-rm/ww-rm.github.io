---
title: Simpleperf 三部曲 (三)
categories:
  - "阅读笔记"
tags:
  - "Simpleperf"
  - "Android"
  - "安卓性能分析"
date: 2024-07-07 23:38:45
---

本文是对性能分析工具 [Simpleperf](https://android.googlesource.com/platform/system/extras/+/main/simpleperf/doc/README.md) 使用文档总结, 也可以看作是文档翻译.

本篇原文见 [Scripts reference](https://android.googlesource.com/platform/system/extras/+/main/simpleperf/doc/scripts_reference.md).

<!-- more -->

## 记录分析数据

### app_profiler.py

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

### 从应用程序启动时进行分析

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

### binary_cache_builder.py

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

### run_simpleperf_on_device.py

这个脚本将 simpleperf 可执行文件推送到设备上, 并在设备上运行 simpleperf 命令. 它比手动运行 adb 命令更方便.

## 查看分析数据

本节中的脚本用于查看分析结果或将分析数据转换为外部 UI 使用的格式. 有关推荐的 UI, 请参见 view_the_profile.md.

### report.py

`report.py` 是主机上 report 命令的包装器. 它接受 report 命令的所有选项.

```bash
# 报告调用图
$ ./report.py -g

# 在由 Python Tk 实现的 GUI 窗口中报告调用图
$ ./report.py -g --gui
```

### report_html.py

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

### inferno

inferno 是一个用于在 HTML 文件中生成火焰图的工具.

```bash
# 基于 perf.data 生成火焰图. 
# 在 Windows 上, 使用 inferno.bat 代替 ./inferno.sh. 
$ ./inferno.sh -sc --record_file perf.data

# 记录一个本地程序并生成火焰图. 
$ ./inferno.sh -np surfaceflinger
```

### purgatorio

purgatorio 是一个可视化工具, 用于按时间顺序显示样本.

### pprof_proto_generator.py

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

### gecko_profile_generator.py

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

### report_sample.py

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

### stackcollapse.py

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

## 一些工具库

### simpleperf_report_lib.py

simpleperf_report_lib.py 是一个用于解析由 record 命令生成的分析数据文件的 Python 库. 内部它使用 libsimpleperf_report.so 来完成工作. 通常, 对于每个分析数据文件, 我们创建一个 ReportLib 实例, 传递文件路径 (通过 SetRecordFile) . 然后我们可以通过 GetNextSample() 读取所有样本. 对于每个样本, 我们可以读取其事件信息 (通过 GetEventOfCurrentSample) , 符号信息 (通过 GetSymbolOfCurrentSample) 和调用链信息 (通过 GetCallChainOfCurrentSample) . 我们还可以获取一些全局信息, 如记录选项 (通过 GetRecordCmd) , 设备架构 (通过 GetArch) 和元信息字符串 (通过 MetaInfo) .

使用 simpleperf_report_lib.py 的示例可以在 report_sample.py, report_html.py, pprof_proto_generator.py 和 inferno/inferno.py 中找到.

### ipc.py

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

### sample_filter.py

sample_filter.py 根据 [sample_filter.md](https://android.googlesource.com/platform/system/extras/+/refs/heads/main/simpleperf/doc/sample_filter.md) 中的文档生成样本过滤器文件. 运行报告脚本时, 可以通过 `--filter-file` 选项传递过滤器文件.

例如, 它可以用于将一个大型记录文件拆分为多个报告文件.

```bash
$ sample_filter.py -i perf.data --split-time-range 2 -o sample_filter
$ gecko_profile_generator.py -i perf.data --filter-file sample_filter_part1 \
    | gzip >profile-part1.json.gz
$ gecko_profile_generator.py -i perf.data --filter-file sample_filter_part2 \
    | gzip >profile-part2.json.gz
```
