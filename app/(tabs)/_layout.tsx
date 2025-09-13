import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { isLiquidGlassSupported } from "@callstack/liquid-glass";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  const liquidGlassStyles =
    Platform.OS === "ios" && isLiquidGlassSupported
      ? {
          tabBarStyle: {
            position: "absolute" as const,
            backgroundColor: "transparent",
            borderTopWidth: 0,
            elevation: 0,
          },
          tabBarBackground: () => null,
        }
      : {};

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#8E8E93",
        headerShown: false,
        ...liquidGlassStyles,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
