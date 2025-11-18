import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "utils/theme";
import HTML from "react-native-render-html";
import { LiquidGlassView } from "@callstack/liquid-glass";

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
  const colors = {
    cardBackground: theme.secondaryContainer,
    textPrimary: theme.onTertiaryContainer,
    textSecondary: theme.onSecondaryContainer,
    toggleText: theme.onTertiaryContainer,
    toggleTextBackground: theme.tertiaryContainer,
  };

  // Strip HTML tags for length check
  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, " ");
  };

  const descriptionText = stripHtml(description);
  const shouldShowToggle = descriptionText.length > 256;

  return (
    <LiquidGlassView
        style={[styles.card, { backgroundColor: colors.cardBackground }]}
    >
      <TouchableOpacity
        key={`description-${descriptionExpanded}`}
        onPress={shouldShowToggle ? onToggleDescription : () => {}}
        activeOpacity={shouldShowToggle ? 0.7 : 1}
        style={styles.touchableContent}
      >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}> 
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
            baseStyle={{ ...styles.htmlBase, color: colors.textSecondary }}
          />
        </View>

        {shouldShowToggle && (
          <Text style={[styles.toggleText, { color: colors.toggleText, backgroundColor: colors.toggleTextBackground }]}>
            {descriptionExpanded ? "Vis mindre" : "Les mer..."}
          </Text>
        )}
      </TouchableOpacity>
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
  touchableContent: {
    // No additional padding needed since parent handles it
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
  toggleText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: "hidden",
    alignSelf: "flex-start",
  },
  htmlBase: {
    fontSize: 16,
    lineHeight: 24,
  },
});

export default DescriptionCard;
