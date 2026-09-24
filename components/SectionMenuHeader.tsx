import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button, Host, HStack, Image, Menu, Text as SwiftText } from "@expo/ui/swift-ui";
import { font, foregroundStyle, kerning } from "@expo/ui/swift-ui/modifiers";
import React from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { usePanelChromeColors } from "./Panel";

type Option<T extends string> = { value: T; label: string };

/**
 * A list section title that doubles as a native pull-down menu, e.g. "KOMMENDE ⌄".
 * `title` is what the header shows for the selected option.
 */
export function SectionMenuHeader<T extends string>({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const chrome = usePanelChromeColors();

  if (Platform.OS === "ios") {
    return (
      <View style={styles.row}>
        <Host matchContents>
          <Menu
            label={
              <HStack spacing={5}>
                <SwiftText
                  modifiers={[
                    font({ size: 12, weight: "bold" }),
                    kerning(0.8),
                    foregroundStyle(chrome.textMuted),
                  ]}
                >
                  {title.toUpperCase()}
                </SwiftText>
                <Image systemName="chevron.down" size={10} color={chrome.textMuted} />
              </HStack>
            }
          >
            {options.map((option) => (
              <Button
                key={option.value}
                label={option.label}
                systemImage={option.value === value ? "checkmark" : undefined}
                onPress={() => onChange(option.value)}
              />
            ))}
          </Menu>
        </Host>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        Alert.alert(
          title,
          undefined,
          options.map((option) => ({ text: option.label, onPress: () => onChange(option.value) })),
        )
      }
      style={[styles.row, styles.fallback]}
    >
      <Text style={[styles.title, { color: chrome.textMuted }]}>{title}</Text>
      <MaterialCommunityIcons name="chevron-down" size={14} color={chrome.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  fallback: { gap: 5 },
  title: { fontSize: 12, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" },
});
