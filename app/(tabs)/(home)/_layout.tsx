import { Stack } from "expo-router";
import { useSegments, useGlobalSearchParams } from "expo-router";
import Header from "../../../components/Header";

export default function HomeLayout() {

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
