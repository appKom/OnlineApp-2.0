import { Stack, useSegments } from "expo-router";
import Header from "../../../components/Header";
import { useTheme } from "../../../utils/theme";

export default function GamesLayout() {
  const segments = useSegments();
  const current = segments[segments.length - 1] ?? "index";
  const theme = useTheme();

  const titleMap: Record<string, string> = {
    index: "Spill",
    spinline: "SpinLine",
    dice: "Terning",
    roulette: "Roulette",
  };
  const title = titleMap[current] ?? "Spill";

  return (
    <>
      <Header title={title} />
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          animation: "default",
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="spinline" />
        <Stack.Screen name="dice" />
        <Stack.Screen name="roulette" />
      </Stack>
    </>
  );
}
