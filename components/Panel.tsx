import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { blendColors, useTheme } from "../utils/theme";
import { usePanelChromeColors } from "./PanelChrome";

// Building blocks that follow the profile page: raised surfaces are lit from
// above (lighter top edge), recessed areas are lit from below (lighter bottom
// edge), and everything else gets the dark edge.

export type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export { usePanelChromeColors };

export function Panel({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const chrome = usePanelChromeColors();

  return (
    <View
      style={[
        styles.panel,
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

export function PanelHeader({
  title,
  tag,
  tagColor,
  right,
  style,
}: {
  title: string;
  tag?: string;
  tagColor?: string;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const chrome = usePanelChromeColors();

  return (
    <View style={[styles.header, style]}>
      <Text numberOfLines={1} style={[styles.headerTitle, { color: chrome.text }]}>
        {title}
      </Text>
      {tag ? <Tag label={tag} color={tagColor} /> : null}
      <View style={styles.spacer} />
      {right}
    </View>
  );
}

/** Small uppercase status text, no background. */
export function Tag({
  label,
  color,
  style,
}: {
  label: string;
  color?: string;
  style?: StyleProp<TextStyle>;
}) {
  const chrome = usePanelChromeColors();
  return (
    <Text numberOfLines={1} style={[styles.tag, { color: color ?? chrome.textMuted }, style]}>
      {label}
    </Text>
  );
}

/** Same treatment as the profile's section labels, sized for use inside a panel. */
export function FieldLabel({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const chrome = usePanelChromeColors();
  return <Text style={[styles.fieldLabel, { color: chrome.textMuted }, style]}>{children}</Text>;
}

/** Section label on the page background, identical to the profile's. */
export function SectionLabel({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const chrome = usePanelChromeColors();
  return <Text style={[styles.sectionLabel, { color: chrome.textMuted }, style]}>{children}</Text>;
}

/** Two-tone engraved divider. */
export function PanelDivider({
  style,
  onBackground = false,
}: {
  style?: StyleProp<ViewStyle>;
  onBackground?: boolean;
}) {
  const chrome = usePanelChromeColors();
  return (
    <View style={[styles.divider, style]}>
      <View style={[styles.dividerLine, { backgroundColor: onBackground ? chrome.listEdge : chrome.edge }]} />
      <View
        style={[styles.dividerLine, { backgroundColor: onBackground ? chrome.listHighlight : chrome.highlight }]}
      />
    </View>
  );
}

/** Recessed strip, like the membership validity row on the profile. */
export function InsetField({
  label,
  value,
  icon,
  onPress,
  trailingIcon,
  valueColor,
  style,
  accessibilityLabel,
}: {
  label: string;
  value?: string;
  icon?: IconName;
  onPress?: () => void;
  trailingIcon?: IconName;
  valueColor?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const chrome = usePanelChromeColors();

  const content = (
    <>
      {icon && <MaterialCommunityIcons name={icon} size={17} color={chrome.icon} />}
      <Text numberOfLines={1} style={[styles.insetLabel, { color: chrome.textMuted }]}>
        {label}
      </Text>
      {value !== undefined && (
        <Text numberOfLines={2} style={[styles.insetValue, { color: valueColor ?? chrome.text }]}>
          {value}
        </Text>
      )}
      {trailingIcon && <MaterialCommunityIcons name={trailingIcon} size={18} color={chrome.icon} />}
    </>
  );

  const fieldStyle = [
    styles.inset,
    { backgroundColor: chrome.recessed, borderColor: chrome.edge, borderBottomColor: chrome.highlight },
    style,
  ];

  if (!onPress) return <View style={fieldStyle}>{content}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [fieldStyle, pressed && { opacity: 0.75 }]}
    >
      {content}
    </Pressable>
  );
}

type ButtonTone = "default" | "accent" | "danger" | "warning";

/** Raised button, lit from above. Tone colours the icon and label only. */
export function RaisedButton({
  label,
  icon,
  onPress,
  tone = "default",
  disabled = false,
  flex = false,
  accessibilityLabel,
  style,
}: {
  label?: string;
  icon?: IconName;
  onPress?: () => void;
  tone?: ButtonTone;
  disabled?: boolean;
  flex?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const chrome = usePanelChromeColors();
  const color = {
    default: chrome.text,
    accent: chrome.accent,
    danger: chrome.danger,
    warning: chrome.warning,
  }[tone];
  const iconColor = tone === "default" ? chrome.icon : color;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        flex && styles.flex,
        !label && styles.iconOnly,
        {
          backgroundColor: pressed ? chrome.raisedPressed : chrome.raised,
          borderColor: chrome.edge,
          borderTopColor: chrome.highlight,
          opacity: disabled ? 0.45 : 1,
        },
        style,
      ]}
    >
      {icon && <MaterialCommunityIcons name={icon} size={18} color={iconColor} />}
      {label ? (
        <Text numberOfLines={1} style={[styles.buttonText, { color }]}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

/** Recessed track with a raised selected option, like the profile's theme picker, but wrapping. */
export function ChoiceTrack<T extends string | number | null>({
  options,
  value,
  onChange,
  style,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const chrome = usePanelChromeColors();

  return (
    <View
      style={[
        styles.track,
        { backgroundColor: chrome.recessed, borderColor: chrome.edge, borderBottomColor: chrome.highlight },
        style,
      ]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.choice,
              selected && {
                backgroundColor: chrome.raised,
                borderColor: chrome.edge,
                borderTopColor: chrome.highlight,
              },
              pressed && !selected && { opacity: 0.7 },
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.choiceText,
                { color: selected ? chrome.text : chrome.textMuted, fontWeight: selected ? "700" : "500" },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Borderless icon action for panel headers and rows. */
export function IconAction({
  icon,
  onPress,
  accessibilityLabel,
  active = false,
}: {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  active?: boolean;
}) {
  const chrome = usePanelChromeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active }}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [styles.iconAction, pressed && { opacity: 0.6 }]}
    >
      <MaterialCommunityIcons name={icon} size={20} color={active ? chrome.accent : chrome.icon} />
    </Pressable>
  );
}

/** Recessed track with a tinted fill. */
export function MeterBar({ value, color }: { value: number; color?: string }) {
  const chrome = usePanelChromeColors();
  const clamped = Math.max(0, Math.min(1, value));
  const fill = blendColors(color ?? chrome.accent, chrome.recessed, 0.55);

  return (
    <View
      style={[
        styles.meter,
        { backgroundColor: chrome.recessed, borderColor: chrome.edge, borderBottomColor: chrome.highlight },
      ]}
    >
      <View style={[styles.meterFill, { width: `${clamped * 100}%`, backgroundColor: fill }]} />
    </View>
  );
}

/** Toggle row with a chevron, like the profile's history toggle. */
export function DisclosureRow({
  title,
  open,
  onPress,
}: {
  title: string;
  open: boolean;
  onPress: () => void;
}) {
  const chrome = usePanelChromeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      onPress={onPress}
      style={({ pressed }) => [styles.disclosure, pressed && { opacity: 0.7 }]}
    >
      <Text numberOfLines={1} style={[styles.disclosureTitle, { color: chrome.text }]}>
        {title}
      </Text>
      <MaterialCommunityIcons name={open ? "chevron-up" : "chevron-down"} size={20} color={chrome.icon} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 1,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 5,
  },
  header: { minHeight: 32, flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { flexShrink: 1, fontSize: 16, fontWeight: "700" },
  spacer: { flex: 1 },
  tag: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase" },
  fieldLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" },
  sectionLabel: {
    marginTop: 4,
    marginBottom: 8,
    marginHorizontal: 3,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  divider: { height: 2 },
  dividerLine: { height: 1 },
  inset: {
    minHeight: 40,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  insetLabel: { fontSize: 13 },
  insetValue: { flex: 1, fontSize: 13, fontWeight: "600", textAlign: "right" },
  button: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  flex: { flex: 1 },
  iconOnly: { width: 44, paddingHorizontal: 0 },
  buttonText: { fontSize: 14, fontWeight: "600" },
  track: { flexDirection: "row", flexWrap: "wrap", padding: 4, gap: 4, borderWidth: 1, borderRadius: 12 },
  choice: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 9,
    justifyContent: "center",
  },
  choiceText: { fontSize: 12 },
  iconAction: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  meter: { height: 10, borderWidth: 1, borderRadius: 5, overflow: "hidden" },
  meterFill: { height: "100%" },
  disclosure: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  disclosureTitle: { fontSize: 13, fontWeight: "700" },
});
