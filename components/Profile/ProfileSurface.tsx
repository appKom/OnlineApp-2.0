import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { useTheme } from "../../utils/theme";
import { usePanelChromeColors } from "../PanelChrome";
import { InsetSegmentedControl } from "../InsetSegmentedControl";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export const useProfileChromeColors = usePanelChromeColors;

export function ProfileSurface({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const chrome = useProfileChromeColors();

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

export function ProfileDivider() {
  const chrome = useProfileChromeColors();

  return (
    <View style={styles.divider}>
      <View style={[styles.dividerLine, { backgroundColor: chrome.edge }]} />
      <View
        style={[styles.dividerLine, { backgroundColor: chrome.highlight }]}
      />
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
  const chrome = useProfileChromeColors();

  return (
    <View style={styles.quickFact}>
      <MaterialCommunityIcons name={icon} size={21} color={chrome.icon} />
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
    </View>
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
  const chrome = useProfileChromeColors();

  return (
    <View
      style={[
        styles.infoRow,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: chrome.edge,
        },
      ]}
    >
      <View style={styles.infoIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={chrome.icon}
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
  const chrome = useProfileChromeColors();
  const options = [
    { value: "dark" as const, label: "Mørk", icon: "weather-night" as const },
    { value: "system" as const, label: "System", icon: "cellphone" as const },
    {
      value: "light" as const,
      label: "Lys",
      icon: "white-balance-sunny" as const,
    },
  ] as const;

  return (
    <ProfileSurface style={styles.themeCard}>
      <View style={styles.themeHeading}>
        <View style={styles.infoIcon}>
          <MaterialCommunityIcons
            name="theme-light-dark"
            size={18}
            color={chrome.icon}
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

      <InsetSegmentedControl
        options={options}
        value={selectedMode}
        onChange={onChange}
        accessibilitySuffix="tema"
      />
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
  divider: {
    height: 2,
  },
  dividerLine: {
    height: 1,
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
    minHeight: 88,
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
    width: 26,
    height: 32,
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
});
