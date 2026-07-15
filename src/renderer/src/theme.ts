import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#6366f1" },
    secondary: { main: "#a5b4fc" },
    background: { default: "#0b0f19", paper: "#0e1424" },
    error: { main: "#dc2626" },
    warning: { main: "#f59e0b" },
    success: { main: "#22c55e" },
    divider: "#1f2937",
  },
  shape: { borderRadius: 10 },
  typography: {
    fontSize: 13,
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
  },
});
