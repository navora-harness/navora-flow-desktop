<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { NodeSnapshot, RunResult } from 'navora-flow-library-sdk'
import type { CatalogEntry } from '@shared/catalog'
import type { EditorNodeData } from '@shared/graph-model'
import NodePalette from './components/NodePalette.vue'
import FlowCanvas from './components/FlowCanvas.vue'
import InspectorPanel from './components/InspectorPanel.vue'

const catalog = ref<CatalogEntry[]>([])
const query = ref('')
const status = ref('就绪')
const bridgeUrl = ref<string | null>(null)
const selectedId = ref<string | null>(null)
const selectedData = ref<EditorNodeData | null>(null)
const snapshots = ref<NodeSnapshot[]>([])
const highlightNodeId = ref<string | null>(null)
const running = ref(false)
const canvasRef = ref<InstanceType<typeof FlowCanvas> | null>(null)

const selectedSnap = computed(
  () => snapshots.value.find((s) => s.nodeId === selectedId.value) ?? null,
)

const api = () => window.navoraFlow

onMounted(async () => {
  try {
    if (!api()) {
      status.value = '浏览器预览模式（无主进程 IPC）'
      const { BUILTIN_NODE_TYPES } = await import('@shared/builtin-catalog')
      catalog.value = BUILTIN_NODE_TYPES.map((n) => ({
        ...n,
        libraryId: 'builtin-core',
        libraryVersion: '0.1.0',
      }))
      return
    }
    const info = await api()!.getAppInfo()
    bridgeUrl.value = info.bridge?.url ?? null
    catalog.value = await api()!.getCatalog()
    status.value = `数据目录 ${info.dataRoot}`
  } catch (e) {
    status.value = e instanceof Error ? e.message : String(e)
  }
})

function onSelect(id: string | null, data: EditorNodeData | null) {
  selectedId.value = id
  selectedData.value = data
}

function onAdd(type: string) {
  canvasRef.value?.addNodeAt(type, { x: 220 + Math.random() * 80, y: 120 + Math.random() * 80 })
}

function onProp(key: string, value: unknown) {
  if (!selectedId.value) return
  canvasRef.value?.updateSelectedProps(selectedId.value, key, value)
}

async function run() {
  const graph = canvasRef.value?.getGraph()
  if (!graph) return
  running.value = true
  status.value = '运行中…'
  try {
    let result: RunResult
    if (api()) {
      result = await api()!.runGraph(graph)
    } else {
      const { FlowRuntime, mergeNodeTypes } = await import('navora-flow-library-sdk')
      const { BUILTIN_NODE_TYPES, createBuiltinModule } = await import('@shared/builtin-catalog')
      const libraries = new Map([
        [
          'builtin-core',
          {
            manifest: {
              id: 'builtin-core',
              name: 'Builtin',
              version: '0.1.0',
              main: 'main.cjs',
              nodes: BUILTIN_NODE_TYPES,
            },
            module: createBuiltinModule(),
          },
        ],
      ])
      result = await new FlowRuntime().run({
        graph,
        libraries,
        nodeTypes: mergeNodeTypes(libraries.values()),
      })
    }
    snapshots.value = result.snapshots
    highlightNodeId.value = result.trace.at(-1) ?? null
    status.value = result.ok
      ? `成功：${result.trace.join(' → ')}${result.exitOutputs ? ` → ${JSON.stringify(result.exitOutputs)}` : ''}`
      : `失败：${result.error ?? 'unknown'}`
  } catch (e) {
    status.value = e instanceof Error ? e.message : String(e)
  } finally {
    running.value = false
  }
}

async function hideTray() {
  await api()?.hideToTray()
}
</script>

<template>
  <div class="shell">
    <header class="top">
      <div class="brand">
        <span class="mark">NF</span>
        <div>
          <h1>Navora Flow</h1>
          <p>可视化流程 · 托盘常驻 · 可被 Navora 桥接调用</p>
        </div>
      </div>
      <div class="actions">
        <button type="button" class="ghost" @click="hideTray">隐藏到托盘</button>
        <button type="button" class="run" :disabled="running" @click="run">
          {{ running ? '运行中…' : '运行' }}
        </button>
      </div>
    </header>

    <div class="workspace">
      <NodePalette v-model:query="query" :catalog="catalog" @add="onAdd" />
      <main class="main">
        <FlowCanvas
          ref="canvasRef"
          :highlight-node-id="highlightNodeId"
          @select="onSelect"
        />
      </main>
      <InspectorPanel
        :selected-id="selectedId"
        :selected-data="selectedData"
        :snapshot="selectedSnap"
        :status="status"
        :bridge-url="bridgeUrl"
        @update:prop="onProp"
      />
    </div>
  </div>
</template>

<style scoped>
.shell {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #fff;
  border-bottom: 1px solid var(--border);
}
.brand {
  display: flex;
  gap: 12px;
  align-items: center;
}
.mark {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  background: var(--accent);
  color: #fff;
  font-weight: 700;
  font-size: 13px;
}
h1 {
  margin: 0;
  font-size: 16px;
}
.brand p {
  margin: 2px 0 0;
  color: var(--muted);
  font-size: 12px;
}
.actions {
  display: flex;
  gap: 8px;
}
button {
  border-radius: 8px;
  padding: 8px 12px;
  border: 1px solid var(--border);
  background: #fff;
}
button.run {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}
button:disabled {
  opacity: 0.6;
}
.workspace {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 240px 1fr 300px;
}
.main {
  min-width: 0;
  min-height: 0;
  background: #eef2f6;
}
</style>
