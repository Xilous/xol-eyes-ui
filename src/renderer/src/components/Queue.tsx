import { Box, Chip, Stack, Typography } from "@mui/material";
import { AnimatePresence, motion } from "motion/react";
import type { Pick } from "../types";

const Item = motion.create(Box);

export default function Queue({ picks, onRemove }: { picks: Pick[]; onRemove: (id: string) => void }) {
  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.75 }}>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
          queue
        </Typography>
        {picks.length > 0 && <Chip size="small" label={picks.length} sx={{ height: 18 }} />}
      </Stack>

      {picks.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ px: 0.5 }}>
          no picks yet - hit Pick on a tab, then click elements and comment
        </Typography>
      )}

      <Stack spacing={0.75}>
        <AnimatePresence initial={false}>
          {picks.map((p, i) => {
            const e = p.element || ({} as Pick["element"]);
            const label =
              `${e.tag || "?"}${e.classes?.length ? "." + e.classes[0] : ""}` +
              (p.react?.component ? " · " + p.react.component : "");
            return (
              <Item
                key={p.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  p: 1,
                  bgcolor: "background.paper",
                  overflow: "hidden",
                }}
              >
                <Stack direction="row" alignItems="baseline" spacing={1} sx={{ minWidth: 0 }}>
                  <Typography variant="caption" color="secondary.main" noWrap sx={{ fontWeight: 600, minWidth: 0, flex: 1 }}>
                    #{i + 1} {label}
                  </Typography>
                  <Typography
                    variant="caption"
                    onClick={() => onRemove(p.id)}
                    sx={{ cursor: "pointer", color: "text.secondary", "&:hover": { color: "error.main" }, flexShrink: 0 }}
                  >
                    remove
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {p.comment}
                </Typography>
                {p.react?.source && (
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", mt: 0.25 }}>
                    {p.react.source.file}:{p.react.source.line}
                  </Typography>
                )}
              </Item>
            );
          })}
        </AnimatePresence>
      </Stack>
    </Box>
  );
}
