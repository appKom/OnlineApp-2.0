import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getTheme, ThemeMode } from "../../utils/theme";

type TabIconProps = { color: string; size?: number };

export default function TabLayout() {
  const colorScheme = (useColorScheme() as ThemeMode) || "light";
  const theme = getTheme(colorScheme);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.secondary ?? theme.primary,
        tabBarInactiveTintColor: theme.outline ?? "#999999",
        tabBarStyle: { backgroundColor: theme.surface ?? (colorScheme === "dark" ? "#000" : "#fff") },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: "Hjem",
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="(games)"
        options={{
          title: "Spill",
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <Ionicons name="game-controller-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="(profile)"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
