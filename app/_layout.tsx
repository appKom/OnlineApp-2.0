import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import * as SystemUI from "expo-system-ui";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavThemeProvider,
} from "@react-navigation/native";
import Authenticator from "../utils/authenticator";
import { ThemeProvider, useTheme, useThemeMode } from "../utils/theme";
import { requestTrackingPermissionsAsync } from "expo-tracking-transparency";
import { Platform } from "react-native";

SystemUI.setBackgroundColorAsync("#0F1417");

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function RootLayoutInner() {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const theme = useTheme();
  const { mode } = useThemeMode();

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const eventId = response.notification.request.content.data
          ?.eventId as string;
        const headerTitle = response.notification.request.content.data
          ?.eventTitle as string;
        if (eventId) {
          router.push({
            pathname: "/event-details",
            params: {
              eventId: eventId,
              headerTitle: headerTitle,
            },
          });
        }
      },
    );

    return () => subscription.remove();
  }, [router]);

  useEffect(() => {
    const requestATT = async () => {
      if (Platform.OS !== "ios") return;

      // Small delay prevents conflicts with other system dialogs (e.g. push notifications)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // iOS remembers the answer — calling this again never re-shows the popup
      const { status } = await requestTrackingPermissionsAsync();
      console.log("Tracking permission status:", status);
      // status: 'granted' | 'denied' | 'restricted' | 'undetermined'
    };

    requestATT();
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
    <NavThemeProvider value={mode === "dark" ? DarkTheme : DefaultTheme}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <Stack
            screenOptions={{
              contentStyle: { backgroundColor: theme.background },
              headerShown: false,
            }}
          >
            <Stack.Screen name="(tabs)" />
          </Stack>
          <StatusBar style={mode === "dark" ? "light" : "dark"} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutInner />
    </ThemeProvider>
  );
}
