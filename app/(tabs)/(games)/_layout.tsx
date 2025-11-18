import { Stack, useSegments } from "expo-router";
import Header from "../../../components/Header";

export default function GamesLayout() {

  const segments = useSegments();
  const current = segments[segments.length - 1] ?? "index";
  const titleMap: Record<string, string> = {
    index: "Spill",
    spinline: "SpinLine",
    dice: "Terning",
  };
  const title = titleMap[current] ?? "Spill";

  return (
    <>
      {/* Static header placed outside the Stack so it won't animate with screen transitions */}
      <Header title={title} />

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="spinline" />
        <Stack.Screen name="dice" />
      </Stack>
    </>
  );
}
