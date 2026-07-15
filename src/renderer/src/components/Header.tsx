import { Box, Stack, Typography } from "@mui/material";
import { motion } from "motion/react";

const Dot = motion.create(Box);

export default function Header({ version, connected }: { version?: string; connected: boolean }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      sx={{ px: 1.5, py: 1.25, borderBottom: "1px solid", borderColor: "divider" }}
    >
      <Box
        sx={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          bgcolor: "primary.main",
          fontSize: 15,
          lineHeight: 1,
        }}
      >
        {"◎"}
      </Box>
      <Typography sx={{ fontWeight: 700, letterSpacing: 0.2 }}>Xol Eyes UI</Typography>
      {version && (
        <Typography variant="caption" color="text.secondary">
          v{version}
        </Typography>
      )}
      <Box sx={{ flex: 1 }} />
      <Stack direction="row" alignItems="center" spacing={0.75}>
        <Dot
          animate={{
            backgroundColor: connected ? "#22c55e" : "#64748b",
            scale: connected ? [1, 1.25, 1] : 1,
          }}
          transition={{ duration: 1.4, repeat: connected ? Infinity : 0, ease: "easeInOut" }}
          sx={{ width: 9, height: 9, borderRadius: "50%" }}
        />
        <Typography variant="caption" color="text.secondary">
          {connected ? "browser connected" : "no browser"}
        </Typography>
      </Stack>
    </Stack>
  );
}
