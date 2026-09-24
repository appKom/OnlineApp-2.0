import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { EventAttendanceBundle } from "../types/event";
import {
  getReservedAttendeeCount,
  getUnreservedAttendeeCount,
} from "../utils/attendance";
import { useTheme, useThemeMode } from "../utils/theme";
import { PanelDivider, Tag, usePanelChromeColors } from "./Panel";

const EVENT_TYPES: Record<string, { label: string; dark: string; light: string }> = {
  SOCIAL: { label: "Sosialt", dark: "#74D69C", light: "#1B7A48" },
  ACADEMIC: { label: "Kurs", dark: "#86BCF7", light: "#1F5FA8" },
  COMPANY: { label: "Bedpres", dark: "#F2878A", light: "#B3323A" },
  GENERAL_ASSEMBLY: { label: "Generalforsamling", dark: "#F5BC6F", light: "#8F5A00" },
  INTERNAL: { label: "Intern", dark: "#C4A9FF", light: "#6A4FB0" },
  WELCOME: { label: "Fadderuke", dark: "#F5BC6F", light: "#8F5A00" },
  OTHER: { label: "Annet", dark: "#A9B1B9", light: "#5B636B" },
};

export function useEventTypeStyle(eventType: string | undefined) {
  const { mode } = useThemeMode();
  const type = EVENT_TYPES[eventType?.toUpperCase() ?? ""] ?? EVENT_TYPES.OTHER;
  return { label: type.label, color: mode === "dark" ? type.dark : type.light };
}

interface EventCardProps {
  event: EventAttendanceBundle;
  onPress: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
  const theme = useTheme();
  const { mode } = useThemeMode();
  const chrome = usePanelChromeColors();
  const type = useEventTypeStyle(event.event.type);
  const primaryPool = event.attendance?.pools[0];
  const reservedCount = event.attendance
    ? getReservedAttendeeCount(event.attendance, primaryPool?.id ?? "")
    : 0;
  const waitlistCount = event.attendance
    ? getUnreservedAttendeeCount(event.attendance, primaryPool?.id ?? "")
    : 0;

  const getFallbackImage = () =>
    mode === "dark"
      ? require("../assets/eventFallback/fallback_dark.png")
      : require("../assets/eventFallback/fallback_light.png");

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("no-NO", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });


  return (
    <View style={{ backgroundColor: theme.background }}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: pressed ? theme.surfaceContainerLow : theme.background },
        ]}
      >
        <Image
          source={
            event.event.imageUrl
              ? { uri: event.event.imageUrl }
              : getFallbackImage()
          }
          style={[
            styles.image,
            {
              backgroundColor: chrome.recessed,
              borderColor: chrome.edge,
              borderTopColor: chrome.highlight,
            },
          ]}
          resizeMode="cover"
        />

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text
              numberOfLines={1}
              style={[styles.title, { color: theme.onSurface }]}
            >
              {event.event.title ?? "Uten tittel"}
            </Text>

            {event.attendance && (
              <View
                style={[
                  styles.attendancePill,
                  {
                    backgroundColor: chrome.recessed,
                    borderColor: chrome.edge,
                    borderBottomColor: chrome.highlight,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="account-group-outline"
                  size={14}
                  color={chrome.icon}
                />
                <Text
                  style={[styles.attendanceText, { color: theme.onSurface }]}
                >
                  {reservedCount}
                  {(primaryPool?.capacity ?? 0) > 0 &&
                    `/${primaryPool?.capacity}`}
                  {waitlistCount > 0 && ` +${waitlistCount}`}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.dateRow}>
            <MaterialCommunityIcons
              name="calendar-blank-outline"
              size={15}
              color={chrome.icon}
            />
            <Text
              style={[styles.date, { color: theme.onSurfaceVariant }]}
            >
              {formatDate(event.event.start)}
            </Text>
          </View>

          <Tag label={type.label} color={type.color} style={styles.typeTag} />
        </View>

        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={chrome.icon}
        />
      </Pressable>
      <PanelDivider onBackground />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    minHeight: 98,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  image: {
    width: 100,
    height: 70,
    borderWidth: 1,
    borderRadius: 9,
  },
  content: {
    minWidth: 0,
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
  },
  attendancePill: {
    minHeight: 25,
    paddingHorizontal: 7,
    borderWidth: 1,
    borderRadius: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  attendanceText: {
    fontSize: 11,
    fontWeight: "700",
  },
  dateRow: {
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  date: {
    flex: 1,
    fontSize: 13,
  },
  typeTag: {
    marginTop: 8,
  },
});

export default EventCard;
