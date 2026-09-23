# Navora Flow — 规划文档

> 产品：**Navora Flow**（可视化流程执行器，非 AI Agent）  
> 组织：[navora-harness](https://github.com/navora-harness)  
> 仓库布局：**三仓并列**（与 Navora 同款拆分）

## 仓库

| 仓库 | 职责 |
|------|------|
| [navora-flow-desktop](https://github.com/navora-harness/navora-flow-desktop) | Electron 宿主：编辑器、运行时、Debug |
| [navora-flow-library-sdk](https://github.com/navora-harness/navora-flow-library-sdk) | 运行库契约、SPEC、CLI（`nf-lib`） |
| [navora-flow-libraries](https://github.com/navora-harness/navora-flow-libraries) | 官方运行库源码 |

本地建议并列 checkout（已在 `navora-harness/` 下）：

```text
navora-harness/
├── navora-flow-desktop/       # 本仓；规划文档在 docs/planning/
├── navora-flow-library-sdk/
└── navora-flow-libraries/
```

## 文档索引

| 文件 | 内容 |
|------|------|
| [01-vision.md](./01-vision.md) | 产品定位、非目标、用户场景 |
| [02-market.md](./02-market.md) | 市面同类产品对比与可借鉴点 |
| [03-architecture.md](./03-architecture.md) | 整体架构：编辑器 / 运行时 / 插件宿主 |
| [04-plugin-runtime.md](./04-plugin-runtime.md) | 运行库契约、依赖解析、节点注册 |
| [05-graph-model.md](./05-graph-model.md) | 图模型：控制流 + 数据流、main/exit |
| [06-tech-stack.md](./06-tech-stack.md) | 技术选型建议与和 Navora 的关系 |
| [07-mvp-roadmap.md](./07-mvp-roadmap.md) | MVP 与分阶段路线图 |
| [08-open-questions.md](./08-open-questions.md) | 待决策问题清单 |
| [09-debug.md](./09-debug.md) | 流程 Debug（断点 / 单步 / 检视） |
| [10-navora-bridge.md](./10-navora-bridge.md) | 供 Navora 调用的本地桥接协议 |
| [11-automation.md](./11-automation.md) | 浏览器自动化、运行环境、流 IO、跑完清理 |

## 一句话产品

本地桌面端的可视化流程执行器：捷径式拼流程 + Blueprints 式执行/数据双线 + 可互相依赖的第三方运行库；支持流程级 Debug。
