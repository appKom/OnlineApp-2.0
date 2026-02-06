// Auto-generated theme derived from material-theme.json (2025-11-11)
// Exports a complete set of tokens for the "light" and "dark" schemes
import React, { createContext, useContext, useMemo, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';

export type ThemeScheme = {
  // core tokens
  primary: string;
  surfaceTint: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  shadow: string;
  scrim: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;

  // fixed / variant tokens
  primaryFixed: string;
  onPrimaryFixed: string;
  primaryFixedDim: string;
  onPrimaryFixedVariant: string;
  secondaryFixed: string;
  onSecondaryFixed: string;
  secondaryFixedDim: string;
  onSecondaryFixedVariant: string;
  tertiaryFixed: string;
  onTertiaryFixed: string;
  tertiaryFixedDim: string;
  onTertiaryFixedVariant: string;

  // surface helpers
  surfaceDim: string;
  surfaceBright: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;

  attending: string;
  onAttending: string;
  waitlist: string;
  onWaitlist: string;
  registerButton: string;
  onRegisterButton: string;
  deregisterButton: string;
  onDeregisterButton: string;
  registerForWaitlist: string;
  onRegisterForWaitlist: string;

  socialBadge: string;
  academicBadbe: string;
  companyBadge: string;
  generalAssemblyBadge: string;
  internalBadge: string;
  otherBadge: string;
  welcomeBadge: string;
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

  attending: "#b9f8cf",
  onAttending: "#00351a",
  waitlist: "#fff085",
  onWaitlist: "#3d3000",
  registerButton: "#7bf1a8",
  onRegisterButton: "#00391f",
  deregisterButton: "#ffa2a2",
  onDeregisterButton: "#4a0a0a",
  registerForWaitlist: "#fff085",
  onRegisterForWaitlist: "#3d3000",

  socialBadge: "#b9f8cf",
  academicBadbe: "#bedbff",
  companyBadge: "#ffc9c9",
  generalAssemblyBadge: "#fee685",
  internalBadge: "#fee685",
  otherBadge: "#fee685",
  welcomeBadge: "#fee685",
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

  attending: "#016630",
  onAttending: "#b9f8cf",
  waitlist: "#312c85",
  onWaitlist: "#e0ddff",
  registerButton: "#0d542b",
  onRegisterButton: "#b9f8cf",
  deregisterButton: "#82181a",
  onDeregisterButton: "#ffd9d6",
  registerForWaitlist: "#894b00",
  onRegisterForWaitlist: "#ffe7b0",

  socialBadge: "#032e15",
  academicBadbe: "#162556",
  companyBadge: "#460809",
  generalAssemblyBadge: "#461901",
  internalBadge: "#461901",
  otherBadge: "#461901",
  welcomeBadge: "#461901",
};

const themes = { light, dark } as const;

export type ThemeMode = keyof typeof themes;

export function getTheme(mode: ThemeMode = "light"): ThemeScheme {
  return themes[mode];
}

// Theme context and provider
// Provides the resolved theme and mode to React components. Components should
// call `useTheme()` to obtain the current token set; components will re-render
// when the provider's resolved mode changes (system change or explicit override).

type ThemeContextValue = {
  mode: ThemeMode;
  theme: ThemeScheme;
  // set to 'light'|'dark' to force a theme or 'system' to follow Appearance
  setMode: (m: ThemeMode | 'system') => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export type ThemeProviderProps = {
  children?: React.ReactNode;
  // initialMode: 'light' | 'dark' | 'system' (defaults to 'system')
  initialMode?: ThemeMode | 'system';
};

export function ThemeProvider({ children, initialMode = 'system' }: ThemeProviderProps) {
  const system = useColorScheme();
  const [overrideMode, setOverrideMode] = useState<ThemeMode | 'system'>(initialMode);

  const resolvedMode: ThemeMode = overrideMode === 'system'
    ? (system === 'dark' ? 'dark' : 'light')
    : overrideMode;

  const theme = useMemo(() => getTheme(resolvedMode), [resolvedMode]);

  const value = useMemo<ThemeContextValue>(() => ({
    mode: resolvedMode,
    theme,
    setMode: (m: ThemeMode | 'system') => setOverrideMode(m),
  }), [resolvedMode, theme]);

  return React.createElement(ThemeContext.Provider, { value }, children);
}

// Hook: returns the ThemeScheme for the currently resolved theme.
// Preferred usage: call inside React components that are rendered under
// <ThemeProvider />. Components will update automatically when the provider
// resolves a different mode.
export function useTheme(): ThemeScheme {
  const ctx = useContext(ThemeContext);
  if (ctx) return ctx.theme;
  // fallback for callers outside the provider: resolve from system color scheme
  const cs = useColorScheme() as ThemeMode | null;
  const mode: ThemeMode = cs === 'dark' ? 'dark' : 'light';
  return getTheme(mode);
}

// Helper: returns the resolved mode and a setter to override it. When called
// outside a provider this returns the current system mode and a no-op setter.
export function useThemeMode(): { mode: ThemeMode; setMode: (m: ThemeMode | 'system') => void } {
  const ctx = useContext(ThemeContext);
  if (ctx) return { mode: ctx.mode, setMode: ctx.setMode };
  const cs = useColorScheme() as ThemeMode | null;
  const mode: ThemeMode = cs === 'dark' ? 'dark' : 'light';
  return { mode, setMode: () => {} };
}

// Return the current mode ('light' | 'dark') based on the system appearance.
// This is a synchronous helper you can call from non-component code.
export function getCurrentTheme(): ThemeMode {
  const cs = Appearance.getColorScheme();
  return cs === 'dark' ? 'dark' : 'light';
}

// Color utility helpers
// Apply alpha transparency to a hex color
export function withAlpha(hex: string, alpha: number): string {
  return `${hex}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
}

// Blend two hex colors to an opaque result.
// Equivalent to drawing `foreground` with opacity `foregroundAlpha` on top of `background`.
// This avoids Android/iOS shadow compositing artifacts that can appear with semi-transparent
// backgrounds combined with elevation/shadows.
export function blendColors(foreground: string, background: string, foregroundAlpha: number): string {
  const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
  const a = clamp01(foregroundAlpha);

  const norm = (hex: string) => (hex.length >= 7 ? hex.slice(0, 7) : hex);
  const fg = norm(foreground);
  const bg = norm(background);

  const toRgb = (hex: string) => {
    const num = parseInt(hex.slice(1), 16);
    return {
      r: (num >> 16) & 0xff,
      g: (num >> 8) & 0xff,
      b: num & 0xff,
    };
  };

  const f = toRgb(fg);
  const b = toRgb(bg);

  const r = Math.round(f.r * a + b.r * (1 - a));
  const g = Math.round(f.g * a + b.g * (1 - a));
  const bl = Math.round(f.b * a + b.b * (1 - a));

  return `#${(0x1000000 + r * 0x10000 + g * 0x100 + bl).toString(16).slice(1)}`;
}

// Elevate a color: darken in light mode, lighten in dark mode
export function elevate(hex: string, factor: number): string {
  const mode = getCurrentTheme();
  const num = parseInt(hex.slice(1), 16);
  
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;

  if (mode === 'light') {
    // Darken: reduce RGB values
    r = Math.max(0, r - factor);
    g = Math.max(0, g - factor);
    b = Math.max(0, b - factor);
  } else {
    // Lighten: increase RGB values
    r = Math.min(255, r + factor);
    g = Math.min(255, g + factor);
    b = Math.min(255, b + factor);
  }

  return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`;
}
