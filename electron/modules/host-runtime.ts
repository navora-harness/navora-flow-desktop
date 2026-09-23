import {
  FlowRuntime,
  createRunEnvironment,
  mergeNodeTypes,
  type FlowGraph,
  type InstalledLibrary,
  type LibraryManifest,
  type RunResult,
} from 'navora-flow-library-sdk'
import { BUILTIN_NODE_TYPES, createBuiltinModule } from '../../shared/builtin-catalog'
import { AUTOMATION_NODE_TYPES, createAutomationModule } from '../../shared/automation-catalog'
import type { CatalogEntry } from '../../shared/catalog'
import { getDataRoot } from './data-root'
import { FlowBrowserHost } from './automation/browser-host'

export type { CatalogEntry }

export type RunGraphOptions = {
  env?: Record<string, string>
  vars?: Record<string, unknown>
  stdin?: unknown[]
  cwd?: string
}

export class HostRuntime {
  private libraries = new Map<string, InstalledLibrary>()

  constructor() {
    this.seedBuiltin()
    this.seedAutomation()
  }

  private seedBuiltin(): void {
    const manifest: LibraryManifest = {
      id: 'builtin-core',
      name: 'Builtin Core',
      version: '0.1.0',
      main: 'main.cjs',
      nodes: BUILTIN_NODE_TYPES,
    }
    this.libraries.set('builtin-core', { manifest, module: createBuiltinModule() })
  }

  private seedAutomation(): void {
    const manifest: LibraryManifest = {
      id: 'browser-automation',
      name: 'Browser Automation',
      version: '0.1.0',
      description: 'Navora-compatible browser_* automation for Flow',
      main: 'main.cjs',
      capabilities: ['browser'],
      nodes: AUTOMATION_NODE_TYPES,
    }
    this.libraries.set('browser-automation', { manifest, module: createAutomationModule() })
  }

  getCatalog(): CatalogEntry[] {
    const out: CatalogEntry[] = []
    for (const [libraryId, lib] of this.libraries) {
      for (const n of lib.manifest.nodes) {
        out.push({
          ...n,
          libraryId,
          libraryVersion: lib.manifest.version,
        })
      }
    }
    return out.sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title))
  }

  getNodeTypes() {
    return mergeNodeTypes(this.libraries.values())
  }

  async runGraph(graph: FlowGraph, options: RunGraphOptions = {}): Promise<RunResult> {
    const runEnv = createRunEnvironment({
      cwd: options.cwd ?? getDataRoot(),
      env: options.env,
      vars: options.vars,
      stdin: options.stdin,
    })
    const host = new FlowBrowserHost({
      runId: runEnv.runId,
      resources: runEnv.resources,
      dataRoot: getDataRoot(),
    })
    runEnv.automation = host

    return new FlowRuntime().run({
      graph,
      libraries: this.libraries,
      nodeTypes: this.getNodeTypes(),
      recordSnapshots: true,
      runEnv,
      cleanupResources: true,
      onLog: (level, message, data) => runEnv.log(level, message, data),
    })
  }
}
