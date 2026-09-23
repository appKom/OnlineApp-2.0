import { useTheme, useThemeMode } from "../utils/theme";

export function usePanelChromeColors() {
  const theme = useTheme();
  const { mode } = useThemeMode();

  return {
    surface: mode === "dark" ? "#202328" : theme.surfaceContainerLow,
    raised: mode === "dark" ? "#2B323B" : theme.surfaceContainerHigh,
    recessed: mode === "dark" ? "#12161A" : theme.surfaceContainerLowest,
    edge: mode === "dark" ? "#14161B" : theme.surfaceDim,
    highlight: mode === "dark" ? "#272A2F" : theme.surfaceContainerLowest,
    listEdge: mode === "dark" ? "#080C0E" : theme.outlineVariant,
    listHighlight: mode === "dark" ? "#1C2024" : theme.surfaceContainerLowest,
    icon: mode === "dark" ? "#F2F4F6" : theme.onSurface,
    shadowOpacity: mode === "dark" ? 0.36 : 0.12,
  };
}
