import { app, BrowserWindow, ipcMain } from "electron";
import electronUpdater from "electron-updater";
import log from "electron-log";

const { autoUpdater } = electronUpdater;

export function initUpdater(win: BrowserWindow): void {
  autoUpdater.logger = log;
  log.transports.file.level = "info";
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  const send = (channel: string, payload?: unknown) => {
    if (!win.isDestroyed()) win.webContents.send(channel, payload);
  };

  autoUpdater.on("checking-for-update", () => send("update:checking"));
  autoUpdater.on("update-available", (i) => send("update:available", i.version));
  autoUpdater.on("update-not-available", () => send("update:none"));
  autoUpdater.on("download-progress", (p) => send("update:progress", Math.round(p.percent)));
  autoUpdater.on("update-downloaded", (i) => send("update:ready", i.version));
  autoUpdater.on("error", (e) => send("update:error", String((e as Error)?.message || e)));

  ipcMain.on("update:install", () => {
    // give the renderer a tick to unmount, then quit + install + relaunch
    setImmediate(() => autoUpdater.quitAndInstall());
  });
  ipcMain.handle("update:check", async () => {
    if (!app.isPackaged) return { skipped: "dev" };
    try {
      const r = await autoUpdater.checkForUpdates();
      return { version: r?.updateInfo?.version ?? null };
    } catch (e) {
      return { error: String((e as Error)?.message || e) };
    }
  });

  if (app.isPackaged) {
    autoUpdater.checkForUpdates().catch(() => {});
    setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), 60 * 60 * 1000);
  }
}
