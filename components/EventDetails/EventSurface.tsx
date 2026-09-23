import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { useTheme, useThemeMode } from "../../utils/theme";

export function useEventChromeColors() {
  const theme = useTheme();
  const { mode } = useThemeMode();

  return {
    surface: mode === "dark" ? "#202328" : theme.surfaceContainerLow,
    raised: mode === "dark" ? "#2B323B" : theme.surfaceContainerHigh,
    recessed: mode === "dark" ? "#12161A" : theme.surfaceContainerLowest,
    edge: mode === "dark" ? "#14161B" : theme.surfaceDim,
    highlight: mode === "dark" ? "#272A2F" : theme.surfaceContainerLowest,
    icon: mode === "dark" ? "#F2F4F6" : theme.onSurface,
    shadowOpacity: mode === "dark" ? 0.36 : 0.12,
  };
}

export function EventSurface({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const chrome = useEventChromeColors();

  return (
    <View
      style={[
        styles.surface,
        {
          backgroundColor: chrome.surface,
          borderColor: chrome.edge,
          borderTopColor: chrome.highlight,
          shadowColor: theme.shadow,
          shadowOpacity: chrome.shadowOpacity,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function EventInsetDivider({ style }: { style?: StyleProp<ViewStyle> }) {
  const chrome = useEventChromeColors();

  return (
    <View style={[styles.divider, style]}>
      <View style={[styles.dividerLine, { backgroundColor: chrome.edge }]} />
      <View
        style={[styles.dividerLine, { backgroundColor: chrome.highlight }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    borderWidth: 1,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 5,
  },
  divider: {
    height: 2,
  },
  dividerLine: {
    height: 1,
  },
});
