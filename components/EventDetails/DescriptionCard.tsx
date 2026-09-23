import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "utils/theme";
import HTML from "react-native-render-html";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { EventSurface, useEventChromeColors } from "./EventSurface";

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
  // Use centralized theme tokens
  const theme = useTheme();
  const chrome = useEventChromeColors();

  // Strip HTML tags for length check
  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, " ");
  };

  const descriptionText = stripHtml(description);
  const shouldShowToggle = descriptionText.length > 256;

  return (
    <EventSurface style={styles.card}>
      <Text style={[styles.cardTitle, { color: theme.onSurface }]}>
        Beskrivelse
      </Text>

      <View
        style={[
          styles.contentContainer,
          !descriptionExpanded && shouldShowToggle && styles.collapsedContent,
        ]}
      >
        <HTML
          source={{ html: description }}
          contentWidth={screenWidth - 88}
          baseStyle={{ ...styles.htmlBase, color: theme.onSurface }}
        />
      </View>

      {shouldShowToggle && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityState={{ expanded: descriptionExpanded }}
          onPress={onToggleDescription}
          style={styles.toggleButton}
        >
          <Text style={[styles.toggleText, { color: chrome.icon }]}>
            {descriptionExpanded ? "Vis mindre" : "Les mer"}
          </Text>
          <MaterialCommunityIcons
            name={descriptionExpanded ? "chevron-up" : "chevron-down"}
            size={18}
            color={chrome.icon}
          />
        </TouchableOpacity>
      )}
    </EventSurface>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  contentContainer: {
    // No constraints when expanded - content decides height
  },
  collapsedContent: {
    maxHeight: 120, // Adjust this value as needed
    overflow: "hidden",
  },
  toggleButton: {
    marginTop: 10,
    minHeight: 38,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  toggleText: { fontSize: 14, fontWeight: "700" },
  htmlBase: {
    fontSize: 16,
    lineHeight: 24,
  },
});

export default DescriptionCard;
