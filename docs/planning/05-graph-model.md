# 05 — 图模型（控制流 + 数据流）

## 1. 设计原则

采用 **Unreal Blueprints 风格**：

- **执行边（Exec）**：决定「下一步跑谁」
- **数据边（Data）**：决定「值从哪来」
- 节点可有 **属性（Props）**：常量配置，不占口

这样比纯捷径列表更强，比纯 Node-RED msg 在分支/多输出时更可读。

## 2. 内置流程节点

| 类型 | 作用 |
|------|------|
| `flow.main` | 唯一入口（每图一个）；仅有 exec out |
| `flow.exit` | 结束；可选 data in 作为「流程返回值」 |
| `flow.if` | exec in → then/else；data: condition:bool |
| `flow.sequence` | 一个 exec in，顺序触发多个 exec out（Then0, Then1…） |
| `flow.forEach` | 后期：集合迭代 |
| `flow.subgraph` | 后期：调用子流程 |

## 3. 端口类型系统（MVP 宜简）

### 3.1 内置标量 / 结构

`void`（仅 exec）、`bool`、`number`、`string`、`bytes`、`json`、`any`

### 3.2 库可注册具名类型

```json
{ "id": "ImageBuffer", "library": "image-basic" }
```

连线规则（MVP）：

- 类型全等 → 可连  
- `T → any` 可连；`any → T` 可连但运行时校验  
- 不兼容 → UI 禁止吸附并提示  

后期再加：泛型、联合类型、自动转换节点（如 `string → number`）。

## 4. graph.json 草案

```json
{
  "schemaVersion": 1,
  "nodes": [
    {
      "id": "n1",
      "type": "flow.main",
      "x": 80,
      "y": 120,
      "props": {}
    },
    {
      "id": "n2",
      "type": "codec.base64.decode",
      "library": "codec-core",
      "libraryVersion": "1.0.0",
      "x": 280,
      "y": 120,
      "props": { "urlSafe": false }
    }
  ],
  "edges": [
    {
      "id": "e1",
      "kind": "exec",
      "from": { "node": "n1", "port": "then" },
      "to": { "node": "n2", "port": "exec" }
    },
    {
      "id": "e2",
      "kind": "data",
      "from": { "node": "n2", "port": "bytes" },
      "to": { "node": "n3", "port": "image" }
    }
  ]
}
```

## 5. 执行语义（MVP）

1. 校验：恰好一个 `flow.main`；所有 required data 口有连线或 props 默认值。  
2. 从 main 的 exec 出发，维护 `values[nodeId][portId]`。  
3. 进入节点前：解析其所有 data 输入（若上游尚未执行 → **按数据依赖先求值** 或 **报错要求先走 exec**）。  

**推荐 MVP 策略（简单可预测）**：

> 只沿 exec 边推进；数据口的上游节点必须已经在本轮执行路径中运行过，否则报错「数据未就绪」。

这逼用户把「纯计算」也挂在 exec 链上（或提供 `flow.pure` 后期优化），但语义最清晰，调试最好做。

**备选（更像 Blueprints Pure）**：无 exec 的纯函数节点可在被拉取时惰性求值。放到 v1 再做。

## 6. 错误与分支

- 节点可声明多个 exec out：`then` / `error`  
- 未连接的 `error` → 默认中止流程并报告  
- 运行日志：`nodeId, type, durationMs, error?`

## 7. 编辑器交互要点

- 工具箱按 **库 → 分类 → 节点** 树  
- 拖入画布生成实例  
- 同 kind 口可连；exec 与 data **不能混连**  
- 选中节点 → 右侧 Props 表单（JSON Schema → 表单）  
- **运行 / 调试**：高亮当前节点与 exec 边；暂停时右侧切到 IO 检视  
- 节点角标断点；调试中画布只读  
- 缺失库的节点显示占位与「去安装」  
- 详见 [09-debug.md](./09-debug.md)

## 8. 和「捷径」体验的折中

对不喜欢「双线」的用户，可后期提供 **简化模式**：自动隐藏 exec 线，按纵向自动排序（看起来像捷径列表），底层仍存双线图。MVP 不必做。
