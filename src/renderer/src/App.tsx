import { useCallback, useEffect, useState } from "react";
import { Box, Button, Snackbar, Stack, Typography } from "@mui/material";
import type { AppInfo, Pick, TabInfo } from "./types";
import Header from "./components/Header";
import TabList from "./components/TabList";
import Queue from "./components/Queue";
import UpdateBanner from "./components/UpdateBanner";

function annotate(tabs: TabInfo[]): TabInfo[] {
  return tabs.map((t) => ({
    ...t,
    claude: /claude/i.test(t.groupTitle || ""),
  }));
}

export default function App() {
  const [info, setInfo] = useState<AppInfo | null>(null);
  const [connected, setConnected] = useState(false);
  const [tabs, setTabs] = useState<TabInfo[]>([]);
  const [queue, setQueue] = useState<Pick[]>([]);
  const [pickingTabId, setPickingTabId] = useState<number | null>(null);
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [toast, setToast] = useState<string>("");

  useEffect(() => {
    window.xol.info().then((i) => {
      setInfo(i);
      setConnected(i.connected);
    });
    const unsubs = [
      window.xol.on("bridge:status", (p: { connected: boolean }) => setConnected(!!p?.connected)),
      window.xol.on("bridge:tabs", (t: TabInfo[]) => setTabs(annotate(t || []))),
      window.xol.on("pick:new", (pk: Pick) => {
        if (pk) setQueue((q) => [...q, pk]);
      }),
      window.xol.on("bridge:pickMode", (m: { tabId: number; active: boolean }) =>
        setPickingTabId(m?.active ? m.tabId : null)
      ),
      window.xol.on("update:ready", (v: string) => setUpdateVersion(v)),
    ];
    window.xol.listTabs();
    return () => unsubs.forEach((u) => u && u());
  }, []);

  const refresh = useCallback(() => window.xol.listTabs(), []);
  const pick = useCallback((tab: TabInfo) => {
    window.xol.startPick(tab.id);
    setPickingTabId(tab.id);
    setToast(`picking on "${tab.title || tab.url}"`);
  }, []);
  const stopPick = useCallback((tabId: number) => {
    window.xol.stopPick(tabId);
    setPickingTabId(null);
  }, []);

  const removePick = useCallback((id: string) => setQueue((q) => q.filter((p) => p.id !== id)), []);
  const clearQueue = useCallback(() => setQueue([]), []);

  const submit = useCallback(async () => {
    if (!queue.length) return;
    const n = await window.xol.submitPicks(queue);
    setQueue([]);
    setToast(`sent ${n} to inbox - run /pick in Claude Code`);
  }, [queue]);

  const copyAll = useCallback(async () => {
    if (!queue.length) return;
    await window.xol.copyPicks(queue);
    setToast(`copied ${queue.length} pick(s) - paste into Claude`);
  }, [queue]);

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        color: "text.primary",
        bgcolor: "background.default",
      }}
    >
      <Header version={info?.version} connected={connected} />
      <UpdateBanner version={updateVersion} onRestart={() => window.xol.restartToUpdate()} />

      <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden", px: 1.5, py: 1.5, minHeight: 0 }}>
        <TabList
          tabs={tabs}
          connected={connected}
          pickingTabId={pickingTabId}
          onPick={pick}
          onStopPick={stopPick}
          onRefresh={refresh}
        />
        <Box sx={{ height: 14 }} />
        <Queue picks={queue} onRemove={removePick} />
      </Box>

      <Stack
        direction="row"
        spacing={1}
        sx={{ p: 1.5, borderTop: "1px solid", borderColor: "divider", alignItems: "center" }}
      >
        <Button variant="contained" onClick={submit} disabled={!queue.length} sx={{ flex: 1 }}>
          Send to Claude
        </Button>
        <Button variant="outlined" onClick={copyAll} disabled={!queue.length} sx={{ flex: 1 }}>
          Copy all
        </Button>
        <Button
          variant="text"
          color="inherit"
          onClick={clearQueue}
          disabled={!queue.length}
          sx={{ color: "text.secondary", minWidth: 0 }}
        >
          Clear
        </Button>
      </Stack>

      <Box sx={{ px: 1.5, pb: 1, display: "flex", justifyContent: "space-between" }}>
        <Typography variant="caption" color="text.secondary" noWrap>
          {info?.inbox ? "inbox: " + info.inbox.replace(/\\/g, "/") : ""}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ cursor: "pointer", "&:hover": { color: "secondary.main" }, flexShrink: 0, ml: 1 }}
          onClick={() => window.xol.revealInbox()}
        >
          reveal
        </Typography>
      </Box>

      <Snackbar
        open={!!toast}
        message={toast}
        autoHideDuration={2800}
        onClose={() => setToast("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
}
