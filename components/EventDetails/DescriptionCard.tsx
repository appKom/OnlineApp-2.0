import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import HTML from "react-native-render-html";

interface DescriptionCardProps {
  description: string;
  screenWidth: number;
  descriptionExpanded: boolean;
  onToggleDescription: () => void;
}

const DescriptionCard: React.FC<DescriptionCardProps> = ({
  description,
  screenWidth,
  descriptionExpanded,
  onToggleDescription,
}) => {
  // Strip HTML tags for preview
  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, " ");
  };

  const descriptionText = stripHtml(description);
  const shouldShowToggle = descriptionText.length > 256;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={shouldShowToggle ? onToggleDescription : undefined}
    >
      <Text style={styles.cardTitle}>Beskrivelse</Text>

      {descriptionExpanded ? (
        <HTML
          source={{ html: description }}
          contentWidth={screenWidth - 88}
          baseStyle={styles.htmlBase}
        />
      ) : (
        <Text style={styles.descriptionPreview}>
          {shouldShowToggle
            ? descriptionText.substring(0, 256) + "..."
            : descriptionText}
        </Text>
      )}

      {shouldShowToggle && (
        <Text style={styles.toggleText}>
          {descriptionExpanded ? "Vis mindre" : "Les mer..."}
        </Text>
      )}
    </TouchableOpacity>
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

export default DescriptionCard;
