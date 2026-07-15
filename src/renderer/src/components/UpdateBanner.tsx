import { Box, Button, Typography } from "@mui/material";
import { AnimatePresence, motion } from "motion/react";

export default function UpdateBanner({
  version,
  onRestart,
}: {
  version: string | null;
  onRestart: () => void;
}) {
  return (
    <AnimatePresence initial={false}>
      {version && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          style={{ overflow: "hidden" }}
        >
          <Box
            sx={{
              px: 1.5,
              py: 1,
              display: "flex",
              alignItems: "center",
              gap: 1,
              bgcolor: "primary.main",
              color: "#fff",
            }}
          >
            <Typography variant="body2" sx={{ flex: 1 }}>
              Version {version} is ready.
            </Typography>
            <Button
              size="small"
              onClick={onRestart}
              sx={{
                bgcolor: "rgba(255,255,255,0.16)",
                color: "#fff",
                "&:hover": { bgcolor: "rgba(255,255,255,0.28)" },
              }}
            >
              Restart now to update
            </Button>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
