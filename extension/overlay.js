// Xol Eyes UI overlay - injected into the page's MAIN world (so it can read the
// React fiber). Element picker with per-element comments. Each saved pick is
// streamed to the desktop app via the content bridge; a local queue + "copy all"
// is the offline fallback when the app isn't running.
(() => {
  if (window.__xolOverlayLoaded) return;
  window.__xolOverlayLoaded = true;

  const STORE_KEY = "xol-eyes:queue";
  const state = {
    pickMode: false,
    pinned: false,
    pickedEl: null,
    draft: null,
    connected: false,
    queue: loadQueue(),
  };

  function loadQueue() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
    } catch {
      return [];
    }
  }
  function persist() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state.queue));
    } catch {
      /* ignore */
    }
  }

  function toBridge(msg) {
    window.postMessage({ __xolOverlay: msg.type, ...msg }, "*");
  }

  const CSS_TEXT = `
    :host, * { box-sizing: border-box; }
    button { font-family: inherit; }
    [hidden] { display: none !important; }
    .hl { position: fixed; border: 2px solid #6366f1; background: rgba(99,102,241,.12);
      border-radius: 3px; pointer-events: none; z-index: 1; }
    .pill { position: fixed; top: 14px; left: 50%; transform: translateX(-50%);
      background: #111827; color: #e5e7eb; font: 600 12px/1 ui-sans-serif,system-ui,sans-serif;
      padding: 9px 14px; border-radius: 999px; pointer-events: none;
      box-shadow: 0 4px 16px rgba(0,0,0,.35); z-index: 5; }
    .fab { position: fixed; right: 18px; bottom: 18px; width: 46px; height: 46px;
      border-radius: 50%; border: none; background: #4f46e5; color: #fff; font-size: 21px;
      cursor: pointer; pointer-events: auto; display: grid; place-items: center;
      box-shadow: 0 6px 20px rgba(79,70,229,.45); }
    .fab.active { background: #dc2626; box-shadow: 0 6px 20px rgba(220,38,38,.5); }
    .fab .badge { position: absolute; top: -3px; right: -3px; min-width: 18px; height: 18px;
      padding: 0 5px; border-radius: 9px; background: #f59e0b; color: #111;
      font: 700 11px/18px ui-sans-serif,system-ui,sans-serif; text-align: center; }
    .panel { position: fixed; right: 18px; bottom: 74px; width: 312px; max-height: 66vh;
      background: #0b0f19; color: #e5e7eb; border: 1px solid #1f2937; border-radius: 12px;
      pointer-events: auto; display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 14px 44px rgba(0,0,0,.55); font: 13px/1.45 ui-sans-serif,system-ui,sans-serif; }
    .panel header { display: flex; align-items: center; justify-content: space-between;
      padding: 12px 14px; border-bottom: 1px solid #1f2937; }
    .panel .ttl { font-weight: 700; letter-spacing: .2px; }
    .status { display: flex; align-items: center; gap: 6px; padding: 8px 14px; font-size: 12px;
      color: #94a3b8; border-bottom: 1px solid #1f2937; }
    .status .dot { width: 8px; height: 8px; border-radius: 50%; background: #64748b; }
    .status.on .dot { background: #22c55e; }
    .pickbtn { margin: 12px 14px 6px; padding: 10px; border: 1px solid #4f46e5; background: #4f46e5;
      color: #fff; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .pickbtn.active { background: #dc2626; border-color: #dc2626; }
    .list { overflow: auto; padding: 6px 14px; flex: 1; min-height: 30px; }
    .item { padding: 9px 10px; border: 1px solid #1f2937; border-radius: 8px; margin-bottom: 8px;
      background: #0e1424; }
    .item .h { display: flex; justify-content: space-between; gap: 8px; align-items: baseline; }
    .item .tag { color: #a5b4fc; font-weight: 600; font-size: 12px; word-break: break-all; }
    .item .cmt { color: #cbd5e1; margin-top: 5px; white-space: pre-wrap; word-break: break-word; }
    .item .rm { background: transparent; border: none; color: #64748b; cursor: pointer;
      font-size: 11px; flex: 0 0 auto; }
    .item .rm:hover { color: #f87171; }
    .empty { color: #64748b; text-align: center; padding: 18px 0; }
    .panel footer { display: flex; gap: 8px; padding: 12px 14px; border-top: 1px solid #1f2937; }
    .panel footer button { flex: 1; padding: 8px; border-radius: 8px; border: 1px solid #334155;
      background: #1e293b; color: #e5e7eb; cursor: pointer; font-weight: 600; }
    .panel footer button:hover { background: #273449; }
    .x { border: none; background: transparent; color: #94a3b8; cursor: pointer; font-size: 14px; }
    .pop { position: fixed; width: 304px; background: #0b0f19; color: #e5e7eb;
      border: 1px solid #334155; border-radius: 10px; pointer-events: auto; padding: 12px;
      box-shadow: 0 14px 44px rgba(0,0,0,.55); z-index: 3;
      font: 13px/1.45 ui-sans-serif,system-ui,sans-serif; }
    .pop .meta { font-size: 12px; color: #a5b4fc; margin-bottom: 8px; word-break: break-all; }
    .pop textarea { width: 100%; height: 76px; resize: vertical; background: #111827;
      color: #e5e7eb; border: 1px solid #334155; border-radius: 8px; padding: 8px;
      font: 13px/1.45 ui-sans-serif,system-ui,sans-serif; outline: none; }
    .pop textarea:focus { border-color: #6366f1; }
    .pop .row { display: flex; gap: 8px; margin-top: 9px; }
    .pop .row button { flex: 1; padding: 9px; border-radius: 8px; border: none; background: #4f46e5;
      color: #fff; font-weight: 600; cursor: pointer; }
    .pop .row .ghost { background: transparent; border: 1px solid #334155; color: #94a3b8; }
    .toast { position: fixed; bottom: 74px; left: 50%; transform: translateX(-50%);
      background: #111827; color: #e5e7eb; padding: 10px 15px; border-radius: 8px;
      font: 13px/1 ui-sans-serif,system-ui,sans-serif; pointer-events: none;
      box-shadow: 0 6px 20px rgba(0,0,0,.45); z-index: 6; max-width: 80vw; }
    .toast.err { background: #7f1d1d; color: #fecaca; }
  `;

  const host = document.createElement("div");
  host.id = "xol-eyes-root";
  Object.assign(host.style, { position: "fixed", inset: "0", zIndex: "2147483647", pointerEvents: "none" });
  const root = host.attachShadow({ mode: "open" });
  (document.documentElement || document.body).appendChild(host);

  root.innerHTML = `
    <style>${CSS_TEXT}</style>
    <div class="hl" hidden></div>
    <div class="pill" hidden>picking - click an element, Esc to stop</div>
    <button class="fab" title="Xol Eyes UI (Alt+Shift+P)"><span>&#9678;</span><b class="badge" hidden>0</b></button>
    <section class="panel" hidden>
      <header><span class="ttl">Xol Eyes UI</span><button class="x" data-act="close">&#10005;</button></header>
      <div class="status"><span class="dot"></span><span class="stxt">app not connected</span></div>
      <button class="pickbtn" data-act="toggle">Pick element</button>
      <div class="list"></div>
      <footer>
        <button data-act="copy">Copy all</button>
        <button data-act="clear">Clear</button>
      </footer>
    </section>
    <div class="pop" hidden>
      <div class="meta"></div>
      <textarea placeholder="what should change here?"></textarea>
      <div class="row">
        <button data-act="save">Add pick</button>
        <button data-act="cancel" class="ghost">Cancel</button>
      </div>
    </div>
    <div class="toast" hidden></div>
  `;

  const hl = root.querySelector(".hl");
  const pill = root.querySelector(".pill");
  const fab = root.querySelector(".fab");
  const badge = root.querySelector(".badge");
  const panel = root.querySelector(".panel");
  const statusEl = root.querySelector(".status");
  const statusTxt = root.querySelector(".stxt");
  const listEl = root.querySelector(".list");
  const pickBtn = root.querySelector(".pickbtn");
  const pop = root.querySelector(".pop");
  const popMeta = root.querySelector(".pop .meta");
  const popTa = root.querySelector(".pop textarea");
  const toastEl = root.querySelector(".toast");

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
    );
  }
  function updateBadge() {
    badge.textContent = String(state.queue.length);
    badge.hidden = state.queue.length === 0;
  }
  function toast(msg, err = false) {
    toastEl.textContent = msg;
    toastEl.classList.toggle("err", !!err);
    toastEl.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => (toastEl.hidden = true), 2600);
  }
  function setConnected(on) {
    state.connected = !!on;
    statusEl.classList.toggle("on", state.connected);
    statusTxt.textContent = state.connected ? "connected to Xol Eyes" : "app not connected (offline)";
  }

  function setPickMode(on) {
    state.pickMode = on;
    fab.classList.toggle("active", on);
    pickBtn.classList.toggle("active", on);
    pickBtn.textContent = on ? "Stop picking" : "Pick element";
    pill.hidden = !on;
    if (document.body) document.body.style.cursor = on ? "crosshair" : "";
    if (on) {
      panel.hidden = true;
      hidePopover();
    } else {
      hl.hidden = true;
    }
    toBridge({ type: "pickMode", active: on });
  }

  function positionHL(el) {
    const r = el.getBoundingClientRect();
    Object.assign(hl.style, { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" });
    hl.hidden = false;
  }
  function onMove(e) {
    if (!state.pickMode || state.pinned) return;
    const el = e.target;
    if (!el || el === host || el.nodeType !== 1) return;
    positionHL(el);
  }
  function onClick(e) {
    if (!state.pickMode) return;
    const el = e.target;
    if (el === host) return;
    e.preventDefault();
    e.stopPropagation();
    if (state.pinned) return;
    state.pinned = true;
    state.pickedEl = el;
    positionHL(el);
    showPopover(el);
  }

  function pickAttrs(el) {
    const out = {};
    for (const a of ["name", "type", "role", "placeholder", "title", "href", "value", "aria-label", "data-testid"]) {
      const v = el.getAttribute && el.getAttribute(a);
      if (v) out[a] = v.slice(0, 80);
    }
    return out;
  }
  function cssEsc(s) {
    return window.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }
  function cssPath(el) {
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && parts.length < 6) {
      if (node.id) {
        parts.unshift("#" + cssEsc(node.id));
        break;
      }
      let sel = node.nodeName.toLowerCase();
      const cls = [...node.classList].filter((c) => !c.startsWith("xol-eyes")).slice(0, 2);
      if (cls.length) sel += "." + cls.map(cssEsc).join(".");
      const parent = node.parentElement;
      if (parent) {
        const same = [...parent.children].filter((c) => c.nodeName === node.nodeName);
        if (same.length > 1) sel += `:nth-of-type(${same.indexOf(node) + 1})`;
      }
      parts.unshift(sel);
      node = node.parentElement;
    }
    return parts.join(" > ");
  }
  function fiberOf(el) {
    const k = Object.keys(el).find((k) => k.startsWith("__reactFiber$") || k.startsWith("__reactInternalInstance$"));
    return k ? el[k] : null;
  }
  function normFile(p) {
    const s = String(p).replace(/\\/g, "/");
    const m = s.match(/(?:^|\/)((?:src|app|components|pages|modules)\/.*)$/);
    return m ? m[1] : s.split("/").slice(-3).join("/");
  }
  function reactInfo(el) {
    try {
      let f = fiberOf(el);
      const names = [];
      let source = null;
      let hops = 0;
      while (f && hops < 80) {
        const t = f.type || f.elementType;
        let n = null;
        if (typeof t === "function") n = t.displayName || t.name;
        else if (t && typeof t === "object") n = t.displayName || (t.render && t.render.name);
        if (n && n !== "Unknown" && !names.includes(n)) names.push(n);
        if (!source && f._debugSource && f._debugSource.fileName) {
          source = { file: normFile(f._debugSource.fileName), line: f._debugSource.lineNumber };
        }
        f = f.return;
        hops++;
      }
      if (!names.length && !source) return null;
      return { component: names[0] || null, breadcrumb: names.slice(0, 5).reverse(), source };
    } catch {
      return null;
    }
  }
  function capture(el) {
    const r = el.getBoundingClientRect();
    return {
      id: "p" + Date.now().toString(36) + Math.floor(performance.now()).toString(36),
      ts: new Date().toISOString(),
      url: location.href,
      origin: location.origin,
      pathname: location.pathname + location.search,
      title: document.title,
      element: {
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        classes: [...el.classList].filter((c) => !c.startsWith("xol-eyes")),
        text: (el.innerText || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 140),
        attrs: pickAttrs(el),
        selector: cssPath(el),
        rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      },
      react: reactInfo(el),
      comment: "",
    };
  }

  function showPopover(el) {
    const info = capture(el);
    state.draft = info;
    const e = info.element;
    popMeta.textContent = `${e.tag}${e.id ? "#" + e.id : ""}` + (e.text ? `  "${e.text.slice(0, 44)}"` : "");
    popTa.value = "";
    const r = el.getBoundingClientRect();
    const left = Math.max(8, Math.min(r.left, window.innerWidth - 314));
    let top = r.bottom + 8;
    if (top + 190 > window.innerHeight) top = Math.max(8, r.top - 190);
    Object.assign(pop.style, { left: left + "px", top: top + "px" });
    pop.hidden = false;
    setTimeout(() => popTa.focus(), 0);
  }
  function hidePopover() {
    pop.hidden = true;
    state.pinned = false;
    state.draft = null;
  }
  function saveComment() {
    const txt = popTa.value.trim();
    if (!txt) {
      popTa.focus();
      return;
    }
    state.draft.comment = txt;
    state.queue.push(state.draft);
    persist();
    renderList();
    updateBadge();
    toBridge({ type: "pick", pick: state.draft });
    hidePopover();
    hl.hidden = true;
    toast(state.connected ? "sent to Xol Eyes" : "added (offline - use Copy all)");
  }

  function renderList() {
    if (!state.queue.length) {
      listEl.innerHTML = '<div class="empty">no picks yet</div>';
      return;
    }
    listEl.innerHTML = state.queue
      .map(
        (p, i) => `
      <div class="item">
        <div class="h">
          <span class="tag">#${i + 1} ${esc(p.element.tag)}${p.element.classes.length ? "." + esc(p.element.classes[0]) : ""}${
          p.react && p.react.component ? " &middot; " + esc(p.react.component) : ""
        }</span>
          <button class="rm" data-act="rm" data-id="${esc(p.id)}">remove</button>
        </div>
        <div class="cmt">${esc(p.comment)}</div>
      </div>`
      )
      .join("");
  }

  function formatBatch(q) {
    const lines = [`[xol-eyes] ${q.length} pick(s) from ${location.origin}`, ""];
    q.forEach((p, i) => {
      const e = p.element;
      lines.push(
        `#${i + 1}  ${e.tag}${e.id ? "#" + e.id : ""}${e.classes.length ? "." + e.classes.slice(0, 2).join(".") : ""}${
          e.text ? `  "${e.text}"` : ""
        }`
      );
      lines.push(`    route      ${p.pathname}`);
      if (p.react?.component)
        lines.push(
          `    component  ${p.react.component}${p.react.breadcrumb?.length ? "  (" + p.react.breadcrumb.join(" > ") + ")" : ""}`
        );
      if (p.react?.source) lines.push(`    source     ${p.react.source.file}:${p.react.source.line}`);
      lines.push(`    selector   ${e.selector}`);
      lines.push(`    comment    ${p.comment}`);
      lines.push("");
    });
    return lines.join("\n");
  }
  async function copyAll() {
    if (!state.queue.length) return toast("queue is empty");
    const text = formatBatch(state.queue);
    try {
      await navigator.clipboard.writeText(text);
      toast(`copied ${state.queue.length} pick(s)`);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        toast(`copied ${state.queue.length} pick(s)`);
      } catch {
        toast("copy failed - see console");
        console.log(text);
      }
      ta.remove();
    }
  }

  fab.addEventListener("click", () => {
    panel.hidden = !panel.hidden;
    if (!panel.hidden) renderList();
  });
  root.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest("[data-act]");
    if (!b) return;
    const act = b.dataset.act;
    if (act === "close") panel.hidden = true;
    else if (act === "toggle") setPickMode(!state.pickMode);
    else if (act === "copy") copyAll();
    else if (act === "clear") {
      state.queue = [];
      persist();
      renderList();
      updateBadge();
      toast("queue cleared");
    } else if (act === "save") saveComment();
    else if (act === "cancel") {
      hidePopover();
      hl.hidden = true;
    } else if (act === "rm") {
      state.queue = state.queue.filter((p) => p.id !== b.dataset.id);
      persist();
      renderList();
      updateBadge();
    }
  });

  document.addEventListener("mousemove", onMove, true);
  document.addEventListener("click", onClick, true);
  document.addEventListener(
    "keydown",
    (e) => {
      if (e.altKey && e.shiftKey && e.code === "KeyP") {
        e.preventDefault();
        setPickMode(!state.pickMode);
      } else if (e.key === "Escape") {
        if (!pop.hidden) {
          hidePopover();
          hl.hidden = true;
        } else if (state.pickMode) {
          setPickMode(false);
        }
      }
    },
    true
  );
  const reposition = () => {
    if (state.pinned && state.pickedEl) positionHL(state.pickedEl);
  };
  window.addEventListener("scroll", reposition, true);
  window.addEventListener("resize", reposition);

  // messages from the content bridge
  window.addEventListener("message", (ev) => {
    if (ev.source !== window) return;
    const d = ev.data;
    if (!d || typeof d !== "object" || d.__xolBridge == null) return;
    if (d.__xolBridge === "status") setConnected(d.connected);
    else if (d.__xolBridge === "activate") setPickMode(true);
    else if (d.__xolBridge === "deactivate") setPickMode(false);
  });

  renderList();
  updateBadge();
  setConnected(false);
  console.log("[xol-eyes] overlay ready - Alt+Shift+P to pick. queued:", state.queue.length);
})();
