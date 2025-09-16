import { Stack } from "expo-router";

export default function GamesLayout() {
  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        headerLargeTitleStyle: {
          fontSize: 28,
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerTitle: "Spill",
        }}
      />
    </Stack>
  );
}
