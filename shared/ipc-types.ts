import type { FlowGraph, RunResult } from 'navora-flow-library-sdk'
import type { CatalogEntry } from './catalog'
import type { BridgeInfo } from './bridge-info'

export type AppInfo = {
  name: string
  version: string
  dataRoot: string
  bridge: BridgeInfo | null
}

export type NavoraFlowApi = {
  getAppInfo: () => Promise<AppInfo>
  getCatalog: () => Promise<CatalogEntry[]>
  runGraph: (graph: FlowGraph) => Promise<RunResult>
  showMainWindow: () => Promise<void>
  hideToTray: () => Promise<void>
}
