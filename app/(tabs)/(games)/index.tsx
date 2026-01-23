import { LiquidGlassView } from "@callstack/liquid-glass";
import { useRouter } from "expo-router";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
} from "react-native";
import { TabScreenContainer } from "../../../components/TabScreenContainer";
import { useTheme } from "../../../utils/theme";

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
    description: "Online sin vri på spin-the-bottle",
    route: "/spinline", // Adjust this to your actual route
  },
  {
    id: "dice",
    title: "Terning",
    description: "Kast en terning. Helt uten reklamer!",
    route: "/dice",
  },
];

export default function GamesScreen() {
  const theme = useTheme();
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
      <LiquidGlassView style={[styles.gameItem, { backgroundColor: theme.surfaceContainer }]}>
        <Text style={[styles.gameTitle, { color: theme.onSurface }]}>
          {item.title}
        </Text>
        <Text
          style={[styles.gameDescription, { color: theme.onSurfaceVariant }]}
        >
          {item.description}
        </Text>
      </LiquidGlassView>
    </Pressable>
  );

  return (
    <TabScreenContainer>
      <FlatList
        data={games}
        keyExtractor={(item) => item.id}
        renderItem={renderGameItem}
        contentInsetAdjustmentBehavior="automatic"
        style={{
          flex: 1,
          backgroundColor: theme.background,
        }}
        contentContainerStyle={{
          padding: 20,
        }}
        showsVerticalScrollIndicator={false}
      />
    </TabScreenContainer>
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
