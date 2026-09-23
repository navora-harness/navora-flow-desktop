import type { FlowGraph, GraphEdge, GraphNode } from 'navora-flow-library-sdk'
import { BUILTIN_NODE_TYPES, defaultPropsFor } from './builtin-catalog'

export type EditorNodeData = {
  type: string
  title: string
  libraryId?: string
  props: Record<string, unknown>
}

export function createEmptyGraph(): FlowGraph {
  return {
    schemaVersion: 1,
    nodes: [
      { id: 'main', type: 'flow.main', x: 80, y: 160, props: {} },
      { id: 'exit', type: 'flow.exit', x: 480, y: 160, props: {} },
    ],
    edges: [],
  }
}

export function createDemoGraph(): FlowGraph {
  return {
    schemaVersion: 1,
    nodes: [
      { id: 'main', type: 'flow.main', x: 60, y: 140 },
      { id: 'a', type: 'value.string', x: 240, y: 60, props: { value: 'Navora' } },
      { id: 'b', type: 'value.string', x: 240, y: 200, props: { value: 'Flow' } },
      { id: 'c', type: 'string.concat', x: 440, y: 140, props: { sep: ' ' } },
      { id: 'exit', type: 'flow.exit', x: 660, y: 140 },
    ],
    edges: [
      { id: 'e1', kind: 'exec', from: { node: 'main', port: 'then' }, to: { node: 'a', port: 'exec' } },
      { id: 'e2', kind: 'exec', from: { node: 'a', port: 'then' }, to: { node: 'b', port: 'exec' } },
      { id: 'e3', kind: 'exec', from: { node: 'b', port: 'then' }, to: { node: 'c', port: 'exec' } },
      { id: 'e4', kind: 'exec', from: { node: 'c', port: 'then' }, to: { node: 'exit', port: 'exec' } },
      { id: 'd1', kind: 'data', from: { node: 'a', port: 'value' }, to: { node: 'c', port: 'a' } },
      { id: 'd2', kind: 'data', from: { node: 'b', port: 'value' }, to: { node: 'c', port: 'b' } },
      { id: 'd3', kind: 'data', from: { node: 'c', port: 'result' }, to: { node: 'exit', port: 'value' } },
    ],
  }
}

export function lookupType(type: string) {
  return BUILTIN_NODE_TYPES.find((n) => n.type === type)
}

export function newNodeId(existing: string[]): string {
  let i = 1
  while (existing.includes(`n${i}`)) i += 1
  return `n${i}`
}

export function createGraphNode(
  type: string,
  position: { x: number; y: number },
  existingIds: string[],
): GraphNode | null {
  const decl = lookupType(type)
  if (!decl) return null
  if (type === 'flow.main' && existingIds.includes('main')) return null
  return {
    id: type === 'flow.main' ? 'main' : newNodeId(existingIds),
    type,
    x: position.x,
    y: position.y,
    props: defaultPropsFor(decl),
    library: 'builtin-core',
  }
}

export function parseHandle(handleId: string | null | undefined): {
  kind: 'exec' | 'data'
  port: string
  dir: 'in' | 'out'
} | null {
  if (!handleId) return null
  const parts = handleId.split(':')
  if (parts[0] === 'exec' && parts[1] === 'in') return { kind: 'exec', port: 'exec', dir: 'in' }
  if (parts[0] === 'exec' && parts[1] === 'out' && parts[2]) {
    return { kind: 'exec', port: parts[2], dir: 'out' }
  }
  if (parts[0] === 'data' && parts[1] === 'in' && parts[2]) {
    return { kind: 'data', port: parts[2], dir: 'in' }
  }
  if (parts[0] === 'data' && parts[1] === 'out' && parts[2]) {
    return { kind: 'data', port: parts[2], dir: 'out' }
  }
  return null
}

export function edgeId(): string {
  return `e_${Math.random().toString(36).slice(2, 9)}`
}

export function toVueFlowElements(graph: FlowGraph) {
  const nodes = graph.nodes.map((n) => {
    const decl = lookupType(n.type)
    return {
      id: n.id,
      type: 'flowNode',
      position: { x: n.x ?? 0, y: n.y ?? 0 },
      data: {
        type: n.type,
        title: decl?.title ?? n.type,
        libraryId: n.library,
        props: n.props ?? {},
      } satisfies EditorNodeData,
    }
  })

  const edges = graph.edges.map((e) => {
    const sourceHandle =
      e.kind === 'exec' ? `exec:out:${e.from.port}` : `data:out:${e.from.port}`
    const targetHandle = e.kind === 'exec' ? 'exec:in' : `data:in:${e.to.port}`
    return {
      id: e.id,
      source: e.from.node,
      target: e.to.node,
      sourceHandle,
      targetHandle,
      type: 'default',
      label: e.from.port,
      style: {
        stroke: e.kind === 'exec' ? '#0f6e56' : '#3b6ea5',
        strokeWidth: e.kind === 'exec' ? 2 : 1.5,
      },
      animated: e.kind === 'exec',
      data: { kind: e.kind },
    }
  })

  return { nodes, edges }
}

export function graphFromVueFlow(
  nodes: Array<{ id: string; position: { x: number; y: number }; data: EditorNodeData }>,
  edges: Array<{
    id: string
    source: string
    target: string
    sourceHandle?: string | null
    targetHandle?: string | null
  }>,
): FlowGraph {
  const gNodes: GraphNode[] = nodes.map((n) => ({
    id: n.id,
    type: n.data.type,
    x: n.position.x,
    y: n.position.y,
    props: n.data.props ?? {},
    library: n.data.libraryId,
  }))

  const gEdges: GraphEdge[] = []
  for (const e of edges) {
    const from = parseHandle(e.sourceHandle)
    const to = parseHandle(e.targetHandle)
    if (!from || !to || from.kind !== to.kind || from.dir !== 'out' || to.dir !== 'in') continue
    gEdges.push({
      id: e.id,
      kind: from.kind,
      from: { node: e.source, port: from.port },
      to: { node: e.target, port: to.port },
    })
  }

  return { schemaVersion: 1, nodes: gNodes, edges: gEdges }
}
