import * as esbuild from 'esbuild'
import { cpSync, mkdirSync, existsSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outdir = join(root, 'dist-electron')
mkdirSync(outdir, { recursive: true })
mkdirSync(join(outdir, 'assets'), { recursive: true })

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

const assetsSrc = join(root, 'electron/assets')
if (existsSync(assetsSrc)) {
  cpSync(assetsSrc, join(outdir, 'assets'), { recursive: true })
} else {
  // minimal 16x16 teal PNG
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAALElEQVQ4T2NkoBAwUqifgYGB4T8DwwEGBgYGRgr1jzIw/Gdg+M9AqX4GBgYGABfKBBfJ8mZSAAAAAElFTkSuQmCC',
    'base64',
  )
  writeFileSync(join(outdir, 'assets', 'tray-icon.png'), png)
  mkdirSync(assetsSrc, { recursive: true })
  writeFileSync(join(assetsSrc, 'tray-icon.png'), png)
}

console.log('electron main/preload built → dist-electron/')
