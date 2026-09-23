# 09 — 流程 Debug（一等能力）

Debug 不是后期插件，而是 **FlowRuntime 的一等模式**。解释器从第一天就按「可暂停、可检视」设计；UI 可分阶段补齐。

## 1. 对标与目标体验

| 参考 | 可借鉴 |
|------|--------|
| VS Code / 传统调试器 | Continue / Step Over / Stop、断点、变量面板 |
| Unreal Blueprints Debug | 当前节点高亮、针脚值悬浮、断点停在节点上 |
| n8n | 每次运行留下各节点输出；点节点看上次 IO |
| Node-RED | 节点状态点（绿/红）、msg 完整度较弱 |
| 捷径 | 几乎无真断点，反面教材 |

**目标体验**：像给流程图做了一个迷你 IDE 调试器——能停、能单步、能看每个口上的值、能从失败节点接着查。

## 2. 两种运行模式

| 模式 | 行为 |
|------|------|
| **Run** | 全速执行；仍记录轨迹与每节点 IO 快照（可配置关闭以提速） |
| **Debug** | 命中断点 / 单步 / 异常时暂停；UI 进入调试壳 |

工具栏建议：`运行` | `调试` | `继续` | `单步` | `步出` | `停止`（未在调试会话时后四者禁用）。

## 3. DebugSession 状态机

```text
idle ──start──▶ running ──hit──▶ paused ──continue/step──▶ running
                   │                │
                   │                └── stop/exit ──▶ idle
                   └── error/exit ──────────────────▶ idle
```

主进程持有 `DebugSession`；渲染进程只订阅事件与发命令。

### 3.1 会话快照（暂停时推给 UI）

```ts
interface DebugPauseFrame {
  reason: 'breakpoint' | 'step' | 'exception' | 'entry' // entry=调试启动停在 main 后第一节点前（可选）
  nodeId: string
  nodeType: string
  execPortIn?: string
  /** 即将执行前：已解析的 inputs；执行后：outputs */
  phase: 'before' | 'after'
  inputs: Record<string, unknown>   // 大对象可截断 / 懒加载
  outputs?: Record<string, unknown>
  props: Record<string, unknown>
  stack: Array<{ graphId: string; nodeId: string }>  // 子流程用
  error?: { message: string; stack?: string }
}
```

## 4. 断点模型

### 4.1 节点断点（MVP 必做）

- 画布节点左上角切换断点（实心 = 启用，空心 = 禁用）
- 存在工程旁路文件，避免污染逻辑图：

```text
MyFlow.nflow/
├── graph.json
└── debug.json          # 断点与调试偏好，可不提交
```

```json
{
  "breakpoints": [
    { "nodeId": "n2", "enabled": true, "when": "before" }
  ],
  "breakOnException": true,
  "stopOnEntry": false
}
```

`when`: `before`（进入节点、已算好 inputs 后、调用 `execute` 前）| `after`（execute 返回后）。

### 4.2 后期断点

| 类型 | 说明 |
|------|------|
| 条件断点 | 表达式基于 inputs/props，如 `inputs.n > 10` |
| 数据断点 | 某 data 口值变化时停（较少见，可很后） |
| 日志断点 | 不停、只打一行（类似 VS logpoint） |
| Exec 边断点 | 停在「将要沿某条 exec 边走」时 |

## 5. 步进语义（针对图，不是针对源码行）

| 命令 | 含义 |
|------|------|
| **Continue** | 跑到下一断点 / 结束 / 异常 |
| **Step Over** | 执行**当前节点**完整 `execute`，停在**下一条 exec 边指向的节点**的 `before` |
| **Step Into** | 若当前是子流程节点 → 进入子图第一个节点；否则 = Step Over |
| **Step Out** | 子图内：跑完直到返回调用方节点的 `after`；顶层 = Continue 到结束 |
| **Stop** | 取消执行，会话结束；已产生的副作用不自动回滚 |

MVP 无子流程时：**Continue + Step Over + Stop** 足够；Into/Out 预留 API。

## 6. 检视面板（Watch / IO）

暂停或运行结束后可选中节点查看：

1. **Inputs / Outputs**：结构化树；`bytes`/`ImageBuffer` 显示长度 +「在预览器打开」  
2. **Props**  
3. **上次运行结果**（Run 模式也保留，形成「时间旅行只读」——n8n 同款，极有用）  
4. **执行轨迹**：有序列表 `main → decode → if(then) → exit`，点击可跳转画布  

大对象策略：默认截断预览（如 string 前 2KB、数组前 20 项）；点「加载完整」再 IPC 拉全量，避免卡 UI。

## 7. 画布反馈

| 状态 | 视觉 |
|------|------|
| 从未跑到 | 默认样式 |
| 已成功执行 | 左边一点绿 / 边框淡绿 |
| 当前暂停 | 强高亮 + 脉冲 |
| 将要走的 exec 边 | 高亮该边 |
| 失败节点 | 红；可选自动打开错误面板 |
| 有断点 | 节点角标 |

运行中禁止改图结构（或改图即提示「停止调试后才能编辑」）——**MVP 建议：paused/running 时画布只读**。

## 8. Runtime 钩子（实现要点）

解释器伪代码：

```text
for each exec step:
  resolve inputs
  if session.shouldPause(node, 'before'): await session.pause(...)
  try:
    result = await library.execute(...)
  catch e:
    if breakOnException: await session.pause(..., exception)
    else: abort
  write outputs
  if session.shouldPause(node, 'after'): await session.pause(...)
  follow execOut edge
```

`shouldPause` = 断点匹配 | step 模式 | stopOnEntry。

**取消**：`NodeExecContext.signal: AbortSignal`，库作者应在长时间循环里检查；Stop 时 abort。

## 9. 库作者配合（SDK）

不必为 Debug 写特殊逻辑，但建议：

- 尊重 `ctx.signal`  
- 避免在 `execute` 外藏全局可变状态（否则单步观感诡异）  
- 可选实现 `preview?(value): PreviewDescriptor` 改善 bytes/图像展示  

清单可标记：`"debug": { "sideEffect": true }`，UI 在单步时警告「此节点有外部副作用」。

## 10. 与路线图的关系（已上调优先级）

| 阶段 | Debug 交付 |
|------|------------|
| **Phase 1 MVP** | Runtime 预留 pause 钩子；Run 后可点节点看 **上次 IO**；失败节点标红；日志可跳转节点 |
| **Phase 2** | **正式 Debug 模式**：节点断点、Continue / Step Over / Stop、暂停帧、IO 面板、画布高亮 |
| **Phase 3** | Step Into/Out、条件断点、子流程调用栈、值预览器（图/hex） |
| **Phase 4** | 远程/无头调试、轨迹导出、时间线回放 |

原则：**第一次能跑流程时，就要能「看见中间值」**；完整断点单步紧随其后，不拖到「生产力阶段」才开始。

## 11. 非目标（避免过度）

- 不调试库内部 JS 源码行（那是 VS Code 的事；可文档说明「用普通 Node 调试器挂宿主」）  
- 不做自动撤销副作用（文件写出去了就回不来）  
- MVP 不做分布式/多进程附着调试
