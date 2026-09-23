# 11 — 浏览器自动化与运行环境

## 目标

在 Navora Flow 内复用 **Navora 同款 browser_* 自动化面**，并保证：

1. 每次运行有独立 **RunEnvironment**（env / 变量 / 流 IO / 资源表）  
2. 浏览器 Session / Window 登记到资源表  
3. **无论成功失败，流程结束后 dispose 全部会话与窗口**

## 节点面（已注册）

与 Navora `agent-tools` 对齐的工具名（节点用点分，宿主 invoke 用下划线）：

- 会话：`browser.session.*`、`browser.open`
- 窗口：`browser.window.*`
- 导航 / 交互 / 读取：navigate、click、type、wait、evaluate、screenshot…
- 网络高级 / upload / dialog / load_url_with_response：**已挂目录**，部分宿主返回 `unsupported`（继续往 Navora 完整行为补齐）

Agent 专属（`agent_ask_user` / 子对话）不在 Flow 图节点内；由 Navora 侧编排时走 Bridge。

## 运行环境节点

| 类型 | 作用 |
|------|------|
| `env.get` / `env.set` | 进程级环境变量（本 run 覆盖） |
| `var.get` / `var.set` | 流程变量 |
| `io.stdin_read` / `io.stdout` / `io.stderr` | 流缓冲；结果在 `RunResult.streams` |

Bridge / IPC：`POST /v1/run` 与 `nf:runGraph` 可传 `{ env, vars, stdin }`。

## 清理语义

`FlowRuntime.run({ cleanupResources: true })`（默认）：

```text
try { execute graph }
finally { await run.resources.disposeAll() }  // 关闭全部 browser_session / browser_window
```

`RunResult.cleanedUp === true` 表示清理完成。
