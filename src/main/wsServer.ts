import { BrowserWindow } from "electron";
import { WebSocketServer, WebSocket } from "ws";
import log from "electron-log";

export const WS_PORT = 8917;

let wss: WebSocketServer | null = null;
let client: WebSocket | null = null;
let getWin: () => BrowserWindow | null = () => null;

export function initWsServer(winGetter: () => BrowserWindow | null): void {
  getWin = winGetter;
  wss = new WebSocketServer({ host: "127.0.0.1", port: WS_PORT });

  wss.on("connection", (ws) => {
    client = ws;
    log.info("[xol] extension connected");
    toRenderer("bridge:status", { connected: true });

    ws.on("message", (data) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(data.toString());
      } catch {
        return;
      }
      handleFromExtension(msg);
    });
    ws.on("close", () => {
      if (client === ws) client = null;
      toRenderer("bridge:status", { connected: false });
      log.info("[xol] extension disconnected");
    });
    ws.on("error", (e) => log.warn("[xol] ws error", e));

    // request the current tab list right away
    ws.send(JSON.stringify({ type: "listTabs" }));
  });

  wss.on("error", (e) => log.error("[xol] ws server error", e));
  log.info(`[xol] ws server listening on 127.0.0.1:${WS_PORT}`);
}

function handleFromExtension(msg: Record<string, unknown>): void {
  switch (msg.type) {
    case "hello":
      toRenderer("bridge:hello", msg.browser ?? {});
      break;
    case "tabs":
      toRenderer("bridge:tabs", msg.tabs ?? []);
      break;
    case "pick":
      toRenderer("pick:new", msg.pick);
      break;
    case "pickModeChanged":
      toRenderer("bridge:pickMode", msg);
      break;
    default:
      break;
  }
}

export function sendToExtension(msg: Record<string, unknown>): boolean {
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(msg));
    return true;
  }
  return false;
}

export function isConnected(): boolean {
  return !!client && client.readyState === WebSocket.OPEN;
}

function toRenderer(channel: string, payload: unknown): void {
  const win = getWin();
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
}
