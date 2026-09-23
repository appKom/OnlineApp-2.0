import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { EventAttendanceBundle } from "../types/event";
import {
  getReservedAttendeeCount,
  getUnreservedAttendeeCount,
} from "../utils/attendance";
import { elevate, useTheme, useThemeMode } from "../utils/theme";
import {
  EventInsetDivider,
  useEventChromeColors,
} from "./EventDetails/EventSurface";

interface EventCardProps {
  event: EventAttendanceBundle;
  onPress: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
  const theme = useTheme();
  const { mode } = useThemeMode();
  const chrome = useEventChromeColors();
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

  const getBadgeColor = (eventType: string | undefined): string => {
    switch (eventType?.toUpperCase()) {
      case "SOCIAL":
        return theme.socialBadge;
      case "ACADEMIC":
        return theme.academicBadbe;
      case "COMPANY":
        return theme.companyBadge;
      case "GENERAL_ASSEMBLY":
        return theme.generalAssemblyBadge;
      case "INTERNAL":
        return theme.internalBadge;
      case "WELCOME":
        return theme.welcomeBadge;
      default:
        return theme.otherBadge;
    }
  };

  const getEventTypeLabel = (eventType: string | undefined): string => {
    switch (eventType?.toUpperCase()) {
      case "SOCIAL":
        return "Sosialt";
      case "ACADEMIC":
        return "Kurs";
      case "COMPANY":
        return "Bedpres";
      case "GENERAL_ASSEMBLY":
        return "Generalforsamling";
      case "INTERNAL":
        return "Intern";
      case "WELCOME":
        return "Fadderuke";
      default:
        return "Annet";
    }
  };

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("no-NO", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  const badgeColor = getBadgeColor(event.event.type);

  return (
    <View style={{ backgroundColor: chrome.surface }}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: pressed ? chrome.raised : chrome.surface },
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
              size={16}
              color={chrome.icon}
            />
            <Text
              style={[styles.date, { color: theme.onSurfaceVariant }]}
            >
              {formatDate(event.event.start)}
            </Text>
          </View>

          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor: badgeColor,
                borderColor: chrome.edge,
                borderTopColor: chrome.highlight,
              },
            ]}
          >
            <Text
              style={[
                styles.typeText,
                { color: elevate(badgeColor, 150) },
              ]}
            >
              {getEventTypeLabel(event.event.type)}
            </Text>
          </View>
        </View>

        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={chrome.icon}
        />
      </Pressable>
      <EventInsetDivider />
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
  typeBadge: {
    marginTop: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  typeText: {
    fontSize: 11,
    fontWeight: "600",
  },
});

export default EventCard;
