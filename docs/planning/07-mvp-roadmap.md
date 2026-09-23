# 07 — MVP 与路线图

## Phase 0 — 规划与骨架（当前）

- [x] 临时文档目录与对标分析  
- [x] 流程 Debug 规划（[09-debug.md](./09-debug.md)）  
- [x] 定产品名；三仓已建并本地 clone  
- [x] 各仓初始 README / LICENSE / 骨架 + Vitest / GitHub Actions  
- [x] SDK：校验 / 依赖解析 / FlowRuntime + Debug 钩子  
- [x] libraries：builtin-core + codec-core  
- [x] desktop：Vue + Vue Flow 编辑器 + 托盘 + IPC 运行时 + Navora Bridge 预留  
- [ ] 工程打开/保存 `.nflow`、库 zip 导入、正式断点 UI  
- [ ] Navora 侧正式消费 Bridge / 注册为 Agent 工具

## Phase 1 — MVP（可演示）

**目标**：双线图可编辑、可运行；第三方库可导入；**跑完能看见中间值**。

| 项 | 验收 |
|----|------|
| 画布 | 拖节点、连 exec/data、删改、缩放平移 |
| 内置库 | main / exit / if / log / string.concat |
| 运行 | 从 main 跑到 exit；日志面板可点击跳转节点 |
| **执行回放** | Run 结束后点节点可看 **上次 Inputs/Outputs**；失败节点标红 |
| 工程 | 打开/保存 `graph.json` |
| 第三方库 | `codec-core` zip 导入 → 工具箱出现 decode/encode → 可运行 |
| 依赖 | `demo-vision` 依赖 `codec-core`；只装前者时提示安装后者 |
| 校验 | 类型不匹配不能连；缺 main 不能跑 |
| Runtime | 解释器内预留 `before/after` 暂停钩子（为 Phase 2 断点铺路） |

**刻意不做**：子流程、并行、沙箱隔离、商店、AI、条件断点、Step Into。

## Phase 2 — 可用 + 正式 Debug（v0.2）

- **Debug 模式**：节点断点、Continue / Step Over / Stop  
- 暂停帧 + IO 检视面板；画布高亮当前节点与将走 exec 边  
- `debug.json` 持久化断点；`breakOnException`  
- 属性面板（JSON Schema 表单）  
- 节点搜索、分类折叠  
- 锁定文件与版本冲突 UI  
- 外链目录热更（开发体验）  
- 基础能力门闩（fs/net）  
- 官方第二库：`image-basic`  
- `AbortSignal`：Stop 可打断长时间节点  

## Phase 3 — 生产力（v0.3）

- Step Into / Step Out、子流程调用栈  
- 条件断点、日志断点  
- bytes/图像等专用预览器  
- Pure 节点惰性求值（可选）  
- 错误 exec 出口惯例  
- 流程图示导出（PNG）  
- CLI：`nf run` / `nf debug`（可选）  

## Phase 4 — 生态（v1）

- 本地/远程目录仓  
- 库签名与更新检查  
- Worker/进程隔离执行（Debug 协议跟着走）  
- 原生产物多平台  
- 轨迹导出 / 简易时间线回放  
- 可选：简化「捷径模式」UI  
- 可选：与 Navora 互通——仅当有明确需求  

## 工作量粗估（1 人全职，量级）

| 阶段 | 量级 |
|------|------|
| Phase 1 MVP（含 IO 回看） | 3–6 周 |
| Phase 2（正式断点单步） | +3–5 周 |
| Phase 3 | +4–8 周 |

## 建仓后第一个里程碑建议

1. `library-sdk`：`library.json` schema + `nf-lib build/pack`  
2. `desktop`：Catalog + 画布 + Runtime（**带快照与钩子**）跑通 builtin  
3. zip 导入与依赖解析  
4. Phase 2 立刻接断点 UI，不另起解释器
