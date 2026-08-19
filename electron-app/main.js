const { app, BrowserWindow, Tray, Menu, nativeImage, dialog, shell } = require("electron")
const { autoUpdater } = require("electron-updater")
const path = require("path")
const log = require("electron-log")

// Configure logging
autoUpdater.logger = log
autoUpdater.logger.transports.file.level = "info"
log.info("App starting...")

const APP_URL = "https://apexscript-solutionsph.vercel.app/dashboard/transcript-editor"
const ALLOWED_HOSTS = [
  "apexscript-solutionsph.vercel.app",
  "landing-page-heading.vercel.app",
  "ph-apexscriptsolutions.vercel.app",
  "supabase.co",
  "supabase.com"
]

let mainWindow = null
let tray = null
app.isQuitting = false

// ─── Window ──────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "ApexScript Transcription Workspace",
    icon: path.join(__dirname, "build", "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
    show: false,
    backgroundColor: "#090d16",
    autoHideMenuBar: true,
  })

  mainWindow.loadURL(APP_URL)

  mainWindow.once("ready-to-show", () => {
    mainWindow.show()
    mainWindow.focus()
  })

  // Block navigation away from ApexScript / Supabase domains
  mainWindow.webContents.on("will-navigate", (event, url) => {
    try {
      const parsedUrl = new URL(url)
      const isAllowed = ALLOWED_HOSTS.some(
        (host) => parsedUrl.hostname === host || parsedUrl.hostname.endsWith("." + host)
      )
      if (!isAllowed) {
        event.preventDefault()
        shell.openExternal(url)
      }
    } catch {
      event.preventDefault()
    }
  })

  // Open external links in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: "deny" }
  })

  // Minimize to tray instead of closing
  mainWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      mainWindow.hide()
      if (process.platform === "win32") {
        tray && tray.displayBalloon({
          title: "ApexScript",
          content: "Still running in the background. Click the tray icon to reopen.",
          iconType: "info",
          noSound: true,
        })
      }
    }
  })
}

// ─── System Tray ─────────────────────────────────────────────
function createTray() {
  const iconPath = path.join(__dirname, "build", "icon.ico")
  try {
    tray = new Tray(nativeImage.createFromPath(iconPath))
  } catch {
    tray = new Tray(nativeImage.createEmpty())
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open ApexScript",
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
        }
      },
    },
    { type: "separator" },
    {
      label: "Reload Workspace",
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.webContents.reload()
        }
      },
    },
    { type: "separator" },
    {
      label: "Quit ApexScript",
      click: () => {
        app.isQuitting = true
        app.quit()
      },
    },
  ])

  tray.setToolTip("ApexScript Transcription Workspace")
  tray.setContextMenu(contextMenu)
  tray.on("click", () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
    }
  })
  tray.on("double-click", () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

// ─── Auto-Updater ─────────────────────────────────────────────
function setupAutoUpdater() {
  // Check on startup (after 3s delay to let app settle)
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      log.warn("Auto-update check failed:", err.message)
    })
  }, 3000)

  // Check every 2 hours
  setInterval(() => {
    autoUpdater.checkForUpdatesAndNotify().catch(() => {})
  }, 2 * 60 * 60 * 1000)

  autoUpdater.on("checking-for-update", () => {
    log.info("Checking for update...")
  })

  autoUpdater.on("update-available", (info) => {
    log.info("Update available:", info.version)
    dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "Update Available",
      message: `ApexScript v${info.version} is available.`,
      detail: "Downloading in the background. You will be notified when it is ready.",
      buttons: ["OK"],
      icon: path.join(__dirname, "build", "icon.ico"),
    }).catch(() => {})
  })

  autoUpdater.on("update-not-available", () => {
    log.info("App is up to date.")
  })

  autoUpdater.on("download-progress", (progressObj) => {
    const percent = Math.round(progressObj.percent)
    if (mainWindow) {
      mainWindow.setProgressBar(percent / 100)
      mainWindow.setTitle(`ApexScript — Downloading update ${percent}%`)
    }
  })

  autoUpdater.on("update-downloaded", (info) => {
    log.info("Update downloaded:", info.version)
    if (mainWindow) {
      mainWindow.setProgressBar(-1)
      mainWindow.setTitle("ApexScript Transcription Workspace")
    }
    dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "Update Ready",
      message: `ApexScript v${info.version} is ready to install.`,
      detail: "The app will restart to apply the update. Your work is saved in the cloud.",
      buttons: ["Restart Now", "Later"],
      defaultId: 0,
      icon: path.join(__dirname, "build", "icon.ico"),
    }).then(({ response }) => {
      if (response === 0) {
        app.isQuitting = true
        autoUpdater.quitAndInstall()
      }
    }).catch(() => {})
  })

  autoUpdater.on("error", (err) => {
    log.error("Auto-updater error:", err.message)
  })
}

// ─── App Lifecycle ────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow()
  createTray()
  setupAutoUpdater()
})

app.on("window-all-closed", (event) => {
  // Do NOT quit — keep running in tray
  if (!app.isQuitting) {
    event.preventDefault()
  }
})

app.on("activate", () => {
  if (mainWindow) {
    mainWindow.show()
    mainWindow.focus()
  }
})

app.on("before-quit", () => {
  app.isQuitting = true
})
