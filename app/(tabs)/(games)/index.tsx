import { LiquidGlassView } from "@callstack/liquid-glass";
import {
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

export default function GamesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: isDark ? "#000" : "#fff" }}
    >
      <View
        style={{
          padding: 20,
          height: 1000,
          backgroundColor: isDark ? "#000" : "#fff",
        }}
      >
        {Array.from({ length: 20 }, (_, i) => (
          <LiquidGlassView key={i} style={styles.gameItem}>
            <Text
              style={[styles.gameTitle, { color: isDark ? "#fff" : "#000" }]}
            >
              Game {i + 1}
            </Text>
            <Text
              style={[
                styles.gameDescription,
                { color: isDark ? "#fff" : "#000" },
              ]}
            >
              Description for game {i + 1}. This is a sample game with some
              details.
            </Text>
          </LiquidGlassView>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  gameItem: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  gameDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
});
