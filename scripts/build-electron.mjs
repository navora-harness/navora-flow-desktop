import * as esbuild from 'esbuild'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outdir = join(root, 'dist-electron')
mkdirSync(outdir, { recursive: true })

await esbuild.build({
  entryPoints: [join(root, 'electron/main.ts')],
  outfile: join(outdir, 'main.cjs'),
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  external: ['electron'],
  logLevel: 'info',
})

await esbuild.build({
  entryPoints: [join(root, 'electron/preload.ts')],
  outfile: join(outdir, 'preload.cjs'),
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  external: ['electron'],
  logLevel: 'info',
})

console.log('electron main/preload built → dist-electron/')
