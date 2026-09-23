# 06 — 技术选型建议

## 1. 总原则

你已有 **Electron + Vue 3 + TypeScript + 插件 zip/SDK** 的成熟经验（Navora）。新产品除非有强理由，否则 **延续同一宿主技术栈**，把创新点放在「图模型 + 运行库依赖」而不是换框架。

## 2. 推荐栈（默认方案）

| 层 | 推荐 | 备选 |
|----|------|------|
| 桌面壳 | Electron（可继续 unofficial 若你有既有镜像/补丁需求） | Tauri 2（更轻，但原生插件/.node 更折腾） |
| UI | Vue 3 + Vite + TS | React（仅当你锁定 React Flow 生态） |
| UI 组件 | 轻量自研 + 少量组件库；不必 Vuetify 全家桶 | Naive UI / Element Plus |
| 画布 | **@vue-flow/core** 或 **LogicFlow** | React Flow（需 React 岛或整前端 React） |
| 主进程 | Node/Electron Main | — |
| 库格式 | CJS/`main.cjs` 同进程加载（MVP） | Worker 线程 / 子进程（v1） |
| 包管理思维 | semver + lockfile | — |
| 测试 | vitest（图校验、依赖解析纯逻辑） | — |

### 画布库怎么选

| 库 | 优点 | 缺点 |
|----|------|------|
| **@vue-flow/core** | Vue 原生、社区活、定制节点容易 | 业务（exec/data 双线）要自己做 |
| **LogicFlow** | 国产文档友好、有 engine 包可参考 | 心智偏「流程图」，双线要自定义 |
| **FlowGram** | 工作流/变量/表单很全 | 偏 AI 工作流平台，可能过重 |
| **React Flow** | 生态最强 | 与 Vue 宿主割裂 |

**建议**：MVP 用 `@vue-flow/core`，自己实现 exec/data 两种边样式与连接规则。

## 3. 仓库拆分（建仓时）

与 Navora 四仓类似，但更干净：

```text
<product>-desktop      # 宿主
<product>-library-sdk  # SPEC + 类型 + CLI
<product>-libraries    # 官方库源码 monorepo
```

商店仓可后期再加。

## 4. 不要从 Navora 直接 fork 的原因

- 大量 Chat / Agent / Browser 代码会变成噪声  
- 插件契约是 **Tool** 不是 **Node**  
- 许可与品牌若分开更清晰  

**可搬运的是**：打包脚本思路、便携 data 目录、导入 zip UX、外链热更、能力门闩骨架——以「抄设计」而非「抄大段业务代码」为主。

## 5. 原生扩展（图像 / 编解码）

后期库可能带：

- `.node` N-API 扩展  
- ONNX Runtime / OpenCV 预编译二进制  
- WASM 纯计算  

清单需支持 `nativeArtifacts` 与平台三元组（`win32-x64` 等）；宿主按平台选文件。MVP 先纯 JS/TS 库即可。
