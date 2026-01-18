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
      <Header title={title} />
      {/* Stack provides native navigation with swipe gestures */}
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: true, // Native swipe-back on iOS
          animation: "default", // Native transitions
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="spinline" />
        <Stack.Screen name="dice" />
      </Stack>
    </>
  );
}
