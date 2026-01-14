import React from "react";
import { Pressable, View, Text, StyleSheet } from "react-native";
import { EventAttendanceBundle } from "../types/event";
import { useTheme } from "../utils/theme";

interface EventCardProps {
  event: EventAttendanceBundle;
  onPress: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
  const theme = useTheme();

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("no-NO", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Pressable
      style={{
        padding: 12,
        borderBottomWidth: 1,
        borderColor: theme.surfaceContainerHigh,
        backgroundColor: theme.background,
      }}
      onPress={onPress}
    >
      {/* Event Title */}
      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
          color: theme.onBackground,
          marginBottom: 8,
        }}
      >
        {event.event.title ?? "No Title"}
      </Text>

      {/* Event Date and Time */}
      <Text
        style={{
          fontSize: 14,
          color: theme.onSurfaceVariant,
          marginBottom: 4,
        }}
      >
        📅 {formatDate(event.event.start)}
      </Text>

      {/* Event Location */}
      {event.event.locationTitle && (
        <Text
          style={{
            fontSize: 14,
            color: theme.onSurfaceVariant,
            marginBottom: 4,
          }}
        >
          📍 {event.event.locationTitle}
        </Text>
      )}

      {/* Subtitle or Description Preview */}
      {event.event.subtitle && (
        <Text
          style={{
            fontSize: 13,
            color: theme.onSurfaceVariant,
            fontStyle: "italic",
          }}
          numberOfLines={1}
        >
          {event.event.subtitle}
        </Text>
      )}
    </Pressable>
  );
};

export default EventCard;
