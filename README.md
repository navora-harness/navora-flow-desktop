# Navora Flow

本地桌面端**可视化流程执行器**（非 AI Agent）：节点图编排、可依赖的第三方运行库、流程 Debug。

| 仓库 | 职责 |
|------|------|
| **本仓** | Electron 宿主：编辑器、运行时、Debug |
| [navora-flow-library-sdk](https://github.com/navora-harness/navora-flow-library-sdk) | 运行库契约 / SPEC / CLI / FlowRuntime |
| [navora-flow-libraries](https://github.com/navora-harness/navora-flow-libraries) | 官方运行库源码 |

规划文档：[`docs/planning/`](./docs/planning/README.md)

## 本地布局

```text
navora-harness/
├── navora-flow-desktop/         # 本仓
├── navora-flow-library-sdk/     # 需先 npm run build
└── navora-flow-libraries/
```

## 开发

```bash
# 1) SDK
cd ../navora-flow-library-sdk && npm install && npm run build

# 2) Desktop
cd ../navora-flow-desktop
npm install
npm test
npm run electron:dev
```

| 命令 | 说明 |
|------|------|
| `npm test` | Vitest（演示流程运行） |
| `npm run test:watch` | 监视模式 |
| `npm run typecheck` | Vue/TS 检查 |
| `npm run electron:dev` | Vite + Electron |
| `npm run build` | 渲染进程 + 主进程构建 |

CI：`.github/workflows/test.yml`

## License

MIT
