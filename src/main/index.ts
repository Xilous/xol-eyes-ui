import { join } from "path";
import { app, BrowserWindow, ipcMain, clipboard, shell } from "electron";
import log from "electron-log";
import { initUpdater } from "./updater";
import { initWsServer, sendToExtension, isConnected, WS_PORT } from "./wsServer";
import { appendPicks, inboxPath } from "./inbox";
import { formatBatch } from "./format";

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 440,
    height: 680,
    minWidth: 380,
    minHeight: 520,
    show: false,
    title: "Xol Eyes UI",
    backgroundColor: "#0b0f19",
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.on("ready-to-show", () => mainWindow?.show());
  mainWindow.on("closed", () => (mainWindow = null));
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  const devUrl = process.env["ELECTRON_RENDERER_URL"];
  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();
  initWsServer(() => mainWindow);
  if (mainWindow) initUpdater(mainWindow);

  ipcMain.handle("app:info", () => ({
    version: app.getVersion(),
    wsPort: WS_PORT,
    inbox: inboxPath(),
    connected: isConnected(),
  }));
  ipcMain.handle("ext:listTabs", () => sendToExtension({ type: "listTabs" }));
  ipcMain.handle("ext:startPick", (_e, tabId: number) => sendToExtension({ type: "startPick", tabId }));
  ipcMain.handle("ext:stopPick", (_e, tabId: number) => sendToExtension({ type: "stopPick", tabId }));
  ipcMain.handle("picks:submit", async (_e, picks: unknown[]) => appendPicks(picks));
  ipcMain.handle("picks:copy", (_e, picks: unknown[]) => {
    clipboard.writeText(formatBatch(picks as never[]));
    return true;
  });
  ipcMain.handle("inbox:reveal", () => shell.showItemInFolder(inboxPath()));

  log.info(`[xol] app ready, v${app.getVersion()}`);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
