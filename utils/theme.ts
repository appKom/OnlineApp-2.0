// Auto-generated theme derived from material-theme.json (2025-11-11)
// Exports a complete set of tokens for the "light" and "dark" schemes

export type ThemeScheme = {
  // core tokens
  primary: string;
  surfaceTint?: string;
  onPrimary?: string;
  primaryContainer?: string;
  onPrimaryContainer?: string;
  secondary?: string;
  onSecondary?: string;
  secondaryContainer?: string;
  onSecondaryContainer?: string;
  tertiary?: string;
  onTertiary?: string;
  tertiaryContainer?: string;
  onTertiaryContainer?: string;
  error?: string;
  onError?: string;
  errorContainer?: string;
  onErrorContainer?: string;
  background?: string;
  onBackground?: string;
  surface?: string;
  onSurface?: string;
  surfaceVariant?: string;
  onSurfaceVariant?: string;
  outline?: string;
  outlineVariant?: string;
  shadow?: string;
  scrim?: string;
  inverseSurface?: string;
  inverseOnSurface?: string;
  inversePrimary?: string;

  // fixed / variant tokens
  primaryFixed?: string;
  onPrimaryFixed?: string;
  primaryFixedDim?: string;
  onPrimaryFixedVariant?: string;
  secondaryFixed?: string;
  onSecondaryFixed?: string;
  secondaryFixedDim?: string;
  onSecondaryFixedVariant?: string;
  tertiaryFixed?: string;
  onTertiaryFixed?: string;
  tertiaryFixedDim?: string;
  onTertiaryFixedVariant?: string;

  // surface helpers
  surfaceDim?: string;
  surfaceBright?: string;
  surfaceContainerLowest?: string;
  surfaceContainerLow?: string;
  surfaceContainer?: string;
  surfaceContainerHigh?: string;
  surfaceContainerHighest?: string;
};

export const light: ThemeScheme = {
  primary: "#206487",
  surfaceTint: "#206487",
  onPrimary: "#FFFFFF",
  primaryContainer: "#C6E7FF",
  onPrimaryContainer: "#004C6B",
  secondary: "#805611",
  onSecondary: "#FFFFFF",
  secondaryContainer: "#FFDDB4",
  onSecondaryContainer: "#633F00",
  tertiary: "#63568F",
  onTertiary: "#FFFFFF",
  tertiaryContainer: "#E7DEFF",
  onTertiaryContainer: "#4B3E76",
  error: "#BA1A1A",
  onError: "#FFFFFF",
  errorContainer: "#FFDAD6",
  onErrorContainer: "#93000A",
  background: "#F6FAFE",
  onBackground: "#181C1F",
  surface: "#F6FAFE",
  onSurface: "#181C1F",
  surfaceVariant: "#DDE3EA",
  onSurfaceVariant: "#41484D",
  outline: "#71787E",
  outlineVariant: "#C1C7CE",
  shadow: "#000000",
  scrim: "#000000",
  inverseSurface: "#2C3135",
  inverseOnSurface: "#EEF1F6",
  inversePrimary: "#91CEF5",

  primaryFixed: "#C6E7FF",
  onPrimaryFixed: "#001E2D",
  primaryFixedDim: "#91CEF5",
  onPrimaryFixedVariant: "#004C6B",
  secondaryFixed: "#FFDDB4",
  onSecondaryFixed: "#291800",
  secondaryFixedDim: "#F5BC6F",
  onSecondaryFixedVariant: "#633F00",
  tertiaryFixed: "#E7DEFF",
  onTertiaryFixed: "#1F1048",
  tertiaryFixedDim: "#CDBDFF",
  onTertiaryFixedVariant: "#4B3E76",

  surfaceDim: "#D7DADF",
  surfaceBright: "#F6FAFE",
  surfaceContainerLowest: "#FFFFFF",
  surfaceContainerLow: "#F0F4F8",
  surfaceContainer: "#EBEEF3",
  surfaceContainerHigh: "#E5E8ED",
  surfaceContainerHighest: "#DFE3E7",
};

export const dark: ThemeScheme = {
  primary: "#91CEF5",
  surfaceTint: "#91CEF5",
  onPrimary: "#00344B",
  primaryContainer: "#004C6B",
  onPrimaryContainer: "#C6E7FF",
  secondary: "#F5BC6F",
  onSecondary: "#452B00",
  secondaryContainer: "#633F00",
  onSecondaryContainer: "#FFDDB4",
  tertiary: "#CDBDFF",
  onTertiary: "#34275E",
  tertiaryContainer: "#4B3E76",
  onTertiaryContainer: "#E7DEFF",
  error: "#FFB4AB",
  onError: "#690005",
  errorContainer: "#93000A",
  onErrorContainer: "#FFDAD6",
  background: "#0F1417",
  onBackground: "#DFE3E7",
  surface: "#0F1417",
  onSurface: "#DFE3E7",
  surfaceVariant: "#41484D",
  onSurfaceVariant: "#C1C7CE",
  outline: "#8B9198",
  outlineVariant: "#41484D",
  shadow: "#000000",
  scrim: "#000000",
  inverseSurface: "#DFE3E7",
  inverseOnSurface: "#2C3135",
  inversePrimary: "#206487",

  primaryFixed: "#C6E7FF",
  onPrimaryFixed: "#001E2D",
  primaryFixedDim: "#91CEF5",
  onPrimaryFixedVariant: "#004C6B",
  secondaryFixed: "#FFDDB4",
  onSecondaryFixed: "#291800",
  secondaryFixedDim: "#F5BC6F",
  onSecondaryFixedVariant: "#633F00",
  tertiaryFixed: "#E7DEFF",
  onTertiaryFixed: "#1F1048",
  tertiaryFixedDim: "#CDBDFF",
  onTertiaryFixedVariant: "#4B3E76",

  surfaceDim: "#0F1417",
  surfaceBright: "#353A3D",
  surfaceContainerLowest: "#0A0F12",
  surfaceContainerLow: "#181C1F",
  surfaceContainer: "#1C2024",
  surfaceContainerHigh: "#262B2E",
  surfaceContainerHighest: "#313539",
};

const themes = { light, dark } as const;

export type ThemeMode = keyof typeof themes;

export function getTheme(mode: ThemeMode = "light"): ThemeScheme {
  return themes[mode];
}

export default {
  light,
  dark,
  getTheme,
};
