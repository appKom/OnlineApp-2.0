import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface AttendanceCardProps {
  event: any;
  formatNorwegianDate: (dateString: string) => string;
}

const AttendanceCard: React.FC<AttendanceCardProps> = ({
  event,
  formatNorwegianDate,
}) => {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Tid & Sted</Text>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Start:</Text>
        <Text style={styles.detailValue}>
          {formatNorwegianDate(event.event.start)}
        </Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Slutt:</Text>
        <Text style={styles.detailValue}>
          {formatNorwegianDate(event.event.end)}
        </Text>
      </View>

      {event.event.locationTitle && (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Sted:</Text>
          <Text style={styles.detailValue}>{event.event.locationTitle}</Text>
        </View>
      )}

      {event.event.locationAddress && (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Adresse:</Text>
          <Text style={styles.detailValue}>{event.event.locationAddress}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flex: 1,
  },
  image: {
    backgroundColor: "#f0f0f0",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginHorizontal: 24,
    marginVertical: 20,
    color: "#333",
  },
  card: {
    backgroundColor: "#f8f9fa",
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
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
    color: "#333",
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
    color: "#555",
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    color: "#333",
    flex: 2,
    textAlign: "right",
  },
  descriptionPreview: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
    marginBottom: 8,
  },
  toggleText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
    marginTop: 8,
  },
  htmlBase: {
    fontSize: 16,
    lineHeight: 24,
    color: "#666",
  },
});

export default AttendanceCard;
