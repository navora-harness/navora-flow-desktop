/**
 * Local bridge so Navora (or other hosts) can invoke Navora Flow later.
 * Discovery file: <dataRoot>/bridge.json
 *
 * Protocol (v0):
 *   GET  /health
 *   GET  /v1/catalog
 *   POST /v1/run   body: { graph: FlowGraph }
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import type { FlowGraph } from 'navora-flow-library-sdk'
import type { HostRuntime } from './host-runtime'
import { ensureDir } from './data-root'
import type { BridgeInfo } from '../../shared/bridge-info'

export type { BridgeInfo }

export type BridgeController = {
  info: () => BridgeInfo | null
  stop: () => Promise<void>
}

function readJson(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        resolve(raw ? JSON.parse(raw) : {})
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

function send(res: http.ServerResponse, status: number, body: unknown): void {
  const data = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': 'http://127.0.0.1',
  })
  res.end(data)
}

export function startNavoraBridge(opts: {
  dataRoot: string
  runtime: HostRuntime
  /** default true — localhost only */
  enabled?: boolean
}): BridgeController {
  const enabled = opts.enabled !== false && process.env.NAVORA_FLOW_BRIDGE !== '0'
  if (!enabled) {
    return { info: () => null, stop: async () => undefined }
  }

  let bridgeInfo: BridgeInfo | null = null
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1')
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': 'http://127.0.0.1',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      })
      res.end()
      return
    }

    try {
      if (req.method === 'GET' && url.pathname === '/health') {
        send(res, 200, { ok: true, service: 'navora-flow', protocolVersion: 0 })
        return
      }
      if (req.method === 'GET' && url.pathname === '/v1/catalog') {
        send(res, 200, { nodes: opts.runtime.getCatalog() })
        return
      }
      if (req.method === 'POST' && url.pathname === '/v1/run') {
        const body = (await readJson(req)) as { graph?: FlowGraph }
        if (!body.graph) {
          send(res, 400, { ok: false, error: 'missing graph' })
          return
        }
        const result = await opts.runtime.runGraph(body.graph)
        send(res, result.ok ? 200 : 422, result)
        return
      }
      send(res, 404, { ok: false, error: 'not found' })
    } catch (e) {
      send(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) })
    }
  })

  server.listen(0, '127.0.0.1', () => {
    const addr = server.address()
    if (!addr || typeof addr === 'string') return
    bridgeInfo = {
      enabled: true,
      host: '127.0.0.1',
      port: addr.port,
      url: `http://127.0.0.1:${addr.port}`,
      protocolVersion: 0,
    }
    try {
      ensureDir(opts.dataRoot)
      fs.writeFileSync(
        path.join(opts.dataRoot, 'bridge.json'),
        JSON.stringify({ ...bridgeInfo, updatedAt: new Date().toISOString() }, null, 2),
        'utf8',
      )
      console.log('[navora-bridge]', bridgeInfo.url)
    } catch (e) {
      console.warn('[navora-bridge] write discovery failed', e)
    }
  })

  return {
    info: () => bridgeInfo,
    stop: () =>
      new Promise((resolve) => {
        server.close(() => resolve())
      }),
  }
}
