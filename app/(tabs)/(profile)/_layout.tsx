import { Stack, useSegments } from "expo-router";
import Header from "../../../components/Header";

export default function ProfileLayout() {
  const segments = useSegments();
  const current = segments[segments.length - 1] ?? "index";
  const titleMap: Record<string, string> = { index: "Profil" };
  const title = titleMap[current] ?? "Profil";

  return (
    <>
      <Header title={title} />
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          animation: "default",
        }}
      >
        <Stack.Screen name="index" />
      </Stack>
    </>
  );
}
