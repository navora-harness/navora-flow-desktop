# 04 — 运行库（插件）系统

这是本产品相对捷径 / 普通流程图工具的**核心差异**：第三方运行库可互相依赖，导入后编辑器自动增加方法节点。

## 1. 术语

| 术语 | 含义 |
|------|------|
| **Library（运行库）** | 可安装包，导出一批 **Node Type（方法节点）** |
| **Node Type** | 可拖入画布的节点种类，如 `codec.base64.decode` |
| **Instance** | 画布上的一个节点实例 |
| **Host** | 桌面宿主：解析依赖、加载、执行 |
| **SDK** | 作者用来声明清单、类型、打包的工具包 |

## 2. 包结构（草案）

```text
my-codec/
├── library.json          # 清单（作者源）
├── src/index.ts          # 实现
├── nodes/                # 可选：每节点一文件
└── dist/my-codec/
    ├── library.json
    ├── main.cjs          # 或 main.js
    ├── nodes.manifest.json  # 可选：纯描述，供 UI 不加载代码也能列节点
    └── assets/
```

### library.json 示例

```json
{
  "id": "image-vision",
  "name": "Image Vision",
  "version": "1.2.0",
  "description": "人脸/物体检测等",
  "main": "main.cjs",
  "engines": { "host": ">=0.1.0" },
  "capabilities": ["fs.read", "native"],
  "dependencies": {
    "codec-core": "^1.0.0",
    "tensor-runtime": "~0.3.0"
  },
  "optionalDependencies": {
    "cuda-runtime": "^1.0.0"
  },
  "nodes": [
    {
      "type": "vision.detectFaces",
      "title": "检测人脸",
      "category": "图像识别",
      "exec": { "in": 1, "out": ["then", "error"] },
      "inputs": [
        { "id": "image", "type": "ImageBuffer", "required": true }
      ],
      "outputs": [
        { "id": "faces", "type": "Face[]" }
      ],
      "props": {
        "type": "object",
        "properties": {
          "minConfidence": { "type": "number", "default": 0.5 }
        }
      }
    }
  ]
}
```

要点：

- **`nodes` 进清单**：编辑器可不执行库代码也能渲染工具箱（更快、更安全预览）。
- **`dependencies`**：强制依赖，安装时解析。
- **`optionalDependencies`**：有则增强，无则降级。
- **`capabilities`**：宿主门闩用。

## 3. 模块契约（运行时）

```ts
export interface LibraryModule {
  /** 可选：启动时初始化（加载原生 .node、模型文件等） */
  activate?(ctx: LibraryContext): Promise<void> | void
  deactivate?(): Promise<void> | void

  /** 执行节点；type 与 library.json 中一致 */
  execute(
    type: string,
    inputs: Record<string, unknown>,
    props: Record<string, unknown>,
    ctx: NodeExecContext
  ): Promise<NodeExecResult> | NodeExecResult
}

export interface NodeExecResult {
  /** 走哪个 exec 出口，默认 then */
  execOut?: string
  outputs?: Record<string, unknown>
}
```

库内可 `ctx.requireLibrary('codec-core')` 获取**已解析版本**的兄弟库 API（仅允许声明过的依赖），禁止随意扫全局。

## 4. 依赖解析

### 4.1 规则（建议对齐 npm semver，简化实现）

1. 用户安装库 L → 读取 `dependencies` → 递归解析。
2. 同 id 多个版本请求 → 若存在满足所有约束的单一版本则用它；否则 **冲突失败**并展示原因（MVP 不做树多版本并存，降低复杂度）。
3. 项目 `project.json` 记录 `libraries: { "image-vision": "^1.2.0" }`；锁定文件记录精确版本。
4. 打开项目时：缺库 → 提示安装；版本不满足 → 提示升级/换源。

### 4.2 加载顺序

按依赖 DAG **拓扑排序**后 `activate`；卸载时逆序 `deactivate`。

### 4.3 与 Navora「suite」的关系

Navora 的 `suite`（同套件互斥）可保留为可选字段：例如 `cuda-runtime` 与 `cpu-runtime` 同 suite，只能启用一个。

## 5. 分发与安装 UX

| 方式 | 说明 |
|------|------|
| 导入 zip | 校验清单 → 解析依赖 → 缺则向导下载/选择本地包 |
| 外链文件夹 | 开发热更（对标 Navora） |
| 目录仓 / 商店 | 后期；先本地目录索引 JSON 即可 |

安装完成后：

1. Registry 更新  
2. Catalog 刷新  
3. 编辑器工具箱出现新分类/节点  
4. 若当前图有「缺失节点」且现已满足 → 自动解除错误标记

## 6. 官方示例库（建议 MVP 就做 2～3 个）

| 库 | 作用 |
|----|------|
| `builtin-core` | main/exit/if/switch/for/delay/log/setVar（随宿主捆绑） |
| `codec-core` | base64/hex/url/json/utf8… |
| `image-basic` | 读图、缩放、写文件（依赖 codec 可选） |

第三方示范：`image-vision` 依赖 `image-basic`，证明依赖链。

## 7. SDK / CLI（对标 navora-plugin-sdk）

```bash
nf-lib init my-lib
nf-lib build
nf-lib pack          # → my-lib-1.0.0.nlib.zip
nf-lib validate
```

SPEC 独立成文：版本、字段、签名（后期）、体积上限等。
