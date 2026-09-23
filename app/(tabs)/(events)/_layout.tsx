import { Stack, useSegments } from "expo-router";
import Header from "../../../components/Header";
import { useTheme } from "../../../utils/theme";

export default function HomeLayout() {
  const segments = useSegments();
  const current = segments[segments.length - 1] ?? "index";
  const theme = useTheme();

  return (
    <>
      {current !== "event-details" && <Header title="Arrangementer" />}
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          animation: "default",
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="event-details" />
      </Stack>
    </>
  );
}
