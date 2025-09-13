import { View, Text, StyleSheet, PlatformColor } from "react-native";
import {
  LiquidGlassView,
  isLiquidGlassSupported,
} from "@callstack/liquid-glass";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to iOS 26</Text>

        <LiquidGlassView
          style={[
            styles.glassCard,
            !isLiquidGlassSupported && styles.fallbackCard,
          ]}
          interactive
          effect="clear"
        >
          <Text style={{ color: PlatformColor("labelColor") }}>
            This is a Liquid Glass card
          </Text>
          <Text style={{ color: PlatformColor("secondaryLabelColor") }}>
            Automatically adapts to background
          </Text>
        </LiquidGlassView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#000",
  },
  glassCard: {
    width: 280,
    height: 120,
    borderRadius: 20,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
  },
  fallbackCard: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
});
