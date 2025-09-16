import { Stack } from "expo-router";
import { Platform } from "react-native";

export default function HomeLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerTitle: "Arrangementer",
          headerLargeTitle: true,
          headerShadowVisible: false,
          headerBlurEffect: undefined,
          headerTransparent: Platform.OS === "ios",
          headerLargeTitleShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="event-details"
        options={{
          // headerTitle: "Arrangement",
          // headerLargeTitle: true,
          headerBackButtonDisplayMode: "minimal",
          headerShadowVisible: false,
          headerBlurEffect: undefined,
          // headerBlurEffect: Platform.OS === "ios" ? "regular" : undefined,
          headerTransparent: Platform.OS === "ios",
          headerLargeTitleShadowVisible: false,
        }}
      />
    </Stack>
  );
}
