import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { useTheme } from "../../utils/theme";
import { usePanelChromeColors } from "../PanelChrome";

export const useEventChromeColors = usePanelChromeColors;

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

export function EventInsetDivider({
  style,
  onBackground = false,
}: {
  style?: StyleProp<ViewStyle>;
  onBackground?: boolean;
}) {
  const chrome = useEventChromeColors();

  return (
    <View style={[styles.divider, style]}>
      <View style={[styles.dividerLine, { backgroundColor: onBackground ? chrome.listEdge : chrome.edge }]} />
      <View
        style={[styles.dividerLine, { backgroundColor: onBackground ? chrome.listHighlight : chrome.highlight }]}
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
