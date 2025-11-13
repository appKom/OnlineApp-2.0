import { Stack } from "expo-router";
import { Platform, useColorScheme } from "react-native";
import Header from "../../../components/Header";

export default function ProfileLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <>
      <Header title="Profil" />
      <Stack
      screenOptions={{
        headerShown: false,
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
          headerTitle: "Profil",
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
      </Stack>
    </>
  );
}
