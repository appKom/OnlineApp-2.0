import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { dismissToast, useToast } from "../utils/toast";
import { useTheme } from "../utils/theme";
import { usePanelChromeColors } from "./Panel";

// Clears the floating native tab bar.
const TAB_BAR_CLEARANCE = 64;

export function ToastHost() {
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const chrome = usePanelChromeColors();

  return (
    <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, styles.host]}>
      {toast && (
        <Animated.View
          key={toast.id}
          entering={FadeInDown.duration(200)}
          exiting={FadeOutDown.duration(160)}
          accessibilityLiveRegion="polite"
          style={[
            styles.toast,
            {
              marginBottom: insets.bottom + TAB_BAR_CLEARANCE,
              backgroundColor: chrome.raised,
              borderColor: chrome.edge,
              borderTopColor: chrome.highlight,
              shadowColor: theme.shadow,
            },
          ]}
        >
          {toast.icon && <MaterialCommunityIcons name={toast.icon} size={18} color={chrome.icon} />}
          <Text numberOfLines={2} style={[styles.message, { color: chrome.text }]}>
            {toast.message}
          </Text>
          {toast.action && (
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => {
                toast.action!.onPress();
                dismissToast(toast.id);
              }}
              style={({ pressed }) => [styles.action, pressed && { opacity: 0.6 }]}
            >
              <Text style={[styles.actionText, { color: chrome.accent }]}>{toast.action.label}</Text>
            </Pressable>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  host: { justifyContent: "flex-end", paddingHorizontal: 16 },
  toast: {
    minHeight: 48,
    paddingLeft: 14,
    paddingRight: 6,
    borderWidth: 1,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    shadowOpacity: 0.3,
  },
  message: { flex: 1, paddingVertical: 12, fontSize: 14, fontWeight: "600" },
  action: { paddingHorizontal: 10, paddingVertical: 8 },
  actionText: { fontSize: 14, fontWeight: "700" },
});
