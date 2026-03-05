import { Stack, useSegments } from "expo-router";
import Header from "../../../components/Header";
import { useTheme } from "../../../utils/theme";

export default function ProfileLayout() {
  const segments = useSegments();
  const current = segments[segments.length - 1] ?? "index";
  const theme = useTheme();

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
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        <Stack.Screen name="index" />
      </Stack>
    </>
  );
}
