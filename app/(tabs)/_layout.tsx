import { withLayoutContext } from "expo-router";
import { createNativeBottomTabNavigator } from "@bottom-tabs/react-navigation";
import { useColorScheme } from "react-native";

const BottomTabNavigator = createNativeBottomTabNavigator().Navigator;
const Tabs = withLayoutContext(BottomTabNavigator);

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#fab759", // Your primary accent color
        tabBarInactiveTintColor: "#999999", // Inactive tab color
        tabBarStyle: {
          backgroundColor: isDark ? "#000000" : "#ffffff",
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: "Hjem",
          tabBarIcon: () => ({ sfSymbol: "house" }),
        }}
      />
      <Tabs.Screen
        name="(games)"
        options={{
          title: "Spill",
          tabBarIcon: () => ({ sfSymbol: "dice" }),
        }}
      />
    </Tabs>
  );
}
