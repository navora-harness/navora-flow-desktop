import {
  FlowRuntime,
  mergeNodeTypes,
  type FlowGraph,
  type InstalledLibrary,
  type LibraryManifest,
  type LibraryModule,
  type RunResult,
} from 'navora-flow-library-sdk'
import { BUILTIN_NODE_TYPES, createBuiltinModule } from '../../shared/builtin-catalog'
import type { CatalogEntry } from '../../shared/catalog'

export type { CatalogEntry }

export class HostRuntime {
  private libraries = new Map<string, InstalledLibrary>()

  constructor() {
    this.seedBuiltin()
  }

  private seedBuiltin(): void {
    const manifest: LibraryManifest = {
      id: 'builtin-core',
      name: 'Builtin Core',
      version: '0.1.0',
      main: 'main.cjs',
      nodes: BUILTIN_NODE_TYPES,
    }
    const module: LibraryModule = createBuiltinModule()
    this.libraries.set('builtin-core', { manifest, module })
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

  async runGraph(graph: FlowGraph): Promise<RunResult> {
    return new FlowRuntime().run({
      graph,
      libraries: this.libraries,
      nodeTypes: this.getNodeTypes(),
      recordSnapshots: true,
    })
  }
}
