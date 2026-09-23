import { Tray, Menu, nativeImage, app, type BrowserWindow, type NativeImage } from 'electron'
import fs from 'node:fs'
import path from 'node:path'

/** Injected by CJS bundle. */
declare const __dirname: string

export type TrayController = {
  destroy: () => void
  showMain: () => void
  hideToTray: () => void
}

function loadTrayImage(): NativeImage {
  const candidates = [
    path.join(__dirname, 'assets', 'tray-icon.png'),
    path.join(__dirname, '..', 'electron', 'assets', 'tray-icon.png'),
    path.join(app.getAppPath(), 'electron', 'assets', 'tray-icon.png'),
  ]
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue
    let img = nativeImage.createFromPath(file)
    if (img.isEmpty()) continue
    const { width } = img.getSize()
    if (width > 32) img = img.resize({ width: 16, height: 16, quality: 'best' })
    return img
  }
  // Fallback: solid teal square
  return nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAKElEQVQ4T2NkYGD4z0ABYBzVMKoBBg0wGjDDgBkNzGhgRgMzGhjRAABdSwENqYqXVwAAAABJRU5ErkJggg==',
  )
}

export function createAppTray(opts: {
  getMainWindow: () => BrowserWindow | null
  createWindow: () => void
  onQuit: () => void
}): TrayController {
  const tray = new Tray(loadTrayImage())
  tray.setToolTip('Navora Flow')

  const showMain = () => {
    let win = opts.getMainWindow()
    if (!win || win.isDestroyed()) {
      opts.createWindow()
      win = opts.getMainWindow()
    }
    if (!win || win.isDestroyed()) return
    if (win.isMinimized()) win.restore()
    win.show()
    win.focus()
  }

  const hideToTray = () => {
    const win = opts.getMainWindow()
    if (win && !win.isDestroyed()) win.hide()
  }

  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: '显示 Navora Flow', click: () => showMain() },
      { label: '隐藏到托盘', click: () => hideToTray() },
      { type: 'separator' },
      { label: '退出', click: () => opts.onQuit() },
    ]),
  )
  tray.on('double-click', () => showMain())
  tray.on('click', () => {
    if (process.platform === 'darwin') return
    const win = opts.getMainWindow()
    if (win && !win.isDestroyed() && win.isVisible()) hideToTray()
    else showMain()
  })

  return { destroy: () => tray.destroy(), showMain, hideToTray }
}
