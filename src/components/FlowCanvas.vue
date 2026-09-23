<script setup lang="ts">
import { ref, computed } from 'vue'
import { VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import type { NodeSnapshot } from 'navora-flow-library-sdk'
import { DEMO_GRAPH, runDemoGraph } from '@shared/demo-flow'

const emit = defineEmits<{
  runResult: [payload: { ok: boolean; error?: string; snapshots: NodeSnapshot[]; trace: string[] }]
  selectNode: [id: string]
}>()

const running = ref(false)

const nodes = ref(
  DEMO_GRAPH.nodes.map((n) => ({
    id: n.id,
    position: { x: n.x ?? 0, y: n.y ?? 0 },
    label: `${n.id}\n${n.type}`,
    data: { type: n.type },
    style: {
      border: '1px solid #c5d0dc',
      borderRadius: '10px',
      padding: '8px 12px',
      background: '#fff',
      fontSize: '12px',
      whiteSpace: 'pre' as const,
      width: 140,
      textAlign: 'center' as const,
    },
  })),
)

const edges = computed(() =>
  DEMO_GRAPH.edges
    .filter((e) => e.kind === 'exec')
    .map((e) => ({
      id: e.id,
      source: e.from.node,
      target: e.to.node,
      label: e.kind,
      animated: false,
      style: { stroke: '#0f6e56' },
    })),
)

async function run() {
  running.value = true
  try {
    const result = await runDemoGraph()
    emit('runResult', {
      ok: result.ok,
      error: result.error,
      snapshots: result.snapshots,
      trace: result.trace,
    })
  } finally {
    running.value = false
  }
}
</script>

<template>
  <div class="canvas-wrap">
    <div class="toolbar">
      <button class="run" :disabled="running" @click="run">
        {{ running ? '运行中…' : '运行演示流程' }}
      </button>
      <span class="note">exec 边显示在画布上；完整双线编辑器后续迭代</span>
    </div>
    <VueFlow
      :nodes="nodes"
      :edges="edges"
      fit-view-on-init
      class="flow"
      @node-click="({ node }) => emit('selectNode', node.id)"
    >
      <Background pattern-color="#d0d7e0" :gap="18" />
      <Controls />
    </VueFlow>
  </div>
</template>

<style scoped>
.canvas-wrap {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #fff;
  border-bottom: 1px solid var(--border);
}
.run {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
}
.run:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.note {
  color: var(--muted);
  font-size: 12px;
}
.flow {
  flex: 1;
}
</style>
