# 10 — Navora 调用桥接（预留）

Navora Flow 启动后会在本机打开 **仅监听 `127.0.0.1`** 的 HTTP 桥，并把发现信息写到数据目录：

```text
<portable|data>/bridge.json
```

示例：

```json
{
  "enabled": true,
  "host": "127.0.0.1",
  "port": 54321,
  "url": "http://127.0.0.1:54321",
  "protocolVersion": 0
}
```

## 协议 v0

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | `{ ok, service: "navora-flow" }` |
| GET | `/v1/catalog` | 节点目录 |
| POST | `/v1/run` | body `{ graph }` → `RunResult` |

## Navora 侧后续接入建议

1. 读取用户机器上 Flow 的 `bridge.json`（或约定数据目录）  
2. `POST /v1/run` 下发图；或先 `GET /v1/catalog` 给 Agent 当工具描述  
3. 后期可升级为：鉴权 token、命名管道、把 Flow 节点注册成 Navora plugin tools  

关闭桥接：环境变量 `NAVORA_FLOW_BRIDGE=0`（当前实现默认开启；可在后续补开关）。
