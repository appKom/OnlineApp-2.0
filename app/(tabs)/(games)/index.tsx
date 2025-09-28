import { LiquidGlassView } from "@callstack/liquid-glass";
import { useRouter } from "expo-router";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
} from "react-native";

// Define the game data structure
interface Game {
  id: string;
  title: string;
  description: string;
  route: string; // The route to navigate to
}

// Game data - you can expand this array with more games
const games: Game[] = [
  {
    id: "spinline",
    title: "SpinLine",
    description: "An engaging spinning line game with challenging gameplay",
    route: "/spinline", // Adjust this to your actual route
  },
];

export default function GamesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  const renderGameItem = ({ item }: { item: Game }) => (
    <Pressable
      onPress={() => router.push(item.route as any)}
      style={({ pressed }) => [
        {
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <LiquidGlassView style={styles.gameItem}>
        <Text style={[styles.gameTitle, { color: isDark ? "#fff" : "#000" }]}>
          {item.title}
        </Text>
        <Text
          style={[styles.gameDescription, { color: isDark ? "#ccc" : "#666" }]}
        >
          {item.description}
        </Text>
      </LiquidGlassView>
    </Pressable>
  );

  return (
    <FlatList
      data={games}
      keyExtractor={(item) => item.id}
      renderItem={renderGameItem}
      contentInsetAdjustmentBehavior="automatic"
      style={{
        flex: 1,
        backgroundColor: isDark ? "#000" : "#fff",
      }}
      contentContainerStyle={{
        padding: 20,
      }}
      showsVerticalScrollIndicator={false}
    />
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
    lineHeight: 20,
  },
});
