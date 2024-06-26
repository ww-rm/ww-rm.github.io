---
title: 在 Windows 上编译安装 NUPACK
categories:
  - "码记"
tags:
  - "NUPACK"
  - "MSYS2"
  - "MinGW"
  - "Clang"
date: 2024-05-11 23:36:16
---

之前项目里用到了 [NUPACK](https://nupack.org/) 这个软件, 用来做引物二级结构预测, 但是就[官方文档](https://docs.nupack.org/start/)上来看, 只提供了 Linux 下的 Python 库以及源码, 并且就算是 Windows 也是直接推荐的 WSL2 子系统. 虽然项目部署到服务器上运行直接就是 Linux 环境, 但是富有折腾精神的咱还是决定在 Windows 上尝试编译安装一下, 因此有了本文记录全部的编译踩坑过程.

太长不看: 直接前往仓库 [nupack-win](https://github.com/ww-rm/nupack-win) 下载安装包.

<!-- more -->

## 项目概况

这次使用的是 `v4.0.1.8` 的 NUPACK 源码. 项目是基于 [CMake](https://cmake.org/) 的, 并且使用了 [vcpkg](https://github.com/microsoft/vcpkg) 作为包管理器, 在官方文档中有 Mac/Linux 环境下的源码安装步骤 [Source installation](https://docs.nupack.org/start/#source-installation) 可供参考.

由于 CMake 和 vcpkg 都是比较好跨平台的, 因此我们只需要在 Windows 上复现它的这些步骤就大功告成.~~事实是被编译环境暴打.~~

## 准备环境

首先是准备 Windows 上的 MinGW + Clang 编译环境, 这里参考微软官方的 vcpkg 文档 [Mingw-w64](https://learn.microsoft.com/en-us/vcpkg/users/platforms/mingw), 以及 [MSYS2](https://www.msys2.org/) 的安装步骤.

不同的地方在于, 我们需要同时安装 Clang 和 GCC 两套工具链, 因为部分库可能在 Clang 下编译失败, 但是 GCC 可以.

安装好 MSYS2 之后, 分别启动 `MSYS2 CLANG64` 和 `MSYS2 MINGW` 两个终端, 然后用用命令分别安装对应的工具链 [mingw-w64-clang-x86_64-toolchain](https://packages.msys2.org/groups/mingw-w64-clang-x86_64-toolchain), [mingw-w64-x86_64-toolchain](https://packages.msys2.org/groups/mingw-w64-x86_64-toolchain).

```bash
pacman -S mingw-w64-clang-x86_64-toolchain
```

```bash
pacman -S mingw-w64-x86_64-toolchain
```

完事之后可以看看 `clang` 和 `gcc` 的版本.

```bash
$ clang --version
clang version 17.0.6
Target: x86_64-w64-windows-gnu
Thread model: posix
InstalledDir: D:/Program Files/msys64/clang64/bin
```

```bash
$ gcc --version
gcc.exe (Rev3, Built by MSYS2 project) 13.2.0
Copyright (C) 2023 Free Software Foundation, Inc.
This is free software; see the source for copying conditions.  There is NO
warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
```

如无特殊说明, 后续步骤里的命令默认都是在 `CLANG64` 环境里执行.

## 安装依赖库

解压 `nupack-4.0.1.8.zip`, 导航进入 `source` 目录.

全篇最困难的地方当属安装依赖库, 我们遵循一个原则, 那就是能用原项目 vcpkg 版本里的内容就尽量用原项目的, 出问题了再换成新的.

所以我们还要先 clone 一个最新的 vcpkg 备用.

```bash
$ git clone git@github.com:microsoft/vcpkg.git
Cloning into 'vcpkg'...
remote: Enumerating objects: 233259, done.
remote: Counting objects: 100% (12697/12697), done.
remote: Compressing objects: 100% (969/969), done.
remote: Total 233259 (delta 12286), reused 11775 (delta 11728), pack-reused 220562
Receiving objects: 100% (233259/233259), 69.10 MiB | 4.18 MiB/s, done.
Resolving deltas: 100% (155206/155206), done.
Updating files: 100% (11336/11336), done.

$ cd vcpkg && git show-ref --heads
a1212c93cabaa9c5c36c1ffdb4bddd59fdf31e43 refs/heads/master
```

首先得把原项目 `external/vcpkg` 下的 `scripts` 文件夹一整个替换掉, 因为旧版本有些操作完成不了, 且下载的编译工具不是最新的.

然后按正常步骤运行 `bootstrap-vcpkg.sh`.

```bash
$ ./external/vcpkg/bootstrap-vcpkg.sh
Downloading https://github.com/microsoft/vcpkg-tool/releases/download/2024-04-23/vcpkg.exe -> D:\Projects\VsProjects\nupack-4.0.1.8\source\external\vcpkg\vcpkg.exe (using IE proxy: 127.0.0.1:10809)... done.
Validating signature... done.

vcpkg package management program version 2024-04-23-d6945642ee5c3076addd1a42c331bbf4cfc97457

See LICENSE.txt for license information.
Telemetry
---------
vcpkg collects usage data in order to help us improve your experience.
The data collected by Microsoft is anonymous.
You can opt-out of telemetry by re-running the bootstrap-vcpkg script with -disableMetrics,
passing --disable-metrics to vcpkg on the command line,
or by setting the VCPKG_DISABLE_METRICS environment variable.

Read more about vcpkg telemetry at docs/about/privacy.md
```

安装之前记得先在终端里设置一下默认的 triplet.

```bash
export VCPKG_DEFAULT_TRIPLET=x64-mingw-dynamic
export VCPKG_DEFAULT_HOST_TRIPLET=x64-mingw-dynamic
```

结合官方教程里的步骤以及 `cmake/Libraries.cmake` 和 `cmake/BuildCXX.cmake` 里的内容, 所有要安装的包大概可以分成下面几类.

1. 需要先更新 port 版本

    ```plain
    openblas yaml-cpp fmt spdlog
    ```

    这些库由于旧版本有一些 bug, 或者由于某些神秘问题导致在 MinGW 环境下安装失败, 但是通过把 port 换成最新的就能正常安装.

    - `openblas`: 被作为依赖包安装, 但是貌似存在某些不正确的依赖关系, 换成新版本后能正常安装.
    - `yaml-cpp`: 最后链接的时候找不到某个符号, 新版本已经修复了符号没导出的问题, 详见 [#1026](https://github.com/jbeder/yaml-cpp/issues/1026).
    - `fmt`: 最后编译的时候会报错找不到某个头文件, 新版本修复了这个问题, 详见 [#3663](https://github.com/fmtlib/fmt/pull/3663).
    - `spdlog`: 由于依赖 `fmt` 库, 所以必须和 `fmt` 一起更新.

2. 直接装, 在 `CLANG64` 下就能一步到位.

    ```plain
    taskflow libsimdpp blas lapack armadillo nlohmann-json magic-enum protobuf
    ```

3. 需要 GCC 环境安装, 在 `MINGW64` 下一步到位.

    ```plain
    boost-core boost-preprocessor boost-functional boost-container boost-variant boost-iterator boost-align boost-sort boost-algorithm boost-serialization boost-multi-index
    ```

4. 特殊情况

    ```plain
    gecode tbb
    ```

    这两个库在 MinGW 环境编译的时候存在一些配置问题, 会导致安装的时候出现一些语法和链接错误, 因此单独 fork 了仓库并修改了一些报错的配置和代码.

    - `gecode`: [增加了 ws2_32 的链接选项](https://github.com/ww-rm/gecode/commit/b77d22e4c6b3b6449e4e37cb1be2c16b269f4d39).
    - `tbb`: [去掉了对于宏 \_\_MINGW32\_\_ 的前后不一致判断](https://github.com/ww-rm/oneTBB/commit/58a03b05e66ae3a4f69f02ef2448b7d2b1722ac5).

    然后把对应的 port 文件改成修改后自己的仓库地址, 就能安装成功.

## 运行 CMake

在参考 NUPACK 官方源码安装教程的基础上, 用以下命令运行 CMake. 运行前确保目录被清空.

```bash
cmake .. -DCMAKE_BUILD_TYPE=Release -DCMAKE_POSITION_INDEPENDENT_CODE=ON -DCMAKE_C_COMPILER=clang -DCMAKE_CXX_COMPILER=clang++ -DVCPKG_TARGET_TRIPLET=x64-mingw-dynamic -DREBIND_PYTHON_INCLUDE="/d/CondaEnvs/py39/include"
```

这里比较关键的是要指定 `-DVCPKG_TARGET_TRIPLET`, 其余选项基本类似.

然后需要直接指定 `-DREBIND_PYTHON_INCLUDE`, 貌似由于平台路径格式差异, 导致无法正确地自动探测 Python 头文件的位置.

在运行之前, 还需要解决下面这些问题.

### 解决库查找错误

也不知道是哪的配置问题, 在 Windows 下生成的 lib 文件后缀都是 `.dll.a`, 但是配置文件使用 `find_library` 按路径直接查找的时候找不到, 只能查找 `.a` 或者 `.so` 后缀的, 因此需要去 `cmake/Libraries.cmake` 里把库名都改一下, 补一个 `.dll` 进去.

类似这样:

```cmake
if(NOT LAPACK_LIBRARIES)
    # find_library(LAPACK_LIBRARIES lapack)
    find_library(LAPACK_LIBRARIES lapack.dll)
endif()
```

但是 `lapack` 和 `blas` 这两个库用到了 `find_package`, 且由于按本地路径直接查找, 因此还是需要去 `external/vcpkg/installed/x64-mingw-dynamic/lib` 下面手动改一下库文件名, 建议直接复制一份, 把复制的文件改个后缀.

- `liblapack.dll.a` -> `liblapack.a`
- `libopenblas.dll.a` -> `libopenblas.a`

### 解决 Python 包含目录错误

直接使用自带的 `-DREBIND_PYTHON` 和 `-DREBIND_PYTHON_INCLUDE` 参数是存在问题的, 一是 Windows 下路径格式不适配, 二是项目本身 `external/rebind/CMakeLists.txt:12` 附近的代码就写的有问题, 所以手动改改.

```cmake
# if (${REBIND_PYTHON_INCLUDE}) # 这里的原本的判断存在问题, 永远是假
if (NOT "${REBIND_PYTHON_INCLUDE}" STREQUAL "")
    message("-- Using specified Python include")
    set(python_include ${REBIND_PYTHON_INCLUDE}) # 仿照 else 部分对变量 python_include 赋值
    set_property(GLOBAL PROPERTY rebind_python_include ${REBIND_PYTHON_INCLUDE})
else()
    execute_process(
        COMMAND ${REBIND_PYTHON} -c "import sys, sysconfig; sys.stdout.write(sysconfig.get_paths()['include'])"
        RESULT_VARIABLE python_stat OUTPUT_VARIABLE python_include
    )
    if (python_stat)
        message(FATAL_ERROR "Failed to deduce include directory from '${REBIND_PYTHON}' executable.\nMaybe specify REBIND_PYTHON_INCLUDE directly.")
    endif()
    message("-- Using Python include directory deduced from REBIND_PYTHON=${REBIND_PYTHON}")
    set_property(GLOBAL PROPERTY rebind_python_include ${python_include})
endif()

message("-- Using Python include directory ${python_include}")
```

修改之后再编译就不会报 `Python.h` 头文件找不到这样的错误了.

### 解决 yaml-cpp 的警告

运行之后可能会报关于 `yaml-cpp` 的警告:

```plain
CMake Warning (dev) at cmake/BuildCXX.cmake:133 (target_link_libraries):
  The library that is being linked to, yaml-cpp, is marked as being
  deprecated by the owner.  The message provided by the developer is:

  The target yaml-cpp is deprecated and will be removed in version 0.10.0.
  Use the yaml-cpp::yaml-cpp target instead.
```

这是新版本 `yaml-cpp` 的开发者警告, 可以选择去 `cmake/BuildCXX.cmake:133` 里面按照提示把 `yaml-cpp` 改成 `yaml-cpp::yaml-cpp` 再重新运行命令.

## 生成目标文件

参考教程的基础上, 用以下命令生成目标文件.

```bash
cmake --build . --target nupack-python --verbose -j8
```

其中 `-j8` 可以自行修改, 用来多线程加快编译速度, 太高可能会爆内存.

### 解决参数路径错误

不出意外会得到下面的报错.

```plain
[ 44%] Running cpp protocol buffer compiler on proto/public.proto
/d/Projects/VsProjects/nupack-4.0.1.8/source/external/vcpkg/installed/x64-mingw-dynamic/tools/protobuf/protoc.exe --cpp_out :/d/Projects/VsProjects/nupack-4.0.1.8/source/build-py39/include/nupack/ -I /d/Projects/VsProjects/nupack-4.0.1.8/source /d/Projects/VsProjects/nupack-4.0.1.8/source/proto/public.proto
/d/Projects/VsProjects/nupack-4.0.1.8/source/build-py39/include/nupack/: No such file or directory
make[3]: *** [CMakeFiles/libnupack.dir/build.make:75: include/nupack/proto/public.pb.h] Error 1
make[3]: Leaving directory '/d/Projects/VsProjects/nupack-4.0.1.8/source/build-py39'
make[2]: *** [CMakeFiles/Makefile2:128: CMakeFiles/libnupack.dir/all] Error 2
make[2]: Leaving directory '/d/Projects/VsProjects/nupack-4.0.1.8/source/build-py39'
make[1]: *** [CMakeFiles/Makefile2:280: CMakeFiles/nupack-python.dir/rule] Error 2
make[1]: Leaving directory '/d/Projects/VsProjects/nupack-4.0.1.8/source/build-py39'
make: *** [Makefile:234: nupack-python] Error 2
```

这是由于其中一条命令中的参数 `--cpp_out` 后面跟的路径前面多了个冒号 `:`, 也不知道在哪配置的.

所以在运行命令之前, 还得先把上一步生成的生成文件里的内容改一下, 位于 `CMakeFiles/libnupack.dir/build.make:75`.

这一步每次重新生成的时候都要手动改~~纯纯折磨~~.

### 解决 format-security 警告

编译途中会有一个关于格式字符串的不安全警告.

```plain
external/backward-cpp/backward.hpp:3646:14: warning:
      format string is not a string literal (potentially insecure) [-Wformat-security]
 3646 |       printf(lpMsgBuf);
      |              ^~~~~~~~
```

我们可以根据提示信息改成 `printf("%s", lpMsgBuf)`.

### 解决 simdpp 包含目录错误

重新生成会报错找不到 `simdpp` 相关的头文件.

```plain
include/nupack/math/SIMD.h:19:14: fatal error:
      'simdpp/simd.h' file not found
   19 | #    include <simdpp/simd.h>
      |              ^~~~~~~~~~~~~~~
```

这是原项目自己加的一个私有 port, 估计是没配置好, 所以我们直接在顶层 `CMakeLists.txt` 里用 `include_directories` 自己加进去, 比如这样.

```cmake
include_directories(
    "/d/Projects/VsProjects/nupack-4.0.1.8/source/external/vcpkg/installed/x64-mingw-dynamic/include/libsimdpp-2.1"
)
```

### 解决类型错误

重新生成会报错有一处类型不兼容.

```plain
external/rebind/source/Module.cc:106:17: error:
      assigning to 'hashfunc' (aka 'long long (*)(_object *)') from incompatible type
      'long (PyObject *) noexcept' (aka 'long (_object *) noexcept'): different return type
      ('Py_hash_t' (aka 'long long') vs 'long')
  106 |     o.tp_hash = type_index_hash;
      |                 ^~~~~~~~~~~~~~~
```

这是因为 Windows 下 `long long` 和 `long` 类型位长不一致导致的, 所以直接去源码 `external/rebind/source/Module.cc:80` 处把返回值类型 `long` 改成 `long long`.

```cpp
long long type_index_hash(PyObject *o) noexcept {
    return static_cast<long long>(cast_object<TypeIndex>(o).hash_code());
}
```

### 解决符号重定义错误

在最后的链接环节, 还会出现符号重定义错误.

```plain
ld.lld: error: duplicate symbol: rebind::Holder<rebind::Var>::type
>>> defined at CMakeFiles/nupack-python.dir/external/rebind/source/Python.cc.obj
>>> defined at CMakeFiles/nupack-python.dir/external/rebind/source/Module.cc.obj

ld.lld: error: duplicate symbol: rebind::Holder<rebind::TypeIndex>::type
>>> defined at CMakeFiles/nupack-python.dir/external/rebind/source/Python.cc.obj
>>> defined at CMakeFiles/nupack-python.dir/external/rebind/source/Module.cc.obj

ld.lld: error: duplicate symbol: rebind::Holder<rebind::Function>::type
>>> defined at CMakeFiles/nupack-python.dir/external/rebind/source/Python.cc.obj
>>> defined at CMakeFiles/nupack-python.dir/external/rebind/source/Module.cc.obj

ld.lld: error: duplicate symbol: rebind::Holder<rebind::ArrayBuffer>::type
>>> defined at CMakeFiles/nupack-python.dir/external/rebind/source/Module.cc.obj
>>> defined at CMakeFiles/nupack-python.dir/external/rebind/source/Cast.cc.obj
```

不过这个我看了一下源码, 大概率是因为模板的实例化导致的重定义. 但是由于对 c++ 语法也不是很懂, 试了很久没改出来, 所以暴力解决, 三合一大法, 把涉及重定义的几个模块的源码合并到一份源码里, 只生成一个 `obj` 文件, 在这一份文件里就不会由于反复实例化模板导致重定义了.

直接把:

- `external/rebind/source/Cast.cc`
- `external/rebind/source/Python.cc`
- `external/rebind/source/Module.cc` (注意之前修改过一次)

复制到一份新的 `external/rebind/source/Cast_Python_Module.cc` 文件里.

然后修改 `external/rebind/CMakeLists.txt:49` 附近代码:

```cmake
set_property(GLOBAL PROPERTY rebind_module_files
    # ${CMAKE_CURRENT_SOURCE_DIR}/source/Python.cc
    # ${CMAKE_CURRENT_SOURCE_DIR}/source/Module.cc
    # ${CMAKE_CURRENT_SOURCE_DIR}/source/Cast.cc
    ${CMAKE_CURRENT_SOURCE_DIR}/source/Globals.cc
    ${CMAKE_CURRENT_SOURCE_DIR}/source/Cast_Python_Module.cc
)
```

### 解决 Python 符号未定义错误

最后, 也不知道哪没配置好, 会得到一大堆关于 Python 库符号未定义的错误, 像这样的:

```plain
ld.lld: error: undefined symbol: __declspec(dllimport) PyObject_CallObject
```

似乎只是因为在 Windows 下没有指定 Python 链接库, 所以根据要绑定的 Python 版本, 直接在顶级 `CMakeLists.txt` 里用 `link_directories` 和 `link_libraries` 直接打补丁修复, 类似于下面这样. 库目录和命令里的 `-DREBIND_PYTHON_INCLUDE` 指定的包含目录相互匹配.

```cmake
link_directories(
    "/d/CondaEnvs/py39/libs"
)

link_libraries(
    python39
)
```

需要注意的是, 不能链接 `python3`, 必须链接特定版本的库 (比如 `python39`), 否则还是会出现个别符号未定义.

### 解决 ImageHlp 符号未定义

最后的最后, 链接的时候还存在一些符号未定义, 大概长这样.

```plain
ld.lld: error: undefined symbol: __declspec(dllimport) SymGetModuleBase64
ld.lld: error: undefined symbol: __declspec(dllimport) StackWalk64
ld.lld: error: undefined symbol: __declspec(dllimport) ImageNtHeader
```

还是在 Windows 下少链接了一些库, 经过一番搜索, 找到一个可行的[解决方案](https://stackoverflow.com/questions/26405420/w64-mingw-llvmsupport-a-undefined-reference-to-imp), 直接在顶级 `CMakeLists.txt` 的 `link_libraries` 里添加对 `imagehlp` 的链接即可.

## 生成 Python 包

首先需要修改一下生成目录下的 `setup.py`, 也可以在生成之前直接修改源码的 `package/setup.py`, 就不用每次修改.

```python
setup(
    name='nupack',
    version='@PROJECT_VERSION@',
    description='Nucleic Acid Package',
    url='www.nupack.org',
    # package_data={'nupack': ['cpp.so', 'parameters/*']},
    package_data={'nupack': ['cpp.pyd', 'parameters/*', "*.dll"]},
    packages=find_packages(include=('nupack**',)),
    scripts=[],
    distclass=BinaryDistribution,
    cmdclass={'install': InstallPlatlib},
    install_requires=[
        'pyyaml>=5.0.0',
        'scipy>=1.0',
        'numpy>=1.17',
        'pandas>=1.1.0',
        'jinja2>=2.0',
    ]
)
```

在 Windows 下 Python 的扩展模块文件名后缀是 `.pyd`, 所以得把编译后生成的 `cpp.so` 重命名成 `cpp.pyd`.

然后刚刚编译生成的 `cpp.pyd`, 还依赖于我们编译环境里以及安装的一些库的动态链接库 DLL 文件, 所以还得挨个把这些 DLL 文件复制过来和 `cpp.pyd` 放在同一个目录下一起打包进去. 如果缺少某些库则在 `import nupack` 的时候会有类似下面的报错信息.

```plain
ImportError: DLL load failed while importing cpp: 找不到指定的模块。
```

{% note info "*如何知道哪些 DLL 文件是必需的?*" %}

有两种方案, 首先这些必需的 DLL 来自于两部分:

- MSYS2 环境变量里的系统库.
- 通过 vcpkg 安装的第三方库.

因此第一种方式是把所有可能的系统库和第三方库安装后生成的 DLL 文件都复制到 `cpp.pyd` 一起, 然后启动 `python` 会话并 `import cpp`, 此时将所有复制过来的 DLL 文件尝试删除, 最后留下来提示正在占用无法删除的就是必需 DLL.

第二种方式是使用 [Dependency Walker](https://www.dependencywalker.com/) 查看 `cpp.pyd` 依赖的 DLL 文件, 并在系统目录和第三方库目录里对照, 看看涉及哪些就复制哪些, Dependency Walker 可能会把 VC 运行时的 DLL 也算进去 (就是一大堆名字里带 `api-ms` 的), 但是一般情况下电脑上都是装了的, 如果最后真没有的话可以去 [Microsoft Visual C++ Redistributable latest supported downloads](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist) 这里下载安装最新的运行时库.

{% endnote %}

系统依赖库:

- `libc++.dll`: 位于 MSYS2 安装目录的 `clang64/bin` 下面.

其余都是我们安装的库及其依赖的库, 均位于 `external/vcpkg/installed/x64-mingw-dynamic/bin` 下, 共 16 个:

- `libgcc_s_seh-1.dll`
- `libgecodefloat.dll`
- `libgecodeint.dll`
- `libgecodekernel.dll`
- `libgecodeminimodel.dll`
- `libgecodesearch.dll`
- `libgecodeset.dll`
- `libgecodesupport.dll`
- `libgfortran-5.dll`
- `liblapack.dll`
- `libopenblas.dll`
- `libprotobuf.dll`
- `libquadmath-0.dll`
- `libtbb12.dll`
- `libwinpthread-1.dll`
- `libyaml-cpp.dll`

然后导航进生成目录下, 使用命令 `python -m build` 进行打包, 则会在 `dist` 下生成打包后的源码和 whl 安装包.

之后可以使用 `pip install` 直接安装 `whl` 文件, 并运行命令 `python -m pytest -v --pyargs nupack` 来测试功能是否正常, 应当是 `45` 个测试用例全部通过, 无任何警告和错误.

## 解决路径错误

直接在源码目录下面测试没测出来 bug, 但是去别的目录下就会发生报错.

```plain
RuntimeError: C++: : "failed to open parameter file " (Model.cc, line 50)
```

有问题的源码在 `source/Model.cc:35` 附近.

```cpp
json ParameterFile::open() const {
    string name = path;

    if (!path_exists(name)) {
        vec<string> defaults;
        // boost::split(defaults, DefaultParametersPath, [](char c) {return c == ':';}, boost::token_compress_on); // Windows 下不能按冒号 : 分割, 换成分号 ;
        boost::split(defaults, DefaultParametersPath, [](char c) {return c == ';';}, boost::token_compress_on);
        for (auto const &d : defaults) {
            name = path_join(d, path);
            if (path_exists(name)) break;
        }
    }

    if (!path_exists(name)) {
        auto s = get_env("NUPACKHOME");
        if (!s.empty()) name = path_join(path_join(s, "parameters"), path);
    }

    std::ifstream file(name);
    if (!file.good()) {
        vec<string> directories = {".", DefaultParametersPath, "$NUPACKHOME/parameters"};
        NUPACK_ERROR("failed to open parameter file ", path, directories);
    }
    json j;
    file >> j;
    return j;
}
```

原代码直接按冒号 `:` 对默认参数文件路径进行分割, 类似环境变量那种, 但是在 Windows 上会错误地把盘符后面的冒号切了, 所以找不到文件. 不过这地方可以曲线一下, 就是手动设置 `NUPACKHOME` 环境变量, 这部分的寻找逻辑倒是没有问题.

此外还有两个地方路径格式也有问题, 也一并修改一下.

```plain
OSError: [Errno 22] Invalid argument: 'blah\\0\\checkpoint\\2024-05-13T10:46:49.json'
OSError: [Errno 22] Invalid argument: 'design-checkpoint\\2024-05-13T10:46:50.json'
```

在 Windows 下面文件名不能包含 `:`, 因此去源码里简单修改一下即可, 位于 `python/design/components.py:96` 附近, 干脆换一个时间格式得了.

```python
class WriteToFileCheckpoint:
    def __init__(self, path, timespec='seconds'):
        self.path = pathlib.Path(path)
        self.timespec = timespec

    def __call__(self, result):
        # time = datetime.datetime.now().isoformat(timespec=self.timespec)
        time = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
        self.path.mkdir(parents=True, exist_ok=True)
        path = self.path/'{}.json'.format(time)
        path.write_text(result.to_json().dump(indent=4))
```

不过改了之后还需要把配套使用了 `fromisoformat` 的地方也一并修改, 位于 `python/design/trials.py:96` 附近.

```python
    def _checkpoints(self, where=None):
        if where is None:
            where = self.checkpoint/'checkpoint'
        if not where.exists():
            return []
        return sorted(
            (i for i in where.iterdir() if i.suffix == '.json'),
            reverse=True, 
            # key=lambda p: datetime.datetime.fromisoformat(p.stem) # 此处应该是可以直接按字符串大小进行比较的, 和按时间比较应该结果相同
            key=lambda p: p.stem
        )
```

## 静态链接

编译成功之后整个 `cpp.pyd` 加上所有的 `dll` 文件合起来有约莫 67 MB 大小, 打包之后的 `whl` 文件也还有 18 MB 左右, 感觉有点太大, 所以之后又尝试了一下按静态的方式去链接第三方库.

所做的改动也不多, 把前面用到的所有 `x64-mingw-dynamic` 都换成 `x64-mingw-static`, 这样在安装和链接第三方库的时候就会默认都用静态库的方式, 个别不支持静态库的会自动切换成动态库模式, 甚至 `cmake/Libraries.cmake` 里的库名也都可以不用改了, 因为安装的静态库后缀就只有一个单独的 `.a`. 不过 `lapack` 这个库还是得手动改后缀, 因为它不支持静态库, 仍然是安装的动态库.

最后依赖的第三方库 DLL 文件也减少到 6 个, 整个 `cpp.pyd` 加上所有 `dll` 文件合起来只有 45 MB, 打包后的 `whl` 文件降低到 13 MB 左右.

然后会产生一个新的问题, 原项目关于 Python 模块符号的导出写的有点小问题, 导致打包后的库在导入的时候会报错找不到符号.

```plain
ImportError: dynamic module does not define module export function (PyInit_cpp)
```

这个问题也比较好解决, 在文件 `external/rebind/source/Module.cc:203` (最后被合并到了 `external/rebind/source/Cast_Python_Module.cc` 里了) 处附近, 我们可以增加 Python 头文件提供的导出符号宏定义 `Py_EXPORTED_SYMBOL`.

```cpp
    Py_EXPORTED_SYMBOL PyObject* REBIND_CAT(PyInit_, REBIND_MODULE)(void) {
        Py_Initialize();
        return rebind::raw_object([&]() -> rebind::Object {
            rebind::Object mod {PyModule_Create(&rebind_definition), true};
            if (!mod) return {};
            rebind::init(rebind::document());
            rebind::Object dict = initialize(rebind::document());
            if (!dict) return {};
            rebind::incref(+dict);
            if (PyModule_AddObject(+mod, "document", +dict) < 0) return {};
            return mod;
        });
    }
```

这里不需要用 `PyMODINIT_FUNC`, 因为会重复定义 `extern "C"`.

不过懒得再全部重新按静态方式编译链接一次, 所以 Github 上都是放的动态链接的版本~~上传完了无聊试试才发现静态链接一路畅通无阻且体积小性价比又高~~.

## 后记

本次编译过程所有修改后的差异文件均放在自己的 Github 上了, 包括在自己电脑上打包好的 `whl` 文件 (动态链接版本) 也一并放上去了, 仓库地址是 [nupack-win](https://github.com/ww-rm/nupack-win), 直接去 Releases 页面下载即可.

从五一放假开始折腾, 前前后后大约折腾了一周多才编译出来, 可以说是把能踩的坑都踩了个遍, 让我深刻的认识到不同操作系统不同编译环境的天壤之别, 期间也试过用 msvc 和 gcc 去编译, 但是一坨的警告和错误让我彻底转向 clang. ~~不过那些警告和错误看着挺有道理的, 怎么 clang 就不管了呢?~~

虽然之后自己的项目要用这个的时候大概率是在 Linux 环境运行, 用不到 Windows 的库了, 但是这么折腾一下也挺有收获, 至少浅浅的使用了一下三大主流 C 编译器, 以及熟悉了一下 CMake 和 vcpkg 的使用方法, 希望这次踩的坑将来都不会踩了吧~
