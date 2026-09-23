import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'node:path'
import { getDataRoot, ensureDir } from './modules/data-root'
import { loadWindowState, trackWindowState } from './modules/window-state'
import { createAppTray, type TrayController } from './modules/tray'
import { HostRuntime } from './modules/host-runtime'
import { startNavoraBridge, type BridgeController } from './modules/navora-bridge'
import type { FlowGraph } from 'navora-flow-library-sdk'

/** Injected by the CJS bundle (esbuild). */
declare const __dirname: string

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
}

let mainWindow: BrowserWindow | null = null
let tray: TrayController | null = null
let bridge: BridgeController | null = null
let isQuitting = false
const runtime = new HostRuntime()

function getMainWindow() {
  return mainWindow
}

function createWindow() {
  const dataRoot = getDataRoot()
  ensureDir(dataRoot)
  const state = loadWindowState(dataRoot)

  mainWindow = new BrowserWindow({
    width: state.width,
    height: state.height,
    x: state.x,
    y: state.y,
    minWidth: 960,
    minHeight: 640,
    title: 'Navora Flow',
    show: false,
    backgroundColor: '#f4f6f8',
    webPreferences: {
      preload: join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (state.maximized) mainWindow.maximize()
  trackWindowState(mainWindow, dataRoot)

  const devUrl = process.env.VITE_DEV_SERVER_URL
  if (devUrl) {
    void mainWindow.loadURL(devUrl)
    if (process.env.NAVORA_FLOW_OPEN_DEVTOOLS === '1') {
      mainWindow.webContents.openDevTools({ mode: 'detach' })
    }
  } else {
    void mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => mainWindow?.show())

  mainWindow.on('close', (e) => {
    if (isQuitting) return
    e.preventDefault()
    mainWindow?.hide()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function registerIpc() {
  ipcMain.handle('nf:getAppInfo', () => ({
    name: 'Navora Flow',
    version: app.getVersion(),
    dataRoot: getDataRoot(),
    bridge: bridge?.info() ?? null,
  }))

  ipcMain.handle('nf:getCatalog', () => runtime.getCatalog())

  ipcMain.handle('nf:runGraph', async (_e, graph: FlowGraph) => runtime.runGraph(graph))

  ipcMain.handle('nf:showMainWindow', () => {
    tray?.showMain()
  })

  ipcMain.handle('nf:hideToTray', () => {
    tray?.hideToTray()
  })
}

if (gotLock) {
  app.on('second-instance', () => {
    tray?.showMain()
  })

  app.whenReady().then(() => {
    const dataRoot = getDataRoot()
    ensureDir(dataRoot)
    registerIpc()
    bridge = startNavoraBridge({ dataRoot, runtime, enabled: true })
    createWindow()
    tray = createAppTray({
      getMainWindow,
      createWindow,
      onQuit: () => {
        isQuitting = true
        app.quit()
      },
    })
  })

  app.on('before-quit', () => {
    isQuitting = true
  })

  app.on('window-all-closed', () => {
    // Keep running in tray on Windows/Linux
    if (process.platform === 'darwin' && !isQuitting) return
  })

  app.on('activate', () => {
    if (!mainWindow) createWindow()
    else tray?.showMain()
  })

  app.on('will-quit', () => {
    tray?.destroy()
    void bridge?.stop()
  })
}
