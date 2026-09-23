import type { NodeTypeDecl } from 'navora-flow-library-sdk'

export type CatalogEntry = NodeTypeDecl & {
  libraryId: string
  libraryVersion: string
}
