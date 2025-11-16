import { Stack, useSegments } from "expo-router";
import { useColorScheme } from "react-native";
import { getTheme, ThemeMode } from "../../../utils/theme";
import Header from "../../../components/Header";

export default function ProfileLayout() {
  const colorScheme = (useColorScheme() as ThemeMode) || "light";
  const theme = getTheme(colorScheme);

  const segments = useSegments();
  const current = segments[segments.length - 1] ?? "index";
  const titleMap: Record<string, string> = { index: "Profil" };
  const title = titleMap[current] ?? "Profil";

  return (
    <>
      <Header title={title} />

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
    </>
  );
}
