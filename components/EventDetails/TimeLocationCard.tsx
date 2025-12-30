import React from "react";
import { StyleSheet, Text, View, Linking, TouchableOpacity } from "react-native";
import * as Calendar from "expo-calendar";
import { LiquidGlassView } from "@callstack/liquid-glass";
import { useTheme } from "utils/theme";
import { EventAttendanceBundle } from "types/event";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface TimeLocationCardProps {
  event: EventAttendanceBundle;
  formatNorwegianDate: (date: Date) => string;
}

const TimeLocationCard: React.FC<TimeLocationCardProps> = ({
  event,
  formatNorwegianDate,
}) => {
  const theme = useTheme();
  const colors = {
    cardBackground: theme.tertiaryContainer,
    textPrimary: theme.onPrimaryContainer,
    textSecondary: theme.onTertiaryContainer,
  };

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
      const monthOnly = startDate.toLocaleString('nb-NO', { month: 'long' });
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
        location: event.event.locationAddress || event.event.locationTitle || '',
        notes: event.event.description || '',
      });
    } catch (error) {
      console.error('Error adding to calendar:', error);
    }
  };

  return (
    <LiquidGlassView style={[styles.card, { backgroundColor: colors.cardBackground, }]}> 
      <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
        Oppmøte
      </Text>

      {/* Date and time with icon */}
      <TouchableOpacity onPress={handleAddToCalendar} style={[styles.detailRow, { marginBottom: 12 }]}>
        <MaterialCommunityIcons name="clock-outline" size={24} color={colors.textPrimary} style={styles.icon} />
        <View style={styles.textContainer}>
          <Text style={[styles.detailValue, { color: colors.textSecondary }]}>
            {formatDateRange(event.event.start, event.event.end).date}
          </Text>
          <Text style={[styles.detailValue, { color: colors.textSecondary }]}>
            {formatDateRange(event.event.start, event.event.end).time}
          </Text>
        </View>
        <MaterialCommunityIcons name="open-in-new" size={28} color={colors.textPrimary} style={styles.externalIcon} />
      </TouchableOpacity>

      {/* Location with icon */}
      {(event.event.locationTitle || event.event.locationAddress) && (
        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={24} color={colors.textPrimary} style={styles.icon} />
          <View style={styles.textContainer}>
            {event.event.locationTitle && (
              <Text style={[styles.detailValue, { color: colors.textSecondary }]}>
                {event.event.locationTitle}
              </Text>
            )}
            {event.event.locationAddress && (
              <Text style={[styles.detailValue, { color: colors.textSecondary }]}>
                {event.event.locationAddress}
              </Text>
            )}
          </View>
          {event.event.locationLink && (
            <TouchableOpacity onPress={() => Linking.openURL(event.event.locationLink!)}>
              <MaterialCommunityIcons name="open-in-new" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </LiquidGlassView>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  icon: {
    marginTop: 0,
  },
  textContainer: {
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
  },
  externalIcon: {
    marginTop: 0,
  },
});

export default TimeLocationCard;
