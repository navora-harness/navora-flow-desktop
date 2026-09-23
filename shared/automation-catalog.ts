import type { LibraryModule, NodeTypeDecl } from 'navora-flow-library-sdk'

/** Navora-compatible browser automation node types (tool names mirror agent-tools). */
const TOOLS: Array<{ type: string; title: string; category: string }> = [
  { type: 'browser.open', title: 'Browser Open', category: '浏览器' },
  { type: 'browser.session.create', title: 'Session Create', category: '浏览器/会话' },
  { type: 'browser.session.close', title: 'Session Close', category: '浏览器/会话' },
  { type: 'browser.session.clear', title: 'Session Clear', category: '浏览器/会话' },
  { type: 'browser.session.set_proxy', title: 'Session Set Proxy', category: '浏览器/会话' },
  { type: 'browser.session.set_ua', title: 'Session Set UA', category: '浏览器/会话' },
  { type: 'browser.session.fetch', title: 'Session Fetch', category: '浏览器/会话' },
  { type: 'browser.cookies.get', title: 'Cookies Get', category: '浏览器/Cookie' },
  { type: 'browser.cookies.set', title: 'Cookies Set', category: '浏览器/Cookie' },
  { type: 'browser.cookies.remove', title: 'Cookies Remove', category: '浏览器/Cookie' },
  { type: 'browser.window.create', title: 'Window Create', category: '浏览器/窗口' },
  { type: 'browser.window.close', title: 'Window Close', category: '浏览器/窗口' },
  { type: 'browser.window.set_visible', title: 'Window Visible', category: '浏览器/窗口' },
  { type: 'browser.window.set_bounds', title: 'Window Bounds', category: '浏览器/窗口' },
  { type: 'browser.window.focus', title: 'Window Focus', category: '浏览器/窗口' },
  { type: 'browser.navigate', title: 'Navigate', category: '浏览器/导航' },
  { type: 'browser.back', title: 'Back', category: '浏览器/导航' },
  { type: 'browser.forward', title: 'Forward', category: '浏览器/导航' },
  { type: 'browser.reload', title: 'Reload', category: '浏览器/导航' },
  { type: 'browser.wait', title: 'Wait', category: '浏览器/交互' },
  { type: 'browser.click', title: 'Click', category: '浏览器/交互' },
  { type: 'browser.type', title: 'Type', category: '浏览器/交互' },
  { type: 'browser.press', title: 'Press Key', category: '浏览器/交互' },
  { type: 'browser.hover', title: 'Hover', category: '浏览器/交互' },
  { type: 'browser.scroll', title: 'Scroll', category: '浏览器/交互' },
  { type: 'browser.select', title: 'Select', category: '浏览器/交互' },
  { type: 'browser.find', title: 'Find', category: '浏览器/交互' },
  { type: 'browser.get', title: 'Get Page', category: '浏览器/读取' },
  { type: 'browser.evaluate', title: 'Evaluate', category: '浏览器/读取' },
  { type: 'browser.screenshot', title: 'Screenshot', category: '浏览器/读取' },
  { type: 'browser.list_resources', title: 'List Resources', category: '浏览器' },
  { type: 'browser.flow', title: 'Browser Flow Steps', category: '浏览器' },
  // Registered for Navora parity (host may return unsupported until fully ported)
  { type: 'browser.load_url_with_response', title: 'Load URL With Response', category: '浏览器/高级' },
  { type: 'browser.upload', title: 'Upload', category: '浏览器/高级' },
  { type: 'browser.dialog', title: 'Dialog', category: '浏览器/高级' },
  { type: 'browser.query_deep', title: 'Query Deep', category: '浏览器/高级' },
  { type: 'browser.network.rule_add', title: 'Network Rule Add', category: '浏览器/网络' },
  { type: 'browser.network.rule_remove', title: 'Network Rule Remove', category: '浏览器/网络' },
  { type: 'browser.network.rule_list', title: 'Network Rule List', category: '浏览器/网络' },
  { type: 'browser.network.log', title: 'Network Log', category: '浏览器/网络' },
  { type: 'browser.network.clear', title: 'Network Clear', category: '浏览器/网络' },
]

function toToolName(nodeType: string): string {
  // browser.session.create → browser_session_create
  return nodeType.replace(/\./g, '_')
}

export const AUTOMATION_NODE_TYPES: NodeTypeDecl[] = TOOLS.map((t) => ({
  type: t.type,
  title: t.title,
  category: t.category,
  exec: { in: 1, out: ['then', 'error'] },
  inputs: [
    { id: 'sessionId', type: 'string', required: false },
    { id: 'windowId', type: 'string', required: false },
    { id: 'args', type: 'json', required: false },
  ],
  outputs: [
    { id: 'result', type: 'json' },
    { id: 'sessionId', type: 'string' },
    { id: 'windowId', type: 'string' },
  ],
  props: {
    type: 'object',
    properties: {
      url: { type: 'string', default: '' },
      selector: { type: 'string', default: '' },
      text: { type: 'string', default: '' },
      expression: { type: 'string', default: '' },
      timeoutMs: { type: 'number', default: 5000 },
      show: { type: 'boolean', default: true },
    },
  },
  sideEffect: true,
}))

export function createAutomationModule(): LibraryModule {
  return {
    async execute(type, inputs, props, ctx) {
      if (!ctx.run.automation) {
        throw new Error('automation host not available in this run environment')
      }
      const tool = toToolName(type)
      const args: Record<string, unknown> = {
        ...(typeof inputs.args === 'object' && inputs.args ? (inputs.args as object) : {}),
        ...props,
      }
      if (inputs.sessionId) args.sessionId = inputs.sessionId
      if (inputs.windowId) args.windowId = inputs.windowId
      // Convenience: map common props
      if (props.url) args.url = props.url
      if (props.selector) args.selector = props.selector
      if (props.text) args.text = props.text
      if (props.expression) args.expression = props.expression
      if (props.timeoutMs != null) args.timeoutMs = props.timeoutMs
      if (props.show != null) args.show = props.show

      try {
        const result = (await ctx.run.automation.invoke(tool, args)) as Record<string, unknown>
        const failed = result && result.ok === false
        return {
          execOut: failed ? 'error' : 'then',
          outputs: {
            result,
            sessionId: result?.sessionId ?? inputs.sessionId,
            windowId: result?.windowId ?? inputs.windowId,
          },
        }
      } catch (e) {
        return {
          execOut: 'error',
          outputs: {
            result: { ok: false, error: e instanceof Error ? e.message : String(e) },
            sessionId: inputs.sessionId,
            windowId: inputs.windowId,
          },
        }
      }
    },
  }
}
