# Navora Flow

本地桌面端**可视化流程执行器**（非 AI Agent）：节点图编排、可依赖的第三方运行库、流程 Debug、系统托盘常驻；预留本机 HTTP 桥供日后 **Navora 调用**。

| 仓库 | 职责 |
|------|------|
| **本仓** | Electron 宿主：编辑器、运行时、托盘、Bridge |
| [navora-flow-library-sdk](https://github.com/navora-harness/navora-flow-library-sdk) | 运行库契约 / SPEC / CLI / FlowRuntime |
| [navora-flow-libraries](https://github.com/navora-harness/navora-flow-libraries) | 官方运行库源码 |

规划文档：[`docs/planning/`](./docs/planning/README.md) · Navora 桥接：[`docs/planning/10-navora-bridge.md`](./docs/planning/10-navora-bridge.md)

## 功能（当前）

- 三栏编辑器：节点面板 / Vue Flow 画布（exec 绿线 + data 蓝口）/ 属性与 IO 检视
- 主进程 `HostRuntime` 执行图；关闭窗口进托盘，托盘可显示/退出
- 单实例；窗口位置记忆（`portable/window-state.json`）
- 本机 Bridge：`portable/bridge.json` → `GET /health` · `GET /v1/catalog` · `POST /v1/run`

## 开发

```bash
cd ../navora-flow-library-sdk && npm install && npm run build
cd ../navora-flow-desktop
npm install
npm test
npm run electron:dev
```

| 命令 | 说明 |
|------|------|
| `npm test` | Vitest |
| `npm run typecheck` | Vue/TS |
| `npm run electron:dev` | Vite + Electron |
| `npm run electron:install` | 用镜像补下 Electron 二进制 |

关闭 Bridge：`NAVORA_FLOW_BRIDGE=0`。打开 DevTools：`NAVORA_FLOW_OPEN_DEVTOOLS=1`。

## License

MIT
