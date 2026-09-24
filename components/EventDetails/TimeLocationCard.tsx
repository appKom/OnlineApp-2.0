import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Linking,
} from "react-native";
import * as Calendar from "expo-calendar";
import { EventAttendanceBundle } from "types/event";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { IconAction, Panel, PanelHeader, usePanelChromeColors } from "../Panel";

interface TimeLocationCardProps {
  event: EventAttendanceBundle;
  formatNorwegianDate: (date: Date) => string;
}

const TimeLocationCard: React.FC<TimeLocationCardProps> = ({
  event,
  formatNorwegianDate,
}) => {
  const chrome = usePanelChromeColors();

  // Smart date formatting function
  const formatDateRange = (startDate: Date, endDate: Date) => {
    // Check if both dates are on the same day
    const isSameDay =
      startDate.getFullYear() === endDate.getFullYear() &&
      startDate.getMonth() === endDate.getMonth() &&
      startDate.getDate() === endDate.getDate();

    if (isSameDay) {
      // Same day: return date and time separately
      const dateOnly = startDate.getDate();
      const monthOnly = startDate.toLocaleString("nb-NO", { month: "long" });
      const startTime = startDate.toLocaleTimeString("nb-NO", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const endTime = endDate.toLocaleTimeString("nb-NO", {
        hour: "2-digit",
        minute: "2-digit",
      });

      return {
        date: `${dateOnly}. ${monthOnly}`,
        time: `kl. ${startTime} - ${endTime}`,
      };
    } else {
      // Different days: return combined format
      return {
        date: formatNorwegianDate(startDate),
        time: `- ${formatNorwegianDate(endDate)}`,
      };
    }
  };

  const handleAddToCalendar = async () => {
    try {
      await Calendar.createEventInCalendarAsync({
        title: event.event.title,
        startDate: event.event.start,
        endDate: event.event.end,
        location:
          event.event.locationAddress || event.event.locationTitle || "",
        notes: event.event.description || "",
      });
    } catch (error) {
      console.error("Error adding to calendar:", error);
    }
  };

  const { date, time } = formatDateRange(event.event.start, event.event.end);
  const hasLocation = Boolean(event.event.locationTitle || event.event.locationAddress);

  return (
    <Panel style={styles.card}>
      <PanelHeader title="Oppmøte" />

      <View style={styles.detailRow}>
        <MaterialCommunityIcons name="clock-outline" size={18} color={chrome.icon} />
        <View style={styles.textContainer}>
          <Text style={[styles.primary, { color: chrome.text }]}>{date}</Text>
          <Text style={[styles.secondary, { color: chrome.textMuted }]}>{time}</Text>
        </View>
        <IconAction
          icon="calendar-plus"
          accessibilityLabel="Legg til i kalender"
          onPress={handleAddToCalendar}
        />
      </View>

      {hasLocation && (
        <>
          <View style={[styles.rule, { backgroundColor: chrome.edge }]} />
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={18} color={chrome.icon} />
            <View style={styles.textContainer}>
              {event.event.locationTitle && (
                <Text style={[styles.primary, { color: chrome.text }]}>
                  {event.event.locationTitle}
                </Text>
              )}
              {event.event.locationAddress && (
                <Text style={[styles.secondary, { color: chrome.textMuted }]}>
                  {event.event.locationAddress}
                </Text>
              )}
            </View>
            {event.event.locationLink && (
              <IconAction
                icon="map-outline"
                accessibilityLabel="Åpne sted i kart"
                onPress={() => Linking.openURL(event.event.locationLink!)}
              />
            )}
          </View>
        </>
      )}
    </Panel>
  );
};

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 15,
    paddingTop: 13,
    paddingBottom: 3,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    minHeight: 56,
  },
  textContainer: {
    flex: 1,
    gap: 1,
  },
  primary: {
    fontSize: 15,
    fontWeight: "600",
  },
  secondary: {
    fontSize: 13,
    lineHeight: 18,
  },
  rule: { height: StyleSheet.hairlineWidth, marginLeft: 30 },
});

export default TimeLocationCard;
