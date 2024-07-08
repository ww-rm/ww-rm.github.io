---
title: Simpleperf 三部曲 (二)
categories:
  - "阅读笔记"
tags:
  - "Simpleperf"
  - "Android"
  - "安卓性能分析"
date: 2024-07-07 23:28:35
---

本文是对性能分析工具 [Simpleperf](https://android.googlesource.com/platform/system/extras/+/main/simpleperf/doc/README.md) 使用文档总结, 也可以看作是文档翻译.

本篇原文见 [Executable commands reference](https://android.googlesource.com/platform/system/extras/+/main/simpleperf/doc/executable_commands_reference.md).

<!-- more -->

## Simpleperf 是如何工作的

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

## list

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

## stat

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

### 选择要统计的事件

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

### 选择要统计的目标

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

### 决定统计的时长

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

## record

record 命令用于转储被分析进程的样本. 每个样本可以包含生成样本的时间, 自上次样本以来的事件数量, 线程的程序计数器, 线程的调用链等信息.

通过传递选项, 我们可以选择使用哪些事件, 监控哪些进程/线程, 转储样本的频率, 监控多长时间, 以及存储样本的位置.

```bash
# Record on process 7394 for 10 seconds, using default event (cpu-cycles), 
# using default sample frequency (4000 samples per second),
# writing records to perf.data.
$ simpleperf record -p 7394 --duration 10
simpleperf I cmd_record.cpp:316] Samples recorded: 21430. Samples lost: 0.
```

### 选择要记录的事件

默认情况下, 使用 `cpu-cycles` 事件来评估消耗的 CPU 周期. 但我们也可以通过 `-e` 选项使用其他事件.

```bash
# Record using event instructions.
$ simpleperf record -e instructions -p 11904 --duration 10

# Record using task-clock, which shows the passed CPU time in nanoseconds.
$ simpleperf record -e task-clock -p 11904 --duration 10
```

### 选择要记录的目标

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

### 设置记录频率

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

### 决定记录的时长

与 `stat` 类似, 也可以通过 `--duration` 来控制记录时长.

### 设置存储分析数据的路径

默认情况下, simpleperf 将分析数据存储在当前目录的 `perf.data` 文件中. 但可以使用 `-o` 选项更改存储路径.

```bash
# Write records to data/perf2.data.
$ simpleperf record -p 11904 -o data/perf2.data --duration 10
```

### 记录调用图

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

### 记录 CPU 时间和非 CPU 时间

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

## report

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

### 设置读取分析数据的路径

默认情况下, report 命令从当前目录的 perf.data 文件中读取分析数据. 但可以使用 `-i` 选项更改读取路径.

```bash
simpleperf report -i data/perf2.data
```

### 设置查找二进制文件的路径

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

### 报告调用图

要报告调用图, 请确保分析数据是带有调用图记录的, 如 [Record call graphs](https://android.googlesource.com/platform/system/extras/+/main/simpleperf/doc/executable_commands_reference.md#record-call-graphs) 所示.

---

更多详细内容见 [The record command](https://android.googlesource.com/platform/system/extras/+/main/simpleperf/doc/executable_commands_reference.md#the-record-command).

[simpleperf_trace_offcpu_sample_mode]:data:image/png;base64,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
