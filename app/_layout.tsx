import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Authenticator from "../utils/authenticator";
import { ActivityIndicator } from "react-native";
import { getUser } from "utils/trpc";

export default function RootLayout() {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Initialize Auth0
      Authenticator.initialize(
        "auth.online.ntnu.no",
        "EniGfQ4MlcVuS2FWbUMmCjaFB65EqjzZ"
      );

      // Listen to auth state changes
      const removeListener = Authenticator.addLoginStateListener(setIsLoggedIn);

      // Check for stored credentials (this will auto-refresh if needed)
      const storedCredentials = await Authenticator.fetchStoredCredentials();

      console.log(
        storedCredentials ? "✅ User is logged in" : "ℹ️ User needs to log in"
      );

      console.log(storedCredentials?.idToken);

      setIsAuthReady(true);

      await getUser();

      return removeListener;
    } catch (error) {
      console.log("❌ Auth initialization error:", error);
      setIsAuthReady(true);
    }
  };

  if (!isAuthReady) {
    return <ActivityIndicator />; // Show loading while checking auth
  }

  return (
    <>
      <SafeAreaProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </>
  );
}

// // api.ts
// import Authenticator from './authenticator';

// export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
//   try {
//     // Get the current access token (automatically refreshed if needed!)
//     const accessToken = await Authenticator.getAccessToken();

//     if (!accessToken) {
//       throw new Error('No access token available');
//     }

//     const response = await fetch(`https://your-api.com${endpoint}`, {
//       ...options,
//       headers: {
//         ...options.headers,
//         'Authorization': `Bearer ${accessToken}`,
//         'Content-Type': 'application/json',
//       },
//     });

//     if (response.status === 401) {
//       // Token might be invalid, force logout
//       await Authenticator.logout();
//       throw new Error('Authentication failed');
//     }

//     return response.json();
//   } catch (error) {
//     console.error('API call failed:', error);
//     throw error;
//   }
// };
