import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";
import { Ionicons, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
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
          animation: "none",
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <MaterialIcons name="event" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="(games)"
        options={{
          title: "Spill",
          animation: "none",
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <FontAwesome6 name="dice" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="(profile)"
        options={{
          title: "Profil",
          animation: "none",
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <Ionicons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
