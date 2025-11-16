import { Stack } from "expo-router";
import { useColorScheme } from "react-native";
import { useSegments, useGlobalSearchParams } from "expo-router";
import { getTheme, ThemeMode } from "../../../utils/theme";
import Header from "../../../components/Header";

export default function HomeLayout() {
  const colorScheme = (useColorScheme() as ThemeMode) || "light";
  const theme = getTheme(colorScheme);

  const { headerTitle } = useGlobalSearchParams<{ headerTitle?: string }>();

  const segments = useSegments();
  const current = segments[segments.length - 1] ?? "index";

  const titleMap: Record<string, string> = {
    index: "Arrangementer",
  };

  const title = headerTitle ?? titleMap[current] ?? "Arrangementer";

  return (
    <>
      <Header title={title} />

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="event-details" />
      </Stack>
    </>
  );
}
