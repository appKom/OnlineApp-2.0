import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import HTML from "react-native-render-html";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Panel, PanelHeader, usePanelChromeColors } from "../Panel";

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
  const chrome = usePanelChromeColors();

  // Strip HTML tags for length check
  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, " ");
  };

  const descriptionText = stripHtml(description);
  const shouldShowToggle = descriptionText.length > 256;

  return (
    <Panel style={styles.card}>
      <PanelHeader title="Beskrivelse" style={styles.header} />

      <View
        style={[
          styles.contentContainer,
          !descriptionExpanded && shouldShowToggle && styles.collapsedContent,
        ]}
      >
        <HTML
          source={{ html: description }}
          contentWidth={screenWidth - 62}
          baseStyle={{ ...styles.htmlBase, color: chrome.text }}
          tagsStyles={{ a: { color: chrome.accent } }}
        />
      </View>

      {shouldShowToggle && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityState={{ expanded: descriptionExpanded }}
          onPress={onToggleDescription}
          style={styles.toggleButton}
        >
          <Text style={[styles.toggleText, { color: chrome.text }]}>
            {descriptionExpanded ? "Vis mindre" : "Les mer"}
          </Text>
          <MaterialCommunityIcons
            name={descriptionExpanded ? "chevron-up" : "chevron-down"}
            size={18}
            color={chrome.icon}
          />
        </TouchableOpacity>
      )}
    </Panel>
  );
};

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 15,
    paddingTop: 13,
    paddingBottom: 5,
  },
  header: { marginBottom: 6 },
  contentContainer: {
    // No constraints when expanded - content decides height
  },
  collapsedContent: {
    maxHeight: 110, // five lines of htmlBase
    overflow: "hidden",
  },
  toggleButton: {
    minHeight: 40,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  toggleText: { fontSize: 13, fontWeight: "700" },
  htmlBase: {
    fontSize: 15,
    lineHeight: 22,
  },
});

export default DescriptionCard;
