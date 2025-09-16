import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface RegistrationCardProps {
  attendance: any;
  registrationStatus: string;
  registrationPeriod: string | null;
}

// RegistrationCard Component
const RegistrationCard: React.FC<RegistrationCardProps> = ({
  attendance,
  registrationStatus,
  registrationPeriod,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.registrationHeader}>
        <Text style={styles.cardTitle}>Registrering</Text>
        <View
          style={[
            styles.statusBadge,
            registrationStatus === "Åpen"
              ? styles.statusOpen
              : styles.statusClosed,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              registrationStatus === "Åpen"
                ? styles.statusOpenText
                : styles.statusClosedText,
            ]}
          >
            {registrationStatus}
          </Text>
        </View>
      </View>

      {attendance ? (
        <View>
          {registrationPeriod && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Periode:</Text>
              <Text style={styles.detailValue}>{registrationPeriod}</Text>
            </View>
          )}

          {attendance.maxCapacity && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Kapasitet:</Text>
              <Text style={styles.detailValue}>
                {attendance.attendees?.length || 0} / {attendance.maxCapacity}
              </Text>
            </View>
          )}

          {attendance.waitingList && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Venteliste:</Text>
              <Text style={styles.detailValue}>
                {attendance.waitingListCount || 0}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.registrationButton,
              registrationStatus !== "Åpen" &&
                styles.registrationButtonDisabled,
            ]}
            disabled={registrationStatus !== "Åpen"}
          >
            <Text
              style={[
                styles.registrationButtonText,
                registrationStatus !== "Åpen" &&
                  styles.registrationButtonTextDisabled,
              ]}
            >
              {registrationStatus === "Åpen"
                ? "Registrer deg"
                : "Registrering stengt"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.noRegistrationText}>
          Ingen registrering tilgjengelig for dette arrangementet
        </Text>
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
  statusOpen: {
    backgroundColor: "#D4F6D4",
  },
  statusClosed: {
    backgroundColor: "#FFE4E4",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  statusOpenText: {
    color: "#2D7D32",
  },
  statusClosedText: {
    color: "#C62828",
  },
  registrationButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  registrationButtonDisabled: {
    backgroundColor: "#E0E0E0",
  },
  registrationButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  registrationButtonTextDisabled: {
    color: "#999",
  },
  noRegistrationText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
});

export default RegistrationCard;
