import type { NodeTypeDecl, LibraryModule } from 'navora-flow-library-sdk'

export const BUILTIN_NODE_TYPES: NodeTypeDecl[] = [
  {
    type: 'flow.main',
    title: 'Main',
    category: '流程',
    exec: { in: 0, out: ['then'] },
  },
  {
    type: 'flow.exit',
    title: 'Exit',
    category: '流程',
    exec: { in: 1, out: ['then'] },
    inputs: [{ id: 'value', type: 'any', required: false }],
  },
  {
    type: 'flow.if',
    title: 'If',
    category: '流程',
    exec: { in: 1, out: ['then', 'else'] },
    inputs: [{ id: 'condition', type: 'bool', required: true }],
  },
  {
    type: 'flow.log',
    title: 'Log',
    category: '流程',
    exec: { in: 1, out: ['then'] },
    inputs: [{ id: 'message', type: 'any', required: false }],
    sideEffect: true,
  },
  {
    type: 'value.string',
    title: '字符串常量',
    category: '值',
    exec: { in: 1, out: ['then'] },
    outputs: [{ id: 'value', type: 'string' }],
    props: {
      type: 'object',
      properties: { value: { type: 'string', default: '' } },
    },
  },
  {
    type: 'value.bool',
    title: '布尔常量',
    category: '值',
    exec: { in: 1, out: ['then'] },
    outputs: [{ id: 'value', type: 'bool' }],
    props: {
      type: 'object',
      properties: { value: { type: 'boolean', default: false } },
    },
  },
  {
    type: 'string.concat',
    title: '字符串拼接',
    category: '字符串',
    exec: { in: 1, out: ['then'] },
    inputs: [
      { id: 'a', type: 'string', required: true },
      { id: 'b', type: 'string', required: true },
    ],
    outputs: [{ id: 'result', type: 'string' }],
    props: {
      type: 'object',
      properties: { sep: { type: 'string', default: '' } },
    },
  },
]

export function createBuiltinModule(): LibraryModule {
  return {
    execute(type, inputs, props, ctx) {
      switch (type) {
        case 'flow.if':
          return { execOut: inputs.condition ? 'then' : 'else', outputs: {} }
        case 'flow.log':
          ctx.log('info', String(inputs.message ?? ''), inputs.message)
          return { execOut: 'then', outputs: {} }
        case 'value.string':
          return { execOut: 'then', outputs: { value: String(props.value ?? '') } }
        case 'value.bool':
          return { execOut: 'then', outputs: { value: Boolean(props.value) } }
        case 'string.concat': {
          const sep = typeof props.sep === 'string' ? props.sep : ''
          return {
            execOut: 'then',
            outputs: { result: `${String(inputs.a ?? '')}${sep}${String(inputs.b ?? '')}` },
          }
        }
        default:
          throw new Error(`builtin: unknown type ${type}`)
      }
    },
  }
}

export function defaultPropsFor(type: NodeTypeDecl): Record<string, unknown> {
  const props: Record<string, unknown> = {}
  const schema = type.props as
    | { properties?: Record<string, { default?: unknown }> }
    | undefined
  if (schema?.properties) {
    for (const [k, v] of Object.entries(schema.properties)) {
      if (v.default !== undefined) props[k] = v.default
    }
  }
  return props
}
