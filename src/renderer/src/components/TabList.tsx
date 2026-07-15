import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { AnimatePresence, motion } from "motion/react";
import type { TabInfo } from "../types";

const Row = motion.create(Box);

function hostOf(url: string): string {
  try {
    return new URL(url).host || url;
  } catch {
    return url;
  }
}

export default function TabList({
  tabs,
  connected,
  pickingTabId,
  onPick,
  onStopPick,
  onRefresh,
}: {
  tabs: TabInfo[];
  connected: boolean;
  pickingTabId: number | null;
  onPick: (t: TabInfo) => void;
  onStopPick: (tabId: number) => void;
  onRefresh: () => void;
}) {
  return (
    <Box>
      <Stack direction="row" alignItems="center" sx={{ mb: 0.75 }}>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
          target tabs
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Typography
          variant="caption"
          onClick={onRefresh}
          sx={{ cursor: "pointer", color: "text.secondary", "&:hover": { color: "secondary.main" } }}
        >
          refresh
        </Typography>
      </Stack>

      {!connected && (
        <Box
          sx={{
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: 2,
            p: 2,
            textAlign: "center",
            color: "text.secondary",
          }}
        >
          <Typography variant="body2">no browser connected</Typography>
          <Typography variant="caption">
            load the extension in chrome (developer mode, load unpacked)
          </Typography>
        </Box>
      )}

      {connected && tabs.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ px: 0.5 }}>
          no targetable tabs - open a page or drag one into the Claude (MCP) group
        </Typography>
      )}

      <Stack spacing={0.75}>
        <AnimatePresence initial={false}>
          {tabs.map((t) => {
            const picking = pickingTabId === t.id;
            return (
              <Row
                key={t.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                sx={{
                  border: "1px solid",
                  borderColor: t.claude ? "primary.main" : "divider",
                  borderRadius: 2,
                  p: 1,
                  bgcolor: "background.paper",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  minWidth: 0,
                }}
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
                    <Typography variant="body2" noWrap sx={{ fontWeight: 600, minWidth: 0 }}>
                      {t.title || hostOf(t.url)}
                    </Typography>
                    {t.claude && <Chip size="small" color="primary" label="Claude" sx={{ height: 18 }} />}
                  </Stack>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                    {hostOf(t.url)}
                  </Typography>
                </Box>
                {picking ? (
                  <Button size="small" color="error" variant="contained" onClick={() => onStopPick(t.id)}>
                    Stop
                  </Button>
                ) : (
                  <Button size="small" variant="contained" onClick={() => onPick(t)}>
                    Pick
                  </Button>
                )}
              </Row>
            );
          })}
        </AnimatePresence>
      </Stack>
    </Box>
  );
}
