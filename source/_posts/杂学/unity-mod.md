---
title: Unity 手工 Mod 制作方法整理
categories:
  - "杂学"
tags:
    - "Mod"
    - "汉化"
    - "UABEA"
    - "Unity"
date: 2025-01-31 10:09:20
---

最近在 DLsite 上找到了[一个比较有意思的音游](https://www.dlsite.com/maniax/work/=/product_id/RJ01212921.html), 于是在资源平台上下载下来玩了一下. 虽然说 v1.1 版本增加了自动游玩的功能, 但是会忽略特殊音符, 所以玩起来总感觉少点什么. 于是乎在各大论坛帖子的帮助下, 成功做出了第一个 Unity 游戏 Mod, 顺带还了解了一些基础的汉化方式.

<!-- more -->

## 功能 Mod

### 准备工作

我需要增加的功能很简单, 游戏原本的自动游玩功能是自动 Perfect 所有的常规音符, 但是实际上音轨上会有很多特殊音符, 如果点击了会触发特殊效果~~涩涩~~, 所以我希望在原本自动游玩功能的基础上, 增加对特殊音符的点击操作.

很幸运的是, 这个游戏是 Unity 引擎制作的, 并且脚本编译方式也是 Mono 模式, 因此操作起来难度比较低, 适合我这个小白入门练手.

在游戏根目录下的 `XXX_Data/Managed` 目录下可以找到一个 `Assembly-CSharp.dll` 文件, 这是 Mono 方式编译的特点, 而游戏逻辑代码也位于这份 dll 文件里.

我们需要用到 [dotPeek](https://www.jetbrains.com/decompiler/), 任意版本 Visual Studio 和 [ildasm/ilasm](https://learn.microsoft.com/zh-cn/dotnet/framework/tools/ildasm-exe-il-disassembler) 几个工具.

dotPeek 是一个 .NET 反编译工具, 可以帮助我们导出 dll 对应的 C# 源代码, 然后理解游戏逻辑, 定位功能代码所处的位置.

Visual Studio 用来打开 dotPeek 导出的 dll 项目, 方便查找代码.

ildasm/ilasm 是一组 IL 语言反汇编/汇编工具, 可以将 dll 转换成能够手工修改的 IL 代码, 并把修改过的 IL 代码重新打包成 dll 文件, 完成 Mod. 该工具随 Visual Studio 一起安装.

此外还需要一个文本编辑器, 推荐 VSCode.

我们的思路很简单, 将原始 dll 导出 IL 代码, 修改需要的功能, 重新把 IL 代码打包回 dll 并替换原始 dll, 从而增加 Mod 功能.

打开 dotPeek, 并且 Open 我们需要修改的 dll 文件, 加载完成后右键项目名选择 `Export to Project`, 并选择一个地方保存导出的 VS 项目.

然后是 IL 代码的反汇编和汇编, 可以在 VS 开发人员命令提示符里使用下面的命令.

```bash
# 反汇编并指定输出, 会得到 il 以及一份 res 文件
ildasm Assembly-CSharp.dll /output:Assembly-CSharp.il

# 将修改后的 il 文件和 res 重新打包回 dll, 不报错即成功
ilasm /dll /resource:Assembly-CSharp.res Assembly-CSharp.il /output:Assembly-CSharp.dll
```

可能还有更好的工具, 例如 dnSpy, 但是作为小白, 我参考的帖子就是用的这几个, 所以成功之后也没花时间去研究更好的工具了, 有兴趣的可以试试.

### 定位 C# 代码

打开我们导出的 VS 项目, 接下来我们需要发挥我们的聪明才智和编程经验, 找到和判定有关的逻辑, 以及一些好用的导航功能:

- `Ctrl + F`: 查找所有单词
- `F12`: 查找定义
- `Shift + F12`: 查找引用

经过一番搜寻, 可以找到一个这样的函数.

{% note info "怎么找的?" %}
作为一个音游, 可以看到代码里很多和 Judge 有关的函数, 为了挂机自动 Perfect, 我们需要修改挂机判定部分逻辑, 因此围绕 Judge 这个单词去查找有关的方法.
{% endnote %}

```csharp
public void CheckTimeLimit()
{
  NotesData target1;
  if (this.NotesQueueLeft.TryPeek(ref target1))
  {
    if (target1.NotesType == RhysmGame.NotesType.Event || target1.NotesType == RhysmGame.NotesType.Temptation)
    {
      if ((double) SingletonMonoBehaviour<SoundManager>.Instance.GetBGMCurrentTime() >= (double) target1.EndTime + (double) target1.HitCount * (double) this.adjustData.ThroughTime)
      {
        if (target1.NotesType == RhysmGame.NotesType.Event)
          this.PlayEventNotes(target1);
        this.NotesViewer.SetActiveNotes(target1.Id);
        this.NotesQueueLeft.Dequeue();
      }
    }
    else if (this.IsAutoPlay && (double) SingletonMonoBehaviour<SoundManager>.Instance.GetBGMCurrentTime() > (double) target1.EndTime)
    {
      NotesData targetNotes = this.NotesQueueLeft.Dequeue();
      this.SetJudgeResult(targetNotes, RhysmGame.JudgeType.Perfect);
      this.NotesViewer.SetActiveNotes(targetNotes.Id);
    }
    else if ((double) SingletonMonoBehaviour<SoundManager>.Instance.GetBGMCurrentTime() > (double) target1.EndTime + (double) target1.HitCount * 0.10000000149011612)
    {
      NotesData targetNotes = this.NotesQueueLeft.Dequeue();
      this.SetJudgeResult(targetNotes, RhysmGame.JudgeType.Bad);
      this.NotesViewer.SetActiveNotes(targetNotes.Id);
    }
  }
  NotesData target2;
  if (!this.NotesQueueRight.TryPeek(ref target2))
    return;
  if (target2.NotesType == RhysmGame.NotesType.Event || target2.NotesType == RhysmGame.NotesType.Temptation)
  {
    if ((double) SingletonMonoBehaviour<SoundManager>.Instance.GetBGMCurrentTime() < (double) target2.EndTime + (double) target2.HitCount * (double) this.adjustData.ThroughTime)
      return;
    if (target2.NotesType == RhysmGame.NotesType.Event)
      this.PlayEventNotes(target2);
    this.NotesViewer.SetActiveNotes(target2.Id);
    this.NotesQueueRight.Dequeue();
  }
  else if (this.IsAutoPlay && (double) SingletonMonoBehaviour<SoundManager>.Instance.GetBGMCurrentTime() > (double) target2.EndTime)
  {
    NotesData targetNotes = this.NotesQueueRight.Dequeue();
    this.SetJudgeResult(targetNotes, RhysmGame.JudgeType.Perfect);
    this.NotesViewer.SetActiveNotes(targetNotes.Id);
  }
  else
  {
    if ((double) SingletonMonoBehaviour<SoundManager>.Instance.GetBGMCurrentTime() <= (double) target2.EndTime + (double) target2.HitCount * 0.079999998211860657)
      return;
    this.SetJudgeResult(this.NotesQueueRight.Dequeue(), RhysmGame.JudgeType.Bad);
  }
}
```

这个函数描述的是在挂机时什么都没做音符超时了如何处理, 可以看到对不同类型的音符有不同的处理规则.

如果是自动游玩模式, 则对于超时的音符会判定成 Perfect, 否则会判定超时 0.1 秒变成 Bad.

我们现在需要在对 `Temptation` 类型的音符里增加触发操作, 原逻辑直接忽略了该类型音符.

于是我们针对这个关键词, 寻找一下非自动模式点击后特殊音符的触发逻辑.

进一步找到核心函数 `SetJudgeResult`, 用于处理每个音符点击后的判定结果.

```csharp
public void SetJudgeResult(NotesData targetNotes, RhysmGame.JudgeType type)
{
  if (targetNotes.NotesType == RhysmGame.NotesType.Event)
    return;
  this.NotesViewer.SetActiveNotes(targetNotes.Id);
  if (targetNotes.NotesType == RhysmGame.NotesType.Temptation)
  {
    SingletonMonoBehaviour<SoundManager>.Instance.PlaySE("BattleSE", "Temptation");
    this.SetActiveTemptation(targetNotes.AnimationId);
  }
  else
  {
    int num = !targetNotes.IsLong ? targetNotes.AnimationType() : 0;
    int type1 = targetNotes.HitType == RhysmGame.HitType.Up ? -1 : num;
    this.IsPlayLoopAnim |= targetNotes.IsLong;
    if (targetNotes.IsLong)
      SingletonMonoBehaviour<SoundManager>.Instance.PlayLoopSE("BattleSE", "Loop");
    if (targetNotes.HitType == RhysmGame.HitType.Up)
    {
      this.IsPlayLoopAnim = false;
      SingletonMonoBehaviour<SoundManager>.Instance.StopLoopSE();
    }
    if (this.IsPlayLoopAnim)
      type1 = 0;
    Action onPlaySe = this.OnPlaySe;
    if (onPlaySe != null)
      onPlaySe();
    switch (type - -1)
    {
      case RhysmGame.JudgeType.Bad:
        return;
      case RhysmGame.JudgeType.Good:
        this.ComboMiss();
        this.PlayBadAnim();
        this.OnPlayBadEffect(true);
        this.PlayAnimation(type1, false);
        this.JudgeEffect(targetNotes.IsLong, false);
        break;
      case RhysmGame.JudgeType.Perfect:
        this.AddCombo();
        this.OnPlayBadEffect(false);
        this.PlayAnimation(type1, true);
        this.JudgeEffect(targetNotes.IsLong);
        break;
      case RhysmGame.JudgeType.Good | RhysmGame.JudgeType.Perfect:
        this.AddCombo();
        this.OnPlayBadEffect(false);
        this.PlayAnimation(type1, true);
        this.JudgeEffect(targetNotes.IsLong);
        break;
    }
    if (type == RhysmGame.JudgeType.Ready)
      return;
    this.PlaySe(type);
    this.ScoreDic[type]++;
    this.AddEcstasy(type);
    string timingText = (SingletonMonoBehaviour<SoundManager>.Instance.GetBGMCurrentTime() - targetNotes.EndTime).ToString();
    this.InstantiateJudgeObject(type, timingText);
    if (targetNotes.NotesType != RhysmGame.NotesType.Heart)
      return;
    this.PlayHeartSe(type);
    this.AddHeartScore(type);
  }
}
```

起作用的就是这两句:

```csharp
SingletonMonoBehaviour<SoundManager>.Instance.PlaySE("BattleSE", "Temptation");
this.SetActiveTemptation(targetNotes.AnimationId);
```

触发了特殊动画效果, 那么我们只需要在 `CheckTimeLimit` 函数里增加这两句就行, 类似下面这样:

```csharp
public void CheckTimeLimit()
{
  // ......
  if (target1.NotesType == RhysmGame.NotesType.Event || target1.NotesType == RhysmGame.NotesType.Temptation)
  {
    if ((double) SingletonMonoBehaviour<SoundManager>.Instance.GetBGMCurrentTime() > (double) target1.EndTime)
    {
      if (target1.NotesType == RhysmGame.NotesType.Event)
        this.PlayEventNotes(target1);
      if (this.IsAutoPlay && target1.NotesType == RhysmGame.NotesType.Temptation)
      {
        SingletonMonoBehaviour<SoundManager>.Instance.PlaySE("BattleSE", "Temptation");
        this.SetActiveTemptation(target1.AnimationId);
      }
      this.NotesViewer.SetActiveNotes(target1.Id);
      this.NotesQueueLeft.Dequeue();
    }
  }
  // ......
  if (target2.NotesType == RhysmGame.NotesType.Event || target2.NotesType == RhysmGame.NotesType.Temptation)
  {
    if ((double) SingletonMonoBehaviour<SoundManager>.Instance.GetBGMCurrentTime() <= (double) target2.EndTime)
      return;
    if (target2.NotesType == RhysmGame.NotesType.Event)
      this.PlayEventNotes(target2);
    if (this.IsAutoPlay && target2.NotesType == RhysmGame.NotesType.Temptation)
    {
      SingletonMonoBehaviour<SoundManager>.Instance.PlaySE("BattleSE", "Temptation");
      this.SetActiveTemptation(target2.AnimationId);
    }
    this.NotesViewer.SetActiveNotes(target2.Id);
    this.NotesQueueRight.Dequeue();
  }
  // ......
}
```

### 修改 IL 代码

确认 C# 层面的代码修改逻辑之后, 就可以去修改 IL 代码了.

用 ildasm 导出 `Assembly-CSharp.il`, 然后用 VSCode 打开, 直接搜索这两个函数名, 找到 IL 代码的定义.

```IL
.method public hidebysig instance void 
        SetJudgeResult(class NotesData targetNotes,
                        valuetype RhysmGame/JudgeType 'type') cil managed
{
  // 代码大小       461 (0x1cd)
  .maxstack  4
  .locals init (int32 V_0,
            string V_1,
            valuetype RhysmGame/JudgeType V_2,
            int32 V_3,
            float32 V_4)
  // ......

  //////////////////////////////////////////
  // if (targetNotes.NotesType == RhysmGame.NotesType.Temptation)
  // {
  //   SingletonMonoBehaviour<SoundManager>.Instance.PlaySE("BattleSE", "Temptation");
  //   this.SetActiveTemptation(targetNotes.AnimationId);
  // }
  //////////////////////////////////////////
  IL_001c:  ldarg.1
  IL_001d:  ldfld      valuetype RhysmGame/NotesType NotesData::NotesType
  IL_0022:  ldc.i4.4
  IL_0023:  bne.un.s   IL_0046

  IL_0025:  call       !0 class SingletonMonoBehaviour`1<class SoundManager>::get_Instance()
  IL_002a:  ldstr      "BattleSE"
  IL_002f:  ldstr      "Temptation"
  IL_0034:  callvirt   instance void SoundManager::PlaySE(string,
                                                          string)
  IL_0039:  ldarg.0
  IL_003a:  ldarg.1
  IL_003b:  ldfld      string NotesData::AnimationId
  IL_0040:  call       instance void RhysmGame::SetActiveTemptation(string)
  IL_0045:  ret
  //////////////////////////////////////////

  // ......
} // end of method RhysmGame::SetJudgeResult
```

```IL
.method public hidebysig instance void 
        CheckTimeLimit() cil managed
{
  // 代码大小       511 (0x1ff)
  .maxstack  4
  .locals init (class NotesData V_0,
            class NotesData V_1,
            class NotesData V_2,
            class NotesData V_3,
            class NotesData V_4,
            class NotesData V_5)
  
  //////////////////////////////////////////
  // if ((double) SingletonMonoBehaviour<SoundManager>.Instance.GetBGMCurrentTime() >= (double) target1.EndTime + (double) target1.HitCount * (double) this.adjustData.ThroughTime)
  // {
  //   if (target1.NotesType == RhysmGame.NotesType.Event)
  //     this.PlayEventNotes(target1);
  //   this.NotesViewer.SetActiveNotes(target1.Id);
  //   this.NotesQueueLeft.Dequeue();
  // }
  //////////////////////////////////////////
  IL_0024:  call       !0 class SingletonMonoBehaviour`1<class SoundManager>::get_Instance()
  IL_0029:  callvirt   instance float32 SoundManager::GetBGMCurrentTime()
  IL_002e:  ldloc.0
  IL_002f:  ldfld      float32 NotesData::EndTime
  IL_0034:  ldloc.0
  IL_0035:  ldfld      int32 NotesData::HitCount
  IL_003a:  conv.r4
  IL_003b:  ldarg.0
  IL_003c:  ldfld      class AdjustData RhysmGame::adjustData
  IL_0041:  ldfld      float32 AdjustData::ThroughTime
  IL_0046:  mul
  IL_0047:  add
  IL_0048:  blt.un     IL_0108

  IL_004d:  ldloc.0
  IL_004e:  ldfld      valuetype RhysmGame/NotesType NotesData::NotesType
  IL_0053:  ldc.i4.5
  IL_0054:  bne.un.s   IL_005d

  IL_0056:  ldarg.0
  IL_0057:  ldloc.0
  IL_0058:  call       instance void RhysmGame::PlayEventNotes(class NotesData)
  IL_005d:  ldarg.0
  IL_005e:  ldfld      class RhysmGameNotesViewer RhysmGame::NotesViewer
  IL_0063:  ldloc.0
  IL_0064:  ldfld      int64 NotesData::Id
  IL_0069:  ldc.i4.0
  IL_006a:  callvirt   instance void RhysmGameNotesViewer::SetActiveNotes(int64,
                                                                          bool)
  IL_006f:  ldarg.0
  IL_0070:  ldfld      class [netstandard]System.Collections.Generic.Queue`1<class NotesData> RhysmGame::NotesQueueLeft
  IL_0075:  callvirt   instance !0 class [netstandard]System.Collections.Generic.Queue`1<class NotesData>::Dequeue()
  IL_007a:  pop
  IL_007b:  br         IL_0108
  //////////////////////////////////////////

  // ......

  //////////////////////////////////////////
  // if ((double) SingletonMonoBehaviour<SoundManager>.Instance.GetBGMCurrentTime() < (double) target2.EndTime + (double) target2.HitCount * (double) this.adjustData.ThroughTime)
  //   return;
  // if (target2.NotesType == RhysmGame.NotesType.Event)
  //   this.PlayEventNotes(target2);
  // this.NotesViewer.SetActiveNotes(target2.Id);
  // this.NotesQueueRight.Dequeue();
  //////////////////////////////////////////
  IL_012c:  call       !0 class SingletonMonoBehaviour`1<class SoundManager>::get_Instance()
  IL_0131:  callvirt   instance float32 SoundManager::GetBGMCurrentTime()
  IL_0136:  ldloc.1
  IL_0137:  ldfld      float32 NotesData::EndTime
  IL_013c:  ldloc.1
  IL_013d:  ldfld      int32 NotesData::HitCount
  IL_0142:  conv.r4
  IL_0143:  ldarg.0
  IL_0144:  ldfld      class AdjustData RhysmGame::adjustData
  IL_0149:  ldfld      float32 AdjustData::ThroughTime
  IL_014e:  mul
  IL_014f:  add
  IL_0150:  blt.un     IL_01fe

  IL_0155:  ldloc.1
  IL_0156:  ldfld      valuetype RhysmGame/NotesType NotesData::NotesType
  IL_015b:  ldc.i4.5
  IL_015c:  bne.un.s   IL_0165

  IL_015e:  ldarg.0
  IL_015f:  ldloc.1
  IL_0160:  call       instance void RhysmGame::PlayEventNotes(class NotesData)
  IL_0165:  ldarg.0
  IL_0166:  ldfld      class RhysmGameNotesViewer RhysmGame::NotesViewer
  IL_016b:  ldloc.1
  IL_016c:  ldfld      int64 NotesData::Id
  IL_0171:  ldc.i4.0
  IL_0172:  callvirt   instance void RhysmGameNotesViewer::SetActiveNotes(int64,
                                                                          bool)
  IL_0177:  ldarg.0
  IL_0178:  ldfld      class [netstandard]System.Collections.Generic.Queue`1<class NotesData> RhysmGame::NotesQueueRight
  IL_017d:  callvirt   instance !0 class [netstandard]System.Collections.Generic.Queue`1<class NotesData>::Dequeue()
  IL_0182:  pop
  IL_0183:  ret
  //////////////////////////////////////////

  // ......

  IL_01fe:  ret
} // end of method RhysmGame::CheckTimeLimit
```

IL 代码太长, 贴了一下核心代码片段的对照. 我们要做的就是把 `SetJudgeResult` 里的 IL 代码片段添加到 `CheckTimeLimit` 里. 不同 IL 代码指令含义用法可以查询文档 [OpCodes Class](https://learn.microsoft.com/en-us/dotnet/api/system.reflection.emit.opcodes).

这里简单说一下每条指令运行格式, 方法运行中会有一个计算栈, 每条指令都规定了指令大小和参数数量, 调用前先将需要的参数进栈, 然后调用指令后, 调用的参数都会被出栈, 指令的返回结果被进栈. 可以把每条指令理解成遵循 stdcall 调用约定的函数.

在 IL 代码的方法里, 每条指令都有自己的地址 (十六进制), 并且下一行地址等于上一行地址加上上一行指令所占字节数. 同时对于流程控制, 会存在一些跳转指令来完成类似于 `if/else` 的逻辑判断.

明白上述关系后, 我们就可以依葫芦画瓢, 模仿现有的 IL 代码进行修改, 改完之后大概长这样.

```IL
.method public hidebysig instance void 
        CheckTimeLimit() cil managed
{
  // 代码大小       511 (0x1ff)
  .maxstack  4
  .locals init (class NotesData V_0,
            class NotesData V_1,
            class NotesData V_2,
            class NotesData V_3,
            class NotesData V_4,
            class NotesData V_5)
  
  //////////////////////////////////////////
  // if ((double) SingletonMonoBehaviour<SoundManager>.Instance.GetBGMCurrentTime() > (double) target1.EndTime)
  // {
  //   if (target1.NotesType == RhysmGame.NotesType.Event)
  //     this.PlayEventNotes(target1);
  //   if (this.IsAutoPlay && target1.NotesType == RhysmGame.NotesType.Temptation)
  //   {
  //     SingletonMonoBehaviour<SoundManager>.Instance.PlaySE("BattleSE", "Temptation");
  //     this.SetActiveTemptation(target1.AnimationId);
  //   }
  //   this.NotesViewer.SetActiveNotes(target1.Id);
  //   this.NotesQueueLeft.Dequeue();
  // }
  //////////////////////////////////////////
  IL_0024:  call       !0 class SingletonMonoBehaviour`1<class SoundManager>::get_Instance()
  IL_0029:  callvirt   instance float32 SoundManager::GetBGMCurrentTime()
  IL_002e:  ldloc.0
  IL_002f:  ldfld      float32 NotesData::EndTime
  IL_0034:  ble.un     IL_0125

  IL_0039:  ldloc.0
  IL_003a:  ldfld      valuetype RhysmGame/NotesType NotesData::NotesType
  IL_003f:  ldc.i4.5
  IL_0040:  bne.un.s   IL_0049

  IL_0042:  ldarg.0
  IL_0043:  ldloc.0
  IL_0044:  call       instance void RhysmGame::PlayEventNotes(class NotesData)
  IL_0049:  ldarg.0
  IL_004a:  ldfld      bool RhysmGame::IsAutoPlay
  IL_004f:  brfalse.s  IL_007a

  IL_0051:  ldloc.0
  IL_0052:  ldfld      valuetype RhysmGame/NotesType NotesData::NotesType
  IL_0057:  ldc.i4.4
  IL_0058:  bne.un.s   IL_007a

  IL_005a:  call       !0 class SingletonMonoBehaviour`1<class SoundManager>::get_Instance()
  IL_005f:  ldstr      "BattleSE"
  IL_0064:  ldstr      "Temptation"
  IL_0069:  callvirt   instance void SoundManager::PlaySE(string,
                                                          string)
  IL_006e:  ldarg.0
  IL_006f:  ldloc.0
  IL_0070:  ldfld      string NotesData::AnimationId
  IL_0075:  call       instance void RhysmGame::SetActiveTemptation(string)
  IL_007a:  ldarg.0
  IL_007b:  ldfld      class RhysmGameNotesViewer RhysmGame::NotesViewer
  IL_0080:  ldloc.0
  IL_0081:  ldfld      int64 NotesData::Id
  IL_0086:  ldc.i4.0
  IL_0087:  callvirt   instance void RhysmGameNotesViewer::SetActiveNotes(int64,
                                                                          bool)
  IL_008c:  ldarg.0
  IL_008d:  ldfld      class [netstandard]System.Collections.Generic.Queue`1<class NotesData> RhysmGame::NotesQueueLeft
  IL_0092:  callvirt   instance !0 class [netstandard]System.Collections.Generic.Queue`1<class NotesData>::Dequeue()
  IL_0097:  pop
  IL_0098:  br         IL_0125
  //////////////////////////////////////////

  // ......

  //////////////////////////////////////////
  // if ((double) SingletonMonoBehaviour<SoundManager>.Instance.GetBGMCurrentTime() <= (double) target2.EndTime)
  //   return;
  // if (target2.NotesType == RhysmGame.NotesType.Event)
  //   this.PlayEventNotes(target2);
  // if (this.IsAutoPlay && target2.NotesType == RhysmGame.NotesType.Temptation)
  // {
  //   SingletonMonoBehaviour<SoundManager>.Instance.PlaySE("BattleSE", "Temptation");
  //   this.SetActiveTemptation(target2.AnimationId);
  // }
  // this.NotesViewer.SetActiveNotes(target2.Id);
  // this.NotesQueueRight.Dequeue();
  //////////////////////////////////////////
  IL_0149:  call       !0 class SingletonMonoBehaviour`1<class SoundManager>::get_Instance()
  IL_014e:  callvirt   instance float32 SoundManager::GetBGMCurrentTime()
  IL_0153:  ldloc.1
  IL_0154:  ldfld      float32 NotesData::EndTime
  IL_0159:  ble.un     IL_0238

  IL_015e:  ldloc.1
  IL_015f:  ldfld      valuetype RhysmGame/NotesType NotesData::NotesType
  IL_0164:  ldc.i4.5
  IL_0165:  bne.un.s   IL_016e

  IL_0167:  ldarg.0
  IL_0168:  ldloc.1
  IL_0169:  call       instance void RhysmGame::PlayEventNotes(class NotesData)
  IL_016e:  ldarg.0
  IL_016f:  ldfld      bool RhysmGame::IsAutoPlay
  IL_0174:  brfalse.s  IL_019f

  IL_0176:  ldloc.1
  IL_0177:  ldfld      valuetype RhysmGame/NotesType NotesData::NotesType
  IL_017c:  ldc.i4.4
  IL_017d:  bne.un.s   IL_019f

  IL_017f:  call       !0 class SingletonMonoBehaviour`1<class SoundManager>::get_Instance()
  IL_0184:  ldstr      "BattleSE"
  IL_0189:  ldstr      "Temptation"
  IL_018e:  callvirt   instance void SoundManager::PlaySE(string,
                                                          string)
  IL_0193:  ldarg.0
  IL_0194:  ldloc.1
  IL_0195:  ldfld      string NotesData::AnimationId
  IL_019a:  call       instance void RhysmGame::SetActiveTemptation(string)
  IL_019f:  ldarg.0
  IL_01a0:  ldfld      class RhysmGameNotesViewer RhysmGame::NotesViewer
  IL_01a5:  ldloc.1
  IL_01a6:  ldfld      int64 NotesData::Id
  IL_01ab:  ldc.i4.0
  IL_01ac:  callvirt   instance void RhysmGameNotesViewer::SetActiveNotes(int64,
                                                                          bool)
  IL_01b1:  ldarg.0
  IL_01b2:  ldfld      class [netstandard]System.Collections.Generic.Queue`1<class NotesData> RhysmGame::NotesQueueRight
  IL_01b7:  callvirt   instance !0 class [netstandard]System.Collections.Generic.Queue`1<class NotesData>::Dequeue()
  IL_01bc:  pop
  IL_01bd:  ret
  //////////////////////////////////////////

  // ......

  IL_0238:  ret
} // end of method RhysmGame::CheckTimeLimit
```

修改逻辑是比较简单的, 只需要添加几行 IL 代码即可, 但是改完之后还有**一件最重要的事情**, 就是更新该方法下面所有的地址, 确保修改后每一行地址以及跳转指令的目标地址都是新的正确的地址.

这部分自己怎么顺手怎么来了, 反正能正确改好就行, 相当于是人肉编译器了.

改完之后用 ilasm 把 IL 文件重新编回 dll 文件, **备份一下原始的 Assembly-CSharp.dll**, 然后用新的替换掉它, 也可以用 dotPeek 导出一下新的 dll 文件看看源代码逻辑是不是符合预期.

至此一个简单的 Mod 就制作完成了, 可以进游戏愉快的~~涩涩~~游玩了.

## 汉化 Mod

### 准备工作

既然都做了功能 Mod, 我寻思顺便也了解一下汉化 Mod 怎么打, 因为感觉应该不难, 毕竟之前有一些 Unity 游戏的拆包经验, 我猜测就是把文本资源拆出来, 然后替换成汉化, 再重新装回去就行了.

所以关键解决两个问题, 怎么定位资源, 怎么拆/装资源.

关于资源定位, 最简单的方式是先拆包然后搜字符串.

网上大部分都推荐 [AssetStudio](https://github.com/Perfare/AssetStudio), 但是已经很久没维护了, 对新版本 Unity 支持似乎有问题, 可以换成[某 fork 版本](https://github.com/zhangjiequan/AssetStudio)试试.

另外也可以用 [AssetRipper](https://github.com/AssetRipper/AssetRipper) 导出资源, 方便我们定位文本位置.

然后是资源文件的编辑, 网上很多教程还是用的 [UABE](https://github.com/SeriousCache/UABE), 但是也已经很久没维护了, 新版本也有问题, 可以换成 [UABEA](https://github.com/nesrak1/UABEA).

### 定位资源

这里我们用 AssetRipper 把整个游戏 Data 目录下面的东西全部导出, 加载一整个文件夹然后导出原始内容 (Export Primary Content).

接着在导出的内容里面直接搜索游戏内文本, 可以发现位于 `MonoBehaviour/ScenarioDataSO.json` 内, 进去查看, 可以发现该资源位于文件 `sharedassets0.assets` 里.

此时可以在 AssetRipper 里已导入内容里 View 一下, 记录一下 `ScenarioDataSO` 的 Path ID.

### 修改资源

用 UABEA 打开文件 `sharedassets0.assets`, 根据名称或者 Path ID 找到 `ScenarioDataSO`, 然后使用 `Export Dump` 按钮导出该资源内容.

此时我们将该文件里的文本进行汉化, 汉化完成后, 再使用同样的操作, 找到刚刚的 `ScenarioDataSO` 并使用 `Import Dump` 导入修改后的文件进行替换, **替换之前请备份一份原文件**, 然后保存即完成了资源的重新封装. 进入游戏内查看, 可以发现已经汉化成功.

需要注意仔细甄别需要汉化的文本到底在哪, 因为开发者可能用非英语作为程序需要的内容 (非显示文本), 这些影响程序的文本是不能动的.

## 参考

1. [Unity引擎类游戏MOD制作通用教程](https://zhuanlan.zhihu.com/p/67432630)
2. [[Unity3D-游戏汉化教程]第3期：MonoBehaviour](https://www.bilibili.com/video/BV1k54y1z7oY/)
