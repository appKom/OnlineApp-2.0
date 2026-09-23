import { Stack } from "expo-router";
import { useThemeMode } from "../../../utils/theme";

export default function GamesLayout() {
  const { mode } = useThemeMode();
  const backgroundColor = mode === "dark" ? "#043728" : "#07523A";

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: "default",
        contentStyle: { backgroundColor },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="spinline" />
      <Stack.Screen name="dice" />
      <Stack.Screen name="roulette" />
      <Stack.Screen name="questions_100" />
      <Stack.Screen name="bunken" />
    </Stack>
  );
}
