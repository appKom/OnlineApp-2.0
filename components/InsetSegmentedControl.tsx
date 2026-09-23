import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../utils/theme";
import { usePanelChromeColors } from "./PanelChrome";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

type Option<T extends string | number> = {
  value: T;
  label: string;
  icon?: IconName;
};

export function InsetSegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  accessibilitySuffix,
}: {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilitySuffix?: string;
}) {
  const theme = useTheme();
  const chrome = usePanelChromeColors();

  return (
    <View
      style={[
        styles.track,
        {
          backgroundColor: chrome.recessed,
          borderColor: chrome.edge,
          borderBottomColor: chrome.highlight,
        },
      ]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${option.label}${accessibilitySuffix ? ` ${accessibilitySuffix}` : ""}`}
            activeOpacity={0.82}
            onPress={() => onChange(option.value)}
            style={[
              styles.option,
              selected && {
                backgroundColor: chrome.raised,
                borderColor: chrome.edge,
                borderTopColor: chrome.highlight,
              },
            ]}
          >
            {option.icon && (
              <MaterialCommunityIcons
                name={option.icon}
                size={16}
                color={selected ? chrome.icon : theme.onSurfaceVariant}
              />
            )}
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                {
                  color: selected ? theme.onSurface : theme.onSurfaceVariant,
                  fontWeight: selected ? "700" : "500",
                },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    padding: 4,
    borderWidth: 1,
    borderRadius: 12,
    gap: 4,
  },
  option: {
    minHeight: 42,
    minWidth: 0,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 9,
  },
  label: { fontSize: 12 },
});
