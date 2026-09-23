import { describe, expect, it } from 'vitest'
import { FlowRuntime, mergeNodeTypes } from 'navora-flow-library-sdk'
import { BUILTIN_NODE_TYPES, createBuiltinModule } from '../shared/builtin-catalog'
import { createDemoGraph, graphFromVueFlow, parseHandle, toVueFlowElements } from '../shared/graph-model'
import { sanitizeWindowState } from '../electron/modules/window-state'

describe('demo graph runtime', () => {
  it('runs createDemoGraph to Navora Flow', async () => {
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
    const result = await new FlowRuntime().run({
      graph: createDemoGraph(),
      libraries,
      nodeTypes: mergeNodeTypes(libraries.values()),
    })
    expect(result.ok).toBe(true)
    expect(result.exitOutputs?.value).toBe('Navora Flow')
  })
})

describe('graph-model handles', () => {
  it('parses exec/data handles', () => {
    expect(parseHandle('exec:out:then')).toEqual({ kind: 'exec', port: 'then', dir: 'out' })
    expect(parseHandle('data:in:a')).toEqual({ kind: 'data', port: 'a', dir: 'in' })
  })

  it('round-trips vue-flow elements', () => {
    const g = createDemoGraph()
    const els = toVueFlowElements(g)
    const back = graphFromVueFlow(
      els.nodes.map((n) => ({ id: n.id, position: n.position, data: n.data })),
      els.edges,
    )
    expect(back.nodes).toHaveLength(g.nodes.length)
    expect(back.edges).toHaveLength(g.edges.length)
  })
})

describe('window-state', () => {
  it('clamps size and drops off-screen coords', () => {
    const s = sanitizeWindowState({ width: 100, height: 50, x: -99999, y: -99999 })
    expect(s.width).toBeGreaterThanOrEqual(960)
    expect(s.height).toBeGreaterThanOrEqual(640)
    expect(s.x).toBeUndefined()
  })
})
