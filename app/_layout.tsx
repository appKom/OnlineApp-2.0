import { Stack, Redirect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import Authenticator from "../utils/authenticator";
import { useTheme } from "../utils/theme"

// Set notification handler for when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export default function RootLayout() {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  const theme = useTheme();

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    // Listen for notification responses (when user taps notification)
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const eventId = response.notification.request.content.data?.eventId as string;
      const headerTitle = response.notification.request.content.data?.eventTitle as string;
      if (eventId) {
        router.push({
          pathname: "/event-details",
          params: {
            eventId: eventId,
            headerTitle: headerTitle,
          },
        });
      }
    });

    return () => subscription.remove();
  }, [router]);

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
