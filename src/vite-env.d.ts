/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

import type { NavoraFlowApi } from '../shared/ipc-types'

declare global {
  interface Window {
    navoraFlow?: NavoraFlowApi
  }
}

export {}
