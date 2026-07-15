import { contextBridge, ipcRenderer } from "electron";

const api = {
  info: () => ipcRenderer.invoke("app:info"),

  // extension commands
  listTabs: () => ipcRenderer.invoke("ext:listTabs"),
  startPick: (tabId: number) => ipcRenderer.invoke("ext:startPick", tabId),
  stopPick: (tabId: number) => ipcRenderer.invoke("ext:stopPick", tabId),

  // picks delivery
  submitPicks: (picks: unknown[]) => ipcRenderer.invoke("picks:submit", picks),
  copyPicks: (picks: unknown[]) => ipcRenderer.invoke("picks:copy", picks),
  revealInbox: () => ipcRenderer.invoke("inbox:reveal"),

  // updater
  checkUpdate: () => ipcRenderer.invoke("update:check"),
  restartToUpdate: () => ipcRenderer.send("update:install"),

  // event subscription; returns an unsubscribe fn
  on: (channel: string, cb: (payload: unknown) => void) => {
    const listener = (_e: unknown, payload: unknown) => cb(payload);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  },
};

contextBridge.exposeInMainWorld("xol", api);

export type XolApi = typeof api;
