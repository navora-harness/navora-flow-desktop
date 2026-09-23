# 03 — 整体架构

## 1. 分层总览

```text
┌─────────────────────────────────────────────────────────┐
│  Renderer：图编辑器 UI（画布 / 节点面板 / 属性 / 调试）     │
└───────────────────────────┬─────────────────────────────┘
                            │ IPC / RPC
┌───────────────────────────▼─────────────────────────────┐
│  Main：Host                                              │
│  ├─ ProjectStore（打开/保存流程工程）                      │
│  ├─ LibraryRegistry（已安装运行库索引）                    │
│  ├─ DependencyResolver（版本 / 依赖 DAG）                 │
│  ├─ NodeCatalog（合并所有库导出的节点描述 → 给编辑器）      │
│  ├─ GraphValidator（类型、必连口、环检测策略）             │
│  ├─ FlowRuntime（解释执行 / 日后可编译）                   │
│  └─ Sandbox / CapabilityGate（可选能力门闩）              │
└───────────────────────────┬─────────────────────────────┘
                            │ load / call
┌───────────────────────────▼─────────────────────────────┐
│  Runtime Libraries（插件）                                │
│  ├─ builtin-core（main/exit/if/for/var…）                 │
│  ├─ codec-core                                            │
│  ├─ image-vision（depends: codec-core, tensor-rt）        │
│  └─ … 第三方 zip / 外链目录                               │
└─────────────────────────────────────────────────────────┘
```

## 2. 两大进程职责

| 进程 | 职责 |
|------|------|
| **渲染进程** | 画布交互、表单、主题；**不**直接 `require` 第三方库（安全与稳定性） |
| **主进程** | 加载运行库、执行节点、文件/网络等副作用、权限检查 |

调试时主进程把「当前节点 id、端口快照、日志」推给渲染进程高亮。

## 3. 核心子系统

### 3.1 NodeCatalog（节点目录）

- 启动 / 导入库后扫描所有启用库的 `nodes` 清单
- 输出给 UI：`{ id, title, category, ports, propsSchema, libraryId, version }`
- 库禁用或卸载 → 目录移除；已打开图中若仍引用 → 标红「缺失节点」

### 3.2 FlowRuntime + DebugSession（执行器）

默认实现：**可调试的解释器**（不是事后打补丁）。按执行边走，并在每个节点前后挂暂停钩子：

1. 从 `main` 出发  
2. 解析当前节点 data 输入  
3. **Debug**：若应在 `before` 停 → 推送 `DebugPauseFrame`，等待 Continue/Step/Stop  
4. 调用库 `execute(...)`（传入 `AbortSignal`）  
5. 写入 outputs；**Debug**：若应在 `after` 停 → 再暂停  
6. 沿 exec 出口前进；碰到 `exit` / 无后继 / Stop / 未处理异常则结束  

即使是 **Run** 模式，也默认留下每节点 IO 快照，供结束后点选回看（可配置关闭）。

完整断点/单步/面板见 [09-debug.md](./09-debug.md)。后续可加：异步节点、并行 exec、超时、子图调用栈。

### 3.3 LibraryRegistry + DependencyResolver

见 [04-plugin-runtime.md](./04-plugin-runtime.md)。

### 3.4 Project 格式

推荐工程目录（便于资源与相对路径）：

```text
MyFlow.nflow/
├── project.json          # 元数据、依赖的库 id@version
├── graph.json            # 节点与边
├── debug.json            # 断点与调试偏好（可选，可不入库）
├── assets/               # 流程自带资源
└── .locks/libraries.json # 解析后的库锁定版本（可选）
```

也可用单文件 `.nflow.json` 做轻量分享；复杂项目用目录。

## 4. 与 Navora 架构的对照（可复用 / 勿复用）

| Navora | 本产品 | 建议 |
|--------|--------|------|
| AgentRuntime + LLM tool calling | FlowRuntime + 图解释 | **勿复用**主路径 |
| PluginStore + zip/外链 | LibraryRegistry | **可复用思路与目录布局** |
| `planPermissions` / Capability | Library capability 声明 | **可简化复用** |
| Chat / BrowserSession | 无 | 不做 |
| Skills | 可对应「官方示例流程」 | 后期 |
| plugin-sdk SPEC | library-sdk SPEC | **新写契约**，可抄清单/CLI 形态 |

## 5. 安全边界（务必尽早定）

运行库拥有本地代码执行能力，风险接近「装软件」。

| 级别 | 策略 |
|------|------|
| MVP | 高信任：同主进程加载（与 Navora 类似），UI 明确「第三方代码」警告 |
| v1 | 能力门闩：fs / net / child_process / native；首次授权 |
| v2 | Worker / 独立进程隔离；或 WASM 沙箱（适合纯计算节点） |

不要在 MVP 上过度工程化沙箱，但清单里要预留 `capabilities[]` 字段。
