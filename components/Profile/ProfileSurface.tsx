import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { useTheme, useThemeMode } from "../../utils/theme";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export function ProfileSurface({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const { mode } = useThemeMode();

  return (
    <View
      style={[
        styles.surface,
        {
          backgroundColor: theme.surfaceContainerLow,
          borderColor: theme.outlineVariant,
          borderTopColor: theme.surfaceBright,
          borderBottomColor:
            mode === "dark"
              ? theme.surfaceContainerLowest
              : theme.surfaceContainerHighest,
          shadowColor: theme.shadow,
          shadowOpacity: mode === "dark" ? 0.42 : 0.14,
        },
        style,
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.topHighlight,
          {
            backgroundColor: theme.surfaceBright,
            opacity: mode === "dark" ? 0.14 : 0.9,
          },
        ]}
      />
      {children}
    </View>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  const theme = useTheme();

  return (
    <Text style={[styles.sectionLabel, { color: theme.onSurfaceVariant }]}>
      {children}
    </Text>
  );
}

export function QuickFact({
  icon,
  value,
  label,
}: {
  icon: IconName;
  value: string;
  label: string;
}) {
  const theme = useTheme();

  return (
    <ProfileSurface style={styles.quickFact}>
      <MaterialCommunityIcons name={icon} size={21} color={theme.primary} />
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        style={[styles.quickValue, { color: theme.onSurface }]}
      >
        {value}
      </Text>
      <Text
        numberOfLines={2}
        style={[styles.quickLabel, { color: theme.onSurfaceVariant }]}
      >
        {label}
      </Text>
    </ProfileSurface>
  );
}

export function ProfileInfoRow({
  icon,
  label,
  value,
  isLast = false,
}: {
  icon: IconName;
  label: string;
  value: string;
  isLast?: boolean;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.infoRow,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.outlineVariant,
        },
      ]}
    >
      <View
        style={[
          styles.infoIcon,
          { backgroundColor: theme.primaryContainer },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={theme.onPrimaryContainer}
        />
      </View>
      <Text style={[styles.infoLabel, { color: theme.onSurfaceVariant }]}>
        {label}
      </Text>
      <Text
        selectable
        style={[styles.infoValue, { color: theme.onSurface }]}
      >
        {value}
      </Text>
    </View>
  );
}

export function ThemeSelector({
  selectedMode,
  onChange,
}: {
  selectedMode: "light" | "dark" | "system";
  onChange: (mode: "light" | "dark" | "system") => void;
}) {
  const theme = useTheme();
  const options = [
    { value: "dark" as const, label: "Mørk", icon: "weather-night" as const },
    { value: "system" as const, label: "System", icon: "cellphone" as const },
    {
      value: "light" as const,
      label: "Lys",
      icon: "white-balance-sunny" as const,
    },
  ];

  return (
    <ProfileSurface style={styles.themeCard}>
      <View style={styles.themeHeading}>
        <View
          style={[
            styles.infoIcon,
            { backgroundColor: theme.primaryContainer },
          ]}
        >
          <MaterialCommunityIcons
            name="theme-light-dark"
            size={18}
            color={theme.onPrimaryContainer}
          />
        </View>
        <View style={styles.themeCopy}>
          <Text style={[styles.themeTitle, { color: theme.onSurface }]}>Tema</Text>
          <Text
            style={[styles.themeDescription, { color: theme.onSurfaceVariant }]}
          >
            Følg systemet eller velg selv
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.themeTrack,
          {
            backgroundColor: theme.surfaceContainerLowest,
            borderColor: theme.outlineVariant,
            borderTopColor: theme.shadow,
            borderBottomColor: theme.surfaceBright,
          },
        ]}
      >
        {options.map((option) => {
          const selected = selectedMode === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${option.label} tema`}
              activeOpacity={0.82}
              onPress={() => onChange(option.value)}
              style={[
                styles.themeOption,
                selected && {
                  backgroundColor: theme.surfaceContainerHigh,
                  borderColor: theme.surfaceBright,
                  shadowColor: theme.shadow,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={option.icon}
                size={16}
                color={selected ? theme.secondary : theme.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.themeOptionText,
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
    </ProfileSurface>
  );
}

const styles = StyleSheet.create({
  surface: {
    position: "relative",
    borderWidth: 1,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 5,
  },
  topHighlight: {
    position: "absolute",
    top: 0,
    left: 14,
    right: 14,
    height: StyleSheet.hairlineWidth,
    borderRadius: 999,
  },
  sectionLabel: {
    marginTop: 4,
    marginBottom: 8,
    marginHorizontal: 3,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  quickFact: {
    flex: 1,
    minHeight: 92,
    paddingHorizontal: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickValue: {
    width: "100%",
    marginTop: 6,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  quickLabel: {
    minHeight: 28,
    marginTop: 2,
    fontSize: 11,
    lineHeight: 14,
    textAlign: "center",
  },
  infoRow: {
    minHeight: 58,
    marginHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
  },
  infoValue: {
    flex: 1.35,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "right",
  },
  themeCard: {
    padding: 14,
    gap: 13,
  },
  themeHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  themeCopy: {
    flex: 1,
  },
  themeTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  themeDescription: {
    marginTop: 2,
    fontSize: 12,
  },
  themeTrack: {
    flexDirection: "row",
    padding: 4,
    borderWidth: 1,
    borderRadius: 12,
    gap: 4,
  },
  themeOption: {
    minHeight: 42,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 9,
  },
  themeOptionText: {
    fontSize: 12,
  },
});
