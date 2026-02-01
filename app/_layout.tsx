import { Stack, Redirect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Authenticator from "../utils/authenticator";
import { useTheme } from "../utils/theme"

export default function RootLayout() {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const theme = useTheme();

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      Authenticator.initialize(
        "auth.online.ntnu.no",
        "EniGfQ4MlcVuS2FWbUMmCjaFB65EqjzZ",
      );

      const removeListener = Authenticator.addLoginStateListener(setIsLoggedIn);
      const storedCredentials = await Authenticator.fetchStoredCredentials();

      console.log(
        storedCredentials ? "✅ User is logged in" : "ℹ️ User needs to log in",
      );

      setIsAuthReady(true);
      return removeListener;
    } catch (error) {
      console.log("❌ Auth initialization error:", error);
      setIsAuthReady(true);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: theme.background},
            headerShown: false,
          }}
        >
          <Stack.Screen name="(tabs)" />
        </Stack>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
