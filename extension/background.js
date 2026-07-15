// Xol Eyes UI Bridge - service worker.
// Holds one websocket to the desktop app, enumerates tabs (incl. the Claude (MCP)
// group), injects the picker overlay on demand, and relays picks back to the app.

const WS_URL = "ws://127.0.0.1:8917";
let socket = null;
let reconnectTimer = null;
const injectedTabs = new Set();

function isOpen() {
  return socket && socket.readyState === WebSocket.OPEN;
}

function connect() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;
  try {
    socket = new WebSocket(WS_URL);
  } catch {
    scheduleReconnect();
    return;
  }
  socket.onopen = () => {
    send({ type: "hello", browser: { agent: navigator.userAgent } });
    pushTabs();
    broadcastStatus(true);
  };
  socket.onmessage = (ev) => {
    let msg;
    try {
      msg = JSON.parse(ev.data);
    } catch {
      return;
    }
    handleFromApp(msg);
  };
  socket.onclose = () => {
    socket = null;
    broadcastStatus(false);
    scheduleReconnect();
  };
  socket.onerror = () => {
    try {
      socket && socket.close();
    } catch {
      /* ignore */
    }
  };
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, 2000);
}

function send(obj) {
  if (isOpen()) {
    socket.send(JSON.stringify(obj));
    return true;
  }
  return false;
}

async function queryTabs() {
  const tabs = await chrome.tabs.query({});
  const groupIds = [...new Set(tabs.map((t) => t.groupId).filter((id) => id != null && id !== -1))];
  const groups = {};
  await Promise.all(
    groupIds.map(async (gid) => {
      try {
        groups[gid] = await chrome.tabGroups.get(gid);
      } catch {
        /* group may have closed */
      }
    })
  );
  return tabs
    .filter((t) => t.url && /^https?:/.test(t.url))
    .map((t) => ({
      id: t.id,
      title: t.title || "",
      url: t.url || "",
      windowId: t.windowId,
      groupId: t.groupId,
      groupTitle: groups[t.groupId]?.title || "",
      groupColor: groups[t.groupId]?.color || "",
      active: t.active,
    }));
}

async function pushTabs() {
  try {
    send({ type: "tabs", tabs: await queryTabs() });
  } catch {
    /* ignore */
  }
}

async function injectInto(tabId) {
  await chrome.scripting.executeScript({ target: { tabId }, files: ["content-bridge.js"], world: "ISOLATED" });
  await chrome.scripting.executeScript({ target: { tabId }, files: ["overlay.js"], world: "MAIN" });
  injectedTabs.add(tabId);
}

function broadcastStatus(connected) {
  for (const tabId of injectedTabs) {
    chrome.tabs.sendMessage(tabId, { __xol: "status", connected }).catch(() => {
      injectedTabs.delete(tabId);
    });
  }
}

async function handleFromApp(msg) {
  switch (msg.type) {
    case "listTabs":
      await pushTabs();
      break;
    case "startPick":
      try {
        await injectInto(msg.tabId);
        await chrome.tabs.sendMessage(msg.tabId, { __xol: "activate" });
      } catch {
        /* tab may be gone or unscriptable */
      }
      break;
    case "stopPick":
      try {
        await chrome.tabs.sendMessage(msg.tabId, { __xol: "deactivate" });
      } catch {
        /* ignore */
      }
      break;
    default:
      break;
  }
}

// messages from the content bridge (page side)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || !msg.__xolFrom) return;
  if (msg.__xolFrom === "ping") {
    sendResponse({ connected: isOpen() });
    return true;
  }
  if (msg.__xolFrom === "pick") {
    const pick = msg.pick || {};
    pick.tabId = sender.tab?.id;
    pick.tabTitle = sender.tab?.title;
    send({ type: "pick", pick });
  } else if (msg.__xolFrom === "pickMode") {
    send({ type: "pickModeChanged", tabId: sender.tab?.id, active: msg.active });
  }
  return undefined;
});

// keep the tab list fresh
let tabsTimer = null;
function scheduleTabsPush() {
  if (tabsTimer) clearTimeout(tabsTimer);
  tabsTimer = setTimeout(() => {
    tabsTimer = null;
    pushTabs();
  }, 400);
}
chrome.tabs.onUpdated.addListener(scheduleTabsPush);
chrome.tabs.onRemoved.addListener((tabId) => {
  injectedTabs.delete(tabId);
  scheduleTabsPush();
});
chrome.tabs.onCreated.addListener(scheduleTabsPush);
if (chrome.tabGroups?.onUpdated) chrome.tabGroups.onUpdated.addListener(scheduleTabsPush);

// MV3 service workers are ephemeral; nudge the connection alive
chrome.alarms.create("xol-keepalive", { periodInMinutes: 0.5 });
chrome.alarms.onAlarm.addListener((a) => {
  if (a.name === "xol-keepalive") connect();
});

connect();
