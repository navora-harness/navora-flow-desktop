import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'

/** Dev: <repo>/portable ; packaged: next to exe or userData */
export function getDataRoot(): string {
  if (process.env.NAVORA_FLOW_DATA_ROOT) {
    return path.resolve(process.env.NAVORA_FLOW_DATA_ROOT)
  }
  if (!app.isPackaged) {
    return path.join(app.getAppPath(), 'portable')
  }
  return path.join(path.dirname(process.execPath), 'data')
}

export function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true })
}
