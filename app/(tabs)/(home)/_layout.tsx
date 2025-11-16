import { Stack } from "expo-router";
import { useColorScheme } from "react-native";
import { useNavigationState } from "@react-navigation/native";
import { getTheme, ThemeMode } from "../../../utils/theme";
import Header from "../../../components/Header";

export default function HomeLayout() {
  const colorScheme = (useColorScheme() as ThemeMode) || "light";
  const theme = getTheme(colorScheme);

  // read the active route params from the navigator's state and prefer a headerTitle param
  const headerTitle = useNavigationState((state: any) => {
    if (!state || !state.routes) return undefined;
    const route = state.routes[state.index ?? state.routes.length - 1] ?? {};
    return route?.params?.headerTitle as string | undefined;
  });

  const segments = (headerTitle ? ["event-details"] : []) as string[];
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
