<script setup lang="ts">
import { ref, watch, markRaw } from 'vue'
import {
  VueFlow,
  useVueFlow,
  type Connection,
  type NodeMouseEvent,
} from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import FlowNode from './nodes/FlowNode.vue'
import {
  createDemoGraph,
  createGraphNode,
  edgeId,
  graphFromVueFlow,
  parseHandle,
  toVueFlowElements,
  type EditorNodeData,
} from '@shared/graph-model'
import type { FlowGraph } from 'navora-flow-library-sdk'

const FLOW_ID = 'navora-flow-editor'

const props = defineProps<{
  highlightNodeId: string | null
}>()

const emit = defineEmits<{
  select: [id: string | null, data: EditorNodeData | null]
  'graph-change': [graph: FlowGraph]
}>()

const nodeTypes = { flowNode: markRaw(FlowNode) } as Record<string, unknown>
const initial = toVueFlowElements(createDemoGraph())
const nodes = ref<any[]>(initial.nodes)
const edges = ref<any[]>(initial.edges)

const { screenToFlowCoordinate, addEdges, onConnect } = useVueFlow({ id: FLOW_ID })

watch(
  () => props.highlightNodeId,
  (id) => {
    nodes.value = nodes.value.map((n) => ({
      ...n,
      class: id && n.id === id ? 'hl' : undefined,
    }))
  },
)

function snapshotGraph(): FlowGraph {
  return graphFromVueFlow(
    nodes.value.map((n) => ({
      id: n.id as string,
      position: n.position as { x: number; y: number },
      data: n.data as EditorNodeData,
    })),
    edges.value.map((e) => ({
      id: e.id as string,
      source: e.source as string,
      target: e.target as string,
      sourceHandle: e.sourceHandle as string | null | undefined,
      targetHandle: e.targetHandle as string | null | undefined,
    })),
  )
}

function emitGraph() {
  emit('graph-change', snapshotGraph())
}

onConnect((connection: Connection) => {
  const from = parseHandle(connection.sourceHandle)
  const to = parseHandle(connection.targetHandle)
  if (!from || !to || from.kind !== to.kind || from.dir !== 'out' || to.dir !== 'in') return
  if (!connection.source || !connection.target) return
  const edge = {
    id: edgeId(),
    source: connection.source,
    target: connection.target,
    sourceHandle: connection.sourceHandle,
    targetHandle: connection.targetHandle,
    label: from.port,
    animated: from.kind === 'exec',
    style: {
      stroke: from.kind === 'exec' ? '#0f6e56' : '#3b6ea5',
      strokeWidth: from.kind === 'exec' ? 2 : 1.5,
    },
    data: { kind: from.kind },
  }
  addEdges(edge as any)
  emitGraph()
})

function onNodeClick(ev: NodeMouseEvent) {
  emit('select', ev.node.id, ev.node.data as EditorNodeData)
}

function onPaneClick() {
  emit('select', null, null)
}

function addNodeAt(type: string, position: { x: number; y: number }) {
  const created = createGraphNode(
    type,
    position,
    nodes.value.map((n) => n.id as string),
  )
  if (!created) return
  const vf = toVueFlowElements({
    schemaVersion: 1,
    nodes: [created],
    edges: [],
  }).nodes[0]
  if (!vf) return
  nodes.value = [...nodes.value, vf]
  emit('select', created.id, vf.data as EditorNodeData)
  emitGraph()
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  const type = e.dataTransfer?.getData('application/navora-flow-node')
  if (!type) return
  const position = screenToFlowCoordinate({ x: e.clientX, y: e.clientY })
  addNodeAt(type, position)
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
}

function getGraph(): FlowGraph {
  return snapshotGraph()
}

function updateSelectedProps(id: string, key: string, value: unknown) {
  nodes.value = nodes.value.map((n) => {
    if (n.id !== id) return n
    const data = {
      ...(n.data as EditorNodeData),
      props: { ...(n.data as EditorNodeData).props, [key]: value },
    }
    return { ...n, data }
  })
  const node = nodes.value.find((n) => n.id === id)
  if (node) emit('select', id, node.data as EditorNodeData)
  emitGraph()
}

function onNodesUpdate() {
  emitGraph()
}

defineExpose({ getGraph, addNodeAt, updateSelectedProps })
emitGraph()
</script>

<template>
  <div class="canvas" @drop="onDrop" @dragover="onDragOver">
    <VueFlow
      :id="FLOW_ID"
      v-model:nodes="nodes"
      v-model:edges="edges"
      :node-types="(nodeTypes as any)"
      fit-view-on-init
      @node-click="onNodeClick"
      @pane-click="onPaneClick"
      @nodes-change="onNodesUpdate"
      @edges-change="onNodesUpdate"
    >
      <Background pattern-color="#d0d7e0" :gap="18" />
      <Controls />
    </VueFlow>
  </div>
</template>

<style scoped>
.canvas {
  height: 100%;
  min-height: 0;
}
:deep(.vue-flow__node.hl) {
  filter: drop-shadow(0 0 6px rgb(15 110 86 / 55%));
}
</style>
