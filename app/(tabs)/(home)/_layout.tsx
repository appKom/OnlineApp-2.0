import { Stack } from "expo-router";
import { Platform, useColorScheme } from "react-native";
import Header from "../../../components/Header";

export default function HomeLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <>
      <Header title="Arrangementer" />
      <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          headerTitle: "Arrangementer",
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
        name="event-details"
        options={{
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
    </>
  );
}
