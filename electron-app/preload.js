const { contextBridge } = require("electron")

contextBridge.exposeInMainWorld("electronBridge", {
  isElectronApp: true,
  platform: process.platform,
  version: process.env.npm_package_version || "1.0.0",
})
