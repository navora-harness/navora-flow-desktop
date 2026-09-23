import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('navoraFlow', {
  version: '0.1.0',
})
