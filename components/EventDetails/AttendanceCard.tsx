import React from "react";
import { StyleSheet, Text, View, useColorScheme } from "react-native";
import { LiquidGlassView } from "@callstack/liquid-glass";

interface AttendanceCardProps {
  event: any;
  formatNorwegianDate: (dateString: string) => string;
}

const AttendanceCard: React.FC<AttendanceCardProps> = ({
  event,
  formatNorwegianDate,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Theme-aware colors
  const colors = {
    cardBackground: isDark
      ? "rgba(255, 255, 255, 0.1)"
      : "rgba(255, 255, 255, 0.8)",
    textPrimary: isDark ? "#ffffff" : "#333333",
    textSecondary: isDark ? "#cccccc" : "#555555",
  };

  // Smart date formatting function
  const formatDateRange = (startDateString: string, endDateString: string) => {
    const startDate = new Date(startDateString);
    const endDate = new Date(endDateString);

    // Check if both dates are on the same day
    const isSameDay =
      startDate.getFullYear() === endDate.getFullYear() &&
      startDate.getMonth() === endDate.getMonth() &&
      startDate.getDate() === endDate.getDate();

    if (isSameDay) {
      // Same day: "Date, start time - end time"
      const dateOnly = formatNorwegianDate(startDateString).split(",")[0]; // Remove time part if present
      const startTime = startDate.toLocaleTimeString("nb-NO", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const endTime = endDate.toLocaleTimeString("nb-NO", {
        hour: "2-digit",
        minute: "2-digit",
      });

      return `${dateOnly}, ${startTime} - ${endTime}`;
    } else {
      // Different days: keep original format
      return `${formatNorwegianDate(startDateString)} - ${formatNorwegianDate(
        endDateString
      )}`;
    }
  };

  return (
    <LiquidGlassView
      style={[styles.card, { backgroundColor: colors.cardBackground }]}
    >
      <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
        Tid & Sted
      </Text>

      {/* Smart date range */}
      <View style={styles.detailRow}>
        <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
          {formatDateRange(event.event.start, event.event.end)}
        </Text>
      </View>

      {event.event.locationTitle && (
        <View style={styles.detailRow}>
          {/* <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
            Sted:
          </Text> */}
          <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
            {event.event.locationTitle}
          </Text>
        </View>
      )}

      {event.event.locationAddress && (
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
            Adresse:
          </Text>
          <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
            {event.event.locationAddress}
          </Text>
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
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    flex: 2,
    textAlign: "left",
  },
});

export default AttendanceCard;
