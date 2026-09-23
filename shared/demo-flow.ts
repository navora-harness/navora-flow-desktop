import {
  FlowRuntime,
  mergeNodeTypes,
  type FlowGraph,
  type InstalledLibrary,
  type LibraryManifest,
  type LibraryModule,
  type RunResult,
} from 'navora-flow-library-sdk'

/** In-process demo libraries so the scaffold runs without loading .cjs yet. */
export function createDemoLibraries(): Map<string, InstalledLibrary> {
  const builtinManifest: LibraryManifest = {
    id: 'builtin-core',
    name: 'Builtin Core',
    version: '0.1.0',
    main: 'main.cjs',
    nodes: [
      { type: 'flow.main', title: 'Main', category: '流程', exec: { in: 0, out: ['then'] } },
      {
        type: 'flow.exit',
        title: 'Exit',
        category: '流程',
        exec: { in: 1, out: ['then'] },
        inputs: [{ id: 'value', type: 'any', required: false }],
      },
      {
        type: 'value.string',
        title: '字符串常量',
        category: '值',
        exec: { in: 1, out: ['then'] },
        outputs: [{ id: 'value', type: 'string' }],
      },
      {
        type: 'string.concat',
        title: '拼接',
        category: '字符串',
        exec: { in: 1, out: ['then'] },
        inputs: [
          { id: 'a', type: 'string', required: true },
          { id: 'b', type: 'string', required: true },
        ],
        outputs: [{ id: 'result', type: 'string' }],
      },
    ],
  }

  const builtinModule: LibraryModule = {
    execute(type, inputs, props) {
      if (type === 'value.string') {
        return { execOut: 'then', outputs: { value: String(props.value ?? '') } }
      }
      if (type === 'string.concat') {
        const sep = typeof props.sep === 'string' ? props.sep : ''
        return {
          execOut: 'then',
          outputs: { result: `${String(inputs.a ?? '')}${sep}${String(inputs.b ?? '')}` },
        }
      }
      throw new Error(`unknown ${type}`)
    },
  }

  return new Map([['builtin-core', { manifest: builtinManifest, module: builtinModule }]])
}

export const DEMO_GRAPH: FlowGraph = {
  schemaVersion: 1,
  nodes: [
    { id: 'main', type: 'flow.main', x: 40, y: 120 },
    { id: 'a', type: 'value.string', x: 220, y: 60, props: { value: 'Navora' } },
    { id: 'b', type: 'value.string', x: 220, y: 180, props: { value: 'Flow' } },
    { id: 'c', type: 'string.concat', x: 420, y: 120, props: { sep: ' ' } },
    { id: 'exit', type: 'flow.exit', x: 620, y: 120 },
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

export async function runDemoGraph(): Promise<RunResult> {
  const libraries = createDemoLibraries()
  const nodeTypes = mergeNodeTypes(libraries.values())
  return new FlowRuntime().run({ graph: DEMO_GRAPH, libraries, nodeTypes })
}
