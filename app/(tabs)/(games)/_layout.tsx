import { Stack } from "expo-router";
import { Platform, useColorScheme } from "react-native";

export default function GamesLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        headerLargeTitleStyle: {
          fontSize: 28,
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerTitle: "Spill",
          headerLargeTitle: true,
          headerShadowVisible: false,
          headerBlurEffect: undefined,
          headerTransparent: Platform.OS === "ios",
          headerLargeTitleShadowVisible: false,
          headerTitleStyle: {
            color: isDark ? "#ffffff" : "#000000",
          },
          headerLargeTitleStyle: {
            color: isDark ? "#ffffff" : "#000000",
          },
        }}
      />
      <Stack.Screen
        name="spinline"
        options={{
          headerTitle: "SpinLine",
          headerLargeTitle: false,
          headerBackButtonDisplayMode: "minimal",
          headerTransparent: Platform.OS === "ios",
          headerTitleStyle: {
            color: isDark ? "#ffffff" : "#000000",
          },
          headerLargeTitleStyle: {
            color: isDark ? "#ffffff" : "#000000",
          },
          headerTintColor: isDark ? "#ffffff" : "#000000",
        }}
      />
    </Stack>
  );
}
