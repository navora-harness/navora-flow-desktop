/**
 * Flow-side browser automation host (Navora browser_* tool surface).
 * Owns Electron sessions/windows for a run; disposeAll closes everything.
 */
import { BrowserWindow, session as electronSession, type Session } from 'electron'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import type { AutomationFacade } from 'navora-flow-library-sdk'
import type { ResourceTracker } from 'navora-flow-library-sdk'

type WindowRec = {
  windowId: string
  sessionId: string
  win: BrowserWindow
  title: string
  url: string
  visible: boolean
}

type SessionRec = {
  sessionId: string
  partition: string
  persist: boolean
  ses: Session
  userAgent: string
  windows: Map<string, WindowRec>
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('aborted'))
      return
    }
    const t = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(t)
        reject(new Error('aborted'))
      },
      { once: true },
    )
  })
}

export class FlowBrowserHost implements AutomationFacade {
  private sessions = new Map<string, SessionRec>()
  private runId: string
  private resources: ResourceTracker
  private dataRoot: string

  constructor(opts: { runId: string; resources: ResourceTracker; dataRoot: string }) {
    this.runId = opts.runId
    this.resources = opts.resources
    this.dataRoot = opts.dataRoot
  }

  async invoke(tool: string, args: Record<string, unknown>): Promise<unknown> {
    switch (tool) {
      case 'browser_open':
        return this.browserOpen(args)
      case 'browser_session_create':
        return this.sessionCreate(args)
      case 'browser_session_close':
        return this.sessionClose(String(args.sessionId ?? ''))
      case 'browser_session_clear':
        return this.sessionClear(String(args.sessionId ?? ''))
      case 'browser_session_set_proxy':
        return this.sessionSetProxy(args)
      case 'browser_session_set_ua':
        return this.sessionSetUa(args)
      case 'browser_session_fetch':
        return this.sessionFetch(args)
      case 'browser_cookies_get':
        return this.cookiesGet(args)
      case 'browser_cookies_set':
        return this.cookiesSet(args)
      case 'browser_cookies_remove':
        return this.cookiesRemove(args)
      case 'browser_window_create':
        return this.windowCreate(args)
      case 'browser_window_close':
        return this.windowClose(String(args.windowId ?? ''))
      case 'browser_window_set_visible':
        return this.windowSetVisible(args)
      case 'browser_window_set_bounds':
        return this.windowSetBounds(args)
      case 'browser_window_focus':
        return this.windowFocus(String(args.windowId ?? ''))
      case 'browser_navigate':
        return this.navigate(args)
      case 'browser_back':
        return this.navHistory(args, 'back')
      case 'browser_forward':
        return this.navHistory(args, 'forward')
      case 'browser_reload':
        return this.reload(args)
      case 'browser_wait':
        return this.wait(args)
      case 'browser_click':
        return this.click(args)
      case 'browser_type':
        return this.type(args)
      case 'browser_press':
        return this.press(args)
      case 'browser_hover':
        return this.hover(args)
      case 'browser_scroll':
        return this.scroll(args)
      case 'browser_select':
        return this.select(args)
      case 'browser_find':
        return this.find(args)
      case 'browser_get':
        return this.get(args)
      case 'browser_evaluate':
        return this.evaluate(args)
      case 'browser_screenshot':
        return this.screenshot(args)
      case 'browser_list_resources':
        return this.listResources()
      case 'browser_flow':
        return this.browserFlow(args)
      case 'browser_load_url_with_response':
      case 'browser_upload':
      case 'browser_dialog':
      case 'browser_query_deep':
      case 'browser_network_rule_add':
      case 'browser_network_rule_remove':
      case 'browser_network_rule_list':
      case 'browser_network_log':
      case 'browser_network_clear':
        return {
          ok: false,
          unsupported: true,
          tool,
          message: `${tool} is registered for Navora parity; implementation pending in Flow host`,
        }
      default:
        throw new Error(`unknown automation tool: ${tool}`)
    }
  }

  async disposeAll(): Promise<void> {
    const ids = [...this.sessions.keys()]
    for (const id of ids) {
      await this.sessionClose(id)
    }
  }

  private trackSession(sessionId: string): void {
    this.resources.track('browser_session', sessionId, async () => {
      await this.sessionClose(sessionId)
    })
  }

  private getSession(sessionId: string): SessionRec {
    const s = this.sessions.get(sessionId)
    if (!s) throw new Error(`session not found: ${sessionId}`)
    return s
  }

  private getWindow(windowId: string): WindowRec {
    for (const s of this.sessions.values()) {
      const w = s.windows.get(windowId)
      if (w) return w
    }
    throw new Error(`window not found: ${windowId}`)
  }

  private async browserOpen(args: Record<string, unknown>) {
    const session = await this.sessionCreate({
      persist: args.persist,
      userAgent: args.userAgent,
    })
    const sessionId = (session as { sessionId: string }).sessionId
    const win = await this.windowCreate({
      sessionId,
      url: args.url,
      width: args.width,
      height: args.height,
      show: args.show ?? true,
    })
    return { ...session, ...win }
  }

  private async sessionCreate(args: Record<string, unknown>) {
    const sessionId = randomUUID()
    const persist = Boolean(args.persist)
    const partition = persist
      ? `persist:nf-${this.runId}-${sessionId}`
      : `nf-${this.runId}-${sessionId}`
    const ses = electronSession.fromPartition(partition, { cache: true })
    const userAgent =
      typeof args.userAgent === 'string' && args.userAgent.trim()
        ? args.userAgent.trim()
        : ses.getUserAgent()
    if (userAgent) ses.setUserAgent(userAgent)
    const rec: SessionRec = {
      sessionId,
      partition,
      persist,
      ses,
      userAgent,
      windows: new Map(),
    }
    this.sessions.set(sessionId, rec)
    this.trackSession(sessionId)
    return { ok: true, sessionId, partition, persist, userAgent }
  }

  private async sessionClose(sessionId: string) {
    const s = this.sessions.get(sessionId)
    if (!s) return { ok: true, closed: false }
    for (const w of [...s.windows.values()]) {
      if (!w.win.isDestroyed()) w.win.destroy()
    }
    s.windows.clear()
    this.sessions.delete(sessionId)
    return { ok: true, closed: true, sessionId }
  }

  private async sessionClear(sessionId: string) {
    const s = this.getSession(sessionId)
    await s.ses.clearStorageData()
    await s.ses.clearCache()
    return { ok: true, sessionId }
  }

  private async sessionSetProxy(args: Record<string, unknown>) {
    const s = this.getSession(String(args.sessionId ?? ''))
    const proxyRules = typeof args.proxyRules === 'string' ? args.proxyRules : ''
    await s.ses.setProxy({ proxyRules: proxyRules || undefined, mode: proxyRules ? 'fixed_servers' : 'direct' })
    return { ok: true }
  }

  private async sessionSetUa(args: Record<string, unknown>) {
    const s = this.getSession(String(args.sessionId ?? ''))
    const ua = String(args.userAgent ?? '')
    s.userAgent = ua
    s.ses.setUserAgent(ua)
    return { ok: true, userAgent: ua }
  }

  private async sessionFetch(args: Record<string, unknown>) {
    const s = this.getSession(String(args.sessionId ?? ''))
    const url = String(args.url ?? '')
    const method = String(args.method ?? 'GET')
    const headers = (args.headers as Record<string, string>) ?? {}
    const body = args.body != null ? String(args.body) : undefined
    const res = await s.ses.fetch(url, { method, headers, body })
    const text = await res.text()
    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      headers: Object.fromEntries(res.headers.entries()),
      body: text,
    }
  }

  private async cookiesGet(args: Record<string, unknown>) {
    const s = this.getSession(String(args.sessionId ?? ''))
    const filter: Electron.CookiesGetFilter = {}
    if (typeof args.url === 'string') filter.url = args.url
    if (typeof args.name === 'string') filter.name = args.name
    if (typeof args.domain === 'string') filter.domain = args.domain
    const cookies = await s.ses.cookies.get(filter)
    return { ok: true, cookies }
  }

  private async cookiesSet(args: Record<string, unknown>) {
    const s = this.getSession(String(args.sessionId ?? ''))
    const details = args.cookie as Electron.CookiesSetDetails
    await s.ses.cookies.set(details)
    return { ok: true }
  }

  private async cookiesRemove(args: Record<string, unknown>) {
    const s = this.getSession(String(args.sessionId ?? ''))
    await s.ses.cookies.remove(String(args.url ?? ''), String(args.name ?? ''))
    return { ok: true }
  }

  private async windowCreate(args: Record<string, unknown>) {
    const sessionId = String(args.sessionId ?? '')
    const s = this.getSession(sessionId)
    const windowId = randomUUID()
    const width = Number(args.width ?? 1280)
    const height = Number(args.height ?? 800)
    const show = args.show !== false
    const win = new BrowserWindow({
      width,
      height,
      show,
      autoHideMenuBar: true,
      title: 'Navora Flow Browser',
      webPreferences: {
        session: s.ses,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    })
    const rec: WindowRec = {
      windowId,
      sessionId,
      win,
      title: 'Navora Flow Browser',
      url: 'about:blank',
      visible: show,
    }
    s.windows.set(windowId, rec)
    win.on('page-title-updated', (_e, title) => {
      rec.title = title
    })
    win.on('closed', () => {
      s.windows.delete(windowId)
    })
    const url = typeof args.url === 'string' ? args.url : ''
    if (url) {
      await win.loadURL(url)
      rec.url = url
    }
    this.resources.track('browser_window', windowId, async () => {
      await this.windowClose(windowId)
    })
    return { ok: true, windowId, sessionId, url: rec.url }
  }

  private async windowClose(windowId: string) {
    try {
      const w = this.getWindow(windowId)
      if (!w.win.isDestroyed()) w.win.destroy()
      this.getSession(w.sessionId).windows.delete(windowId)
      return { ok: true, closed: true }
    } catch {
      return { ok: true, closed: false }
    }
  }

  private async windowSetVisible(args: Record<string, unknown>) {
    const w = this.getWindow(String(args.windowId ?? ''))
    const visible = Boolean(args.visible)
    if (visible) w.win.show()
    else w.win.hide()
    w.visible = visible
    return { ok: true, visible }
  }

  private async windowSetBounds(args: Record<string, unknown>) {
    const w = this.getWindow(String(args.windowId ?? ''))
    const bounds = w.win.getBounds()
    w.win.setBounds({
      x: args.x != null ? Number(args.x) : bounds.x,
      y: args.y != null ? Number(args.y) : bounds.y,
      width: args.width != null ? Number(args.width) : bounds.width,
      height: args.height != null ? Number(args.height) : bounds.height,
    })
    return { ok: true, bounds: w.win.getBounds() }
  }

  private async windowFocus(windowId: string) {
    const w = this.getWindow(windowId)
    w.win.focus()
    return { ok: true }
  }

  private async navigate(args: Record<string, unknown>) {
    const w = this.getWindow(String(args.windowId ?? ''))
    const url = String(args.url ?? '')
    await w.win.loadURL(url)
    w.url = w.win.webContents.getURL()
    return { ok: true, url: w.url, title: w.win.getTitle() }
  }

  private async navHistory(args: Record<string, unknown>, dir: 'back' | 'forward') {
    const w = this.getWindow(String(args.windowId ?? ''))
    if (dir === 'back') w.win.webContents.goBack()
    else w.win.webContents.goForward()
    await sleep(200)
    w.url = w.win.webContents.getURL()
    return { ok: true, url: w.url }
  }

  private async reload(args: Record<string, unknown>) {
    const w = this.getWindow(String(args.windowId ?? ''))
    w.win.webContents.reload()
    await sleep(200)
    return { ok: true, url: w.win.webContents.getURL() }
  }

  private async wait(args: Record<string, unknown>) {
    const ms = Number(args.timeoutMs ?? args.ms ?? 1000)
    const selector = typeof args.selector === 'string' ? args.selector : ''
    const windowId = String(args.windowId ?? '')
    if (!selector) {
      await sleep(ms)
      return { ok: true, waitedMs: ms }
    }
    const w = this.getWindow(windowId)
    const deadline = Date.now() + ms
    while (Date.now() < deadline) {
      const found = await w.win.webContents.executeJavaScript(
        `!!document.querySelector(${JSON.stringify(selector)})`,
      )
      if (found) return { ok: true, found: true }
      await sleep(100)
    }
    return { ok: false, found: false, error: 'timeout' }
  }

  private async click(args: Record<string, unknown>) {
    const w = this.getWindow(String(args.windowId ?? ''))
    const selector = String(args.selector ?? '')
    const js = `
      (() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return { ok: false, error: 'not found' };
        el.scrollIntoView({ block: 'center', inline: 'center' });
        el.click();
        return { ok: true };
      })()
    `
    return w.win.webContents.executeJavaScript(js)
  }

  private async type(args: Record<string, unknown>) {
    const w = this.getWindow(String(args.windowId ?? ''))
    const selector = String(args.selector ?? '')
    const text = String(args.text ?? '')
    const clear = args.clear !== false
    const js = `
      (() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return { ok: false, error: 'not found' };
        el.focus();
        if (${clear ? 'true' : 'false'}) {
          if ('value' in el) el.value = '';
          else el.textContent = '';
        }
        if ('value' in el) {
          el.value = ${JSON.stringify(text)};
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          el.textContent = ${JSON.stringify(text)};
        }
        return { ok: true };
      })()
    `
    return w.win.webContents.executeJavaScript(js)
  }

  private async press(args: Record<string, unknown>) {
    const w = this.getWindow(String(args.windowId ?? ''))
    const key = String(args.key ?? 'Enter')
    w.win.webContents.sendInputEvent({ type: 'keyDown', keyCode: key })
    w.win.webContents.sendInputEvent({ type: 'keyUp', keyCode: key })
    return { ok: true, key }
  }

  private async hover(args: Record<string, unknown>) {
    const w = this.getWindow(String(args.windowId ?? ''))
    const selector = String(args.selector ?? '')
    const js = `
      (() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return { ok: false, error: 'not found' };
        el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        return { ok: true };
      })()
    `
    return w.win.webContents.executeJavaScript(js)
  }

  private async scroll(args: Record<string, unknown>) {
    const w = this.getWindow(String(args.windowId ?? ''))
    const x = Number(args.x ?? 0)
    const y = Number(args.y ?? 0)
    await w.win.webContents.executeJavaScript(`window.scrollBy(${x}, ${y})`)
    return { ok: true }
  }

  private async select(args: Record<string, unknown>) {
    const w = this.getWindow(String(args.windowId ?? ''))
    const selector = String(args.selector ?? '')
    const value = String(args.value ?? '')
    const js = `
      (() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return { ok: false, error: 'not found' };
        el.value = ${JSON.stringify(value)};
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return { ok: true, value: el.value };
      })()
    `
    return w.win.webContents.executeJavaScript(js)
  }

  private async find(args: Record<string, unknown>) {
    const w = this.getWindow(String(args.windowId ?? ''))
    const selector = String(args.selector ?? '')
    const js = `
      (() => {
        const els = [...document.querySelectorAll(${JSON.stringify(selector)})];
        return {
          ok: true,
          count: els.length,
          items: els.slice(0, 50).map((el) => ({
            tag: el.tagName,
            text: (el.innerText || '').slice(0, 200),
            href: el.getAttribute('href'),
          })),
        };
      })()
    `
    return w.win.webContents.executeJavaScript(js)
  }

  private async get(args: Record<string, unknown>) {
    const w = this.getWindow(String(args.windowId ?? ''))
    const fields = (args.fields as string[]) ?? ['url', 'title', 'html']
    const out: Record<string, unknown> = { ok: true }
    if (fields.includes('url')) out.url = w.win.webContents.getURL()
    if (fields.includes('title')) out.title = w.win.getTitle()
    if (fields.includes('html')) {
      out.html = await w.win.webContents.executeJavaScript('document.documentElement.outerHTML')
    }
    if (fields.includes('text')) {
      out.text = await w.win.webContents.executeJavaScript('document.body?.innerText ?? ""')
    }
    return out
  }

  private async evaluate(args: Record<string, unknown>) {
    const w = this.getWindow(String(args.windowId ?? ''))
    const expression = String(args.expression ?? args.code ?? '')
    const result = await w.win.webContents.executeJavaScript(expression)
    return { ok: true, result }
  }

  private async screenshot(args: Record<string, unknown>) {
    const w = this.getWindow(String(args.windowId ?? ''))
    const img = await w.win.webContents.capturePage()
    const png = img.toPNG()
    const file =
      typeof args.path === 'string' && args.path
        ? args.path
        : join(this.dataRoot, 'screenshots', `${w.windowId}-${Date.now()}.png`)
    const { mkdirSync, writeFileSync } = await import('node:fs')
    const { dirname } = await import('node:path')
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, png)
    return { ok: true, path: file, bytes: png.length }
  }

  private listResources() {
    const sessions = [...this.sessions.values()].map((s) => ({
      sessionId: s.sessionId,
      partition: s.partition,
      persist: s.persist,
      windows: [...s.windows.values()].map((w) => ({
        windowId: w.windowId,
        url: w.url,
        title: w.title,
        visible: w.visible,
      })),
    }))
    return { ok: true, runId: this.runId, sessions }
  }

  private async browserFlow(args: Record<string, unknown>) {
    const steps = (args.steps as Array<{ tool: string; args?: Record<string, unknown> }>) ?? []
    const results: unknown[] = []
    for (const step of steps) {
      const r = await this.invoke(step.tool, {
        windowId: args.windowId,
        sessionId: args.sessionId,
        ...(step.args ?? {}),
      })
      results.push({ tool: step.tool, result: r })
    }
    return { ok: true, results }
  }
}
