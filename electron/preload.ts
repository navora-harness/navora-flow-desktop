import { contextBridge, ipcRenderer } from 'electron'
import type { NavoraFlowApi } from '../shared/ipc-types'
import type { FlowGraph } from 'navora-flow-library-sdk'

const api: NavoraFlowApi = {
  getAppInfo: () => ipcRenderer.invoke('nf:getAppInfo'),
  getCatalog: () => ipcRenderer.invoke('nf:getCatalog'),
  runGraph: (graph, options) => ipcRenderer.invoke('nf:runGraph', graph, options),
  showMainWindow: () => ipcRenderer.invoke('nf:showMainWindow'),
  hideToTray: () => ipcRenderer.invoke('nf:hideToTray'),
}

contextBridge.exposeInMainWorld('navoraFlow', api)
