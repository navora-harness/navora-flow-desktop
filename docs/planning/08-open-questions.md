# 08 — 待决策问题

建仓前最好先拍板（或标「MVP 暂定」）：

## 产品

1. **正式名称与品牌**：**Navora Flow**；三仓 `navora-flow-desktop` / `navora-flow-library-sdk` / `navora-flow-libraries`（已定）。  
2. **主用户**：开发者工具，还是创作者/逆向/多媒体？影响默认库与 UI 密度。  
3. **是否要「捷径式简化 UI」**：MVP 是否只出双线图？

## 图语义

4. **Pure 节点**：MVP 是否强制所有节点挂 exec？（文档 05 建议：MVP 强制，更简单。）  
5. **环**：是否允许 exec 环（循环）？若允许，用 for/while 节点还是自由环？  
6. **多 main / 多图 tab**：MVP 单图还是多流程图工程？

## 插件

7. **同库多版本并存**：MVP 文档建议「不并存、冲突即失败」——是否接受？  
8. **加载隔离**：MVP 同进程 require，是否接受安全提示文案？  
9. **库语言**：是否承诺仅 TS/JS，还是预留 Python sidecar？  
10. **清单里的 nodes**：是否要求与代码双重注册（防漂移），还是代码生成清单？

## 技术

11. **画布库**：`@vue-flow/core` vs LogicFlow？  
12. **是否继续 unofficial Electron**？（若无浏览器补丁需求，可用官方 Electron。）  
13. **工程文件扩展名**：`.nflow` 目录 vs 单 JSON？

## 与 Navora 关系

14. **代码资产**：全新仓库 vs 从 desktop 抽公共 `electron-host-kit`？  
15. **生态互通**：流程是否要能被 Agent 当工具调用？（建议 v1 后再说。）

## Debug

16. **MVP 是否只做「上次 IO 回看」、断点放到 Phase 2？**（文档建议：是。）  
17. **调试中能否改图？**（建议：只读，改图需先 Stop。）  
18. **大对象默认截断大小？**（建议：string 2KB / 数组 20 项，可加载完整。）

---

## 建议的「默认答案」（可直接开干）

| # | 默认 |
|---|------|
| 品牌 | **Navora Flow**；三仓 desktop / library-sdk / libraries |
| 用户 | 开发者向工具 |
| UI | 仅双线图 |
| Pure | MVP 不做，全节点 exec |
| 环 | MVP 禁止自由环；用 if + 后续 while |
| 图 | 单工程单图 |
| 多版本 | 不并存 |
| 隔离 | 同进程 + 警告 |
| 语言 | JS/TS only |
| 画布 | @vue-flow/core |
| Electron | 官方 Electron，除非有明确补丁需求 |
| 工程 | 目录型 `.nflow/` |
| Navora | 新仓；只抄设计 |
| Debug MVP | Run 快照回看 + 失败标红；钩子预留 |
| Debug v0.2 | 断点 + Continue/Step Over/Stop |
| 调试时改图 | 禁止（只读） |
