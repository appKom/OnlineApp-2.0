import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { LiquidGlassView } from "@callstack/liquid-glass";
import { Attendance } from "types/event";

interface RegistrationCardProps {
  attendance: Attendance;
  registrationStatus: string;
  registrationPeriod: string | null;
}

// RegistrationCard Component
const RegistrationCard: React.FC<RegistrationCardProps> = ({
  attendance,
  registrationStatus,
  registrationPeriod,
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
    textTertiary: isDark ? "#aaaaaa" : "#666666",
    badgeBackground: isDark
      ? "rgba(255, 255, 255, 0.1)"
      : "rgba(0, 0, 0, 0.05)",
    buttonBackground: isDark
      ? "rgba(100, 181, 246, 0.2)"
      : "rgba(0, 122, 255, 0.2)",
    buttonText: isDark ? "#64B5F6" : "#007AFF",
    statusOpenBg: isDark ? "rgba(76, 175, 80, 0.3)" : "#D4F6D4",
    statusOpenText: isDark ? "#A5D6A7" : "#2D7D32",
    statusClosedBg: isDark ? "rgba(244, 67, 54, 0.3)" : "#FFE4E4",
    statusClosedText: isDark ? "#EF9A9A" : "#C62828",
  };

  // Format date-time helper (converts ISO to "DD.MM, HH:MM")
  const formatDateTime = (dateString?: string): string => {
    if (!dateString) return "—";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "—";

      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");

      return `${day}.${month}, ${hours}:${minutes}`;
    } catch {
      return "—";
    }
  };

  // TODO: Figure out pool index based on your class
  const poolIndex = 0;

  // Extract real data from attendance object
  const attendeesCount = attendance?.attendees?.length || 0;
  const maxCapacity = attendance?.pools[poolIndex]?.capacity || null;
  const waitingListCount = attendance?.waitingListCount || 0;

  // Format registration dates from attendance data
  const registrationStart = formatDateTime(attendance?.registerStart);
  const registrationEnd = formatDateTime(attendance?.registerEnd);
  const unregistrationDeadline = formatDateTime(attendance?.deregisterDeadline);

  return (
    <LiquidGlassView
      style={[styles.card, { backgroundColor: colors.cardBackground }]}
    >
      {/* Header with title and status */}
      <View style={styles.registrationHeader}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
          Registrering
        </Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                registrationStatus === "Åpen"
                  ? colors.statusOpenBg
                  : colors.statusClosedBg,
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color:
                  registrationStatus === "Åpen"
                    ? colors.statusOpenText
                    : colors.statusClosedText,
              },
            ]}
          >
            {registrationStatus}
          </Text>
        </View>
      </View>

      {attendance ? (
        <View>
          {/* Attendance badges */}
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.infoBadge,
                { backgroundColor: colors.badgeBackground },
              ]}
            >
              <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                Påmeldte: {attendeesCount}
                {maxCapacity ? `/${maxCapacity}` : ""}
              </Text>
            </View>
            <View
              style={[
                styles.infoBadge,
                { backgroundColor: colors.badgeBackground },
              ]}
            >
              <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                Venteliste: {waitingListCount}
              </Text>
            </View>
          </View>

          {/* Three column date layout */}
          <View style={styles.dateColumns}>
            <View style={styles.dateColumn}>
              <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>
                Start
              </Text>
              <Text style={[styles.dateValue, { color: colors.textPrimary }]}>
                {registrationStart}
              </Text>
            </View>
            <View
              style={[
                styles.dateColumn,
                {
                  borderLeftWidth: 1,
                  borderRightWidth: 1,
                  borderColor: colors.badgeBackground,
                },
              ]}
            >
              <Text
                style={[
                  styles.dateLabel,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                Slutt
              </Text>
              <Text style={[styles.dateValue, { color: colors.textPrimary }]}>
                {registrationEnd}
              </Text>
            </View>
            <View style={styles.dateColumn}>
              <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>
                Avmelding
              </Text>
              <Text style={[styles.dateValue, { color: colors.textPrimary }]}>
                {unregistrationDeadline}
              </Text>
            </View>
          </View>

          {/* Registration button - only show if open */}
          {registrationStatus === "Åpen" && (
            <TouchableOpacity
              style={styles.registrationButtonWrapper}
              activeOpacity={0.7}
            >
              <LiquidGlassView
                style={[
                  styles.registrationButton,
                  {
                    backgroundColor: colors.buttonBackground,
                    borderWidth: 1,
                    borderRadius: 25,
                    overflow: "hidden",
                    borderColor: colors.buttonBackground,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.registrationButtonText,
                    { color: colors.buttonText },
                  ]}
                >
                  Registrer deg
                </Text>
              </LiquidGlassView>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <Text
          style={[styles.noRegistrationText, { color: colors.textTertiary }]}
        >
          Ingen registrering tilgjengelig for dette arrangementet
        </Text>
      )}
    </LiquidGlassView>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 24,
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
  },
  registrationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 60,
    alignItems: "center",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 12,
  },
  infoBadge: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "500",
  },
  dateColumns: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  dateColumn: {
    flex: 1,
    alignItems: "center",
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  registrationButtonWrapper: {
    marginTop: 8,
  },
  registrationButton: {
    paddingVertical: 14,
    alignItems: "center",
  },
  registrationButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  noRegistrationText: {
    fontSize: 16,
    textAlign: "center",
    fontStyle: "italic",
  },
});

export default RegistrationCard;
