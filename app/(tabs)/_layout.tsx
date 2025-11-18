import { Tabs } from "expo-router";
import { Ionicons, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../utils/theme";

type TabIconProps = { color: string; size?: number };

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.secondary ?? theme.primary,
        tabBarInactiveTintColor: theme.outline ?? "#999999",
        tabBarStyle: { backgroundColor: theme.surface },
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
