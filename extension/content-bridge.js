// Content bridge - runs in the ISOLATED world. Relays messages between the
// overlay (MAIN world, no chrome.* access) and the background service worker.
(() => {
  if (window.__xolBridgeLoaded) return;
  window.__xolBridgeLoaded = true;

  // overlay (MAIN world) -> background
  window.addEventListener("message", (ev) => {
    if (ev.source !== window) return;
    const d = ev.data;
    if (!d || typeof d !== "object" || d.__xolOverlay == null) return;
    if (d.__xolOverlay === "pick") {
      chrome.runtime.sendMessage({ __xolFrom: "pick", pick: d.pick });
    } else if (d.__xolOverlay === "pickMode") {
      chrome.runtime.sendMessage({ __xolFrom: "pickMode", active: d.active });
    }
  });

  // background -> overlay
  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg || msg.__xol == null) return;
    if (msg.__xol === "status") {
      window.postMessage({ __xolBridge: "status", connected: !!msg.connected }, "*");
    } else {
      window.postMessage({ __xolBridge: msg.__xol }, "*");
    }
  });

  // on load, ask the app whether it's connected so the overlay can show status
  try {
    chrome.runtime.sendMessage({ __xolFrom: "ping" }, (resp) => {
      if (chrome.runtime.lastError) return;
      window.postMessage({ __xolBridge: "status", connected: !!resp?.connected }, "*");
    });
  } catch {
    /* ignore */
  }
})();
