// import { LiquidGlassView } from "@callstack/liquid-glass";
// import {
//   Button,
//   ScrollView,
//   StyleSheet,
//   Text,
//   useColorScheme,
//   View,
//   Alert,
// } from "react-native";
// import { useEffect, useState } from "react";
// import Authenticator from "../../../utils/authenticator"; // Update this path
// import * as Linking from "expo-linking";

// export default function ProfileScreen() {
//   const colorScheme = useColorScheme();
//   const isDark = colorScheme === "dark";
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);

//   useEffect(() => {
//     // Listen for any URL changes/redirects
//     const subscription = Linking.addEventListener("url", (event) => {
//       console.log("🔗 URL event received:", event.url);
//     });

//     // Check initial URL
//     Linking.getInitialURL().then((url) => {
//       if (url) {
//         console.log("🔗 Initial URL:", url);
//       }
//     });

//     return () => subscription?.remove();
//   }, []);

//   useEffect(() => {
//     // Initialize Auth0 when component mounts
//     // Replace with your actual Auth0 domain and client ID
//     Authenticator.initialize(
//       "auth.online.ntnu.no",
//       "EniGfQ4MlcVuS2FWbUMmCjaFB65EqjzZ"
//     );

//     // Check if already logged in
//     checkLoginStatus();

//     // Listen to login state changes
//     const removeListener = Authenticator.addLoginStateListener((loggedIn) => {
//       setIsLoggedIn(loggedIn);
//     });

//     return removeListener; // Cleanup listener on unmount
//   }, []);

//   const checkLoginStatus = async () => {
//     try {
//       const credentials = await Authenticator.fetchStoredCredentials();
//       setIsLoggedIn(!!credentials);
//     } catch (error) {
//       console.log("Error checking login status:", error);
//     }
//   };

//   const handleLogin = async () => {
//     setIsLoading(true);
//     try {
//       console.log("🔄 Starting login...");
//       const credentials = await Authenticator.login();

//       if (credentials) {
//         console.log("✅ Login successful!");
//         Alert.alert("Success", "You have been logged in successfully!");
//       } else {
//         console.log("❌ Login failed or was cancelled");
//         Alert.alert("Login Failed", "Login was unsuccessful or cancelled.");
//       }
//     } catch (error) {
//       console.error("Login error:", error);
//       Alert.alert("Error", "An error occurred during login.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleLogout = async () => {
//     setIsLoading(true);
//     try {
//       await Authenticator.logout();
//       Alert.alert("Logged Out", "You have been logged out successfully.");
//     } catch (error) {
//       console.error("Logout error:", error);
//       Alert.alert("Error", "An error occurred during logout.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <ScrollView
//       contentInsetAdjustmentBehavior="automatic"
//       style={{ backgroundColor: isDark ? "#000" : "#fff" }}
//     >
//       <View
//         style={{
//           padding: 20,
//           height: 1000,
//           backgroundColor: isDark ? "#000" : "#fff",
//         }}
//       >
//         <Text style={[styles.statusText, { color: isDark ? "#fff" : "#000" }]}>
//           Status: {isLoggedIn ? "Logged In" : "Logged Out"}
//         </Text>

//         {!isLoggedIn ? (
//           <Button
//             title={isLoading ? "Logging In..." : "Logg Inn"}
//             onPress={handleLogin}
//             disabled={isLoading}
//           />
//         ) : (
//           <Button
//             title={isLoading ? "Logging Out..." : "Logg Ut"}
//             onPress={handleLogout}
//             disabled={isLoading}
//           />
//         )}

//         {isLoggedIn && (
//           <View style={styles.userInfo}>
//             <Text
//               style={[styles.userInfoText, { color: isDark ? "#fff" : "#000" }]}
//             >
//               Access Token:{" "}
//               {Authenticator.getAccessToken() ? "Available" : "Not available"}
//             </Text>
//           </View>
//         )}
//       </View>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   gameItem: {
//     padding: 16,
//     marginBottom: 12,
//     borderRadius: 8,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//     elevation: 2,
//   },
//   gameTitle: {
//     fontSize: 18,
//     fontWeight: "600",
//     marginBottom: 4,
//   },
//   gameDescription: {
//     fontSize: 14,
//     color: "#666",
//     lineHeight: 20,
//   },
//   statusText: {
//     fontSize: 16,
//     fontWeight: "600",
//     marginBottom: 20,
//     textAlign: "center",
//   },
//   userInfo: {
//     marginTop: 20,
//     padding: 15,
//     borderRadius: 8,
//     backgroundColor: "#f0f0f0",
//   },
//   userInfoText: {
//     fontSize: 14,
//     marginBottom: 5,
//   },
// });

import { LiquidGlassView } from "@callstack/liquid-glass";
import {
  Button,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Alert,
  Image,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useEffect, useState } from "react";
import Authenticator from "../../../utils/authenticator";
import { getUser } from "utils/trpc"; // You'll need to create this
import { User } from "types/user";
import { useTheme } from "../../../utils/theme";
import { TabScreenContainer } from "../../../components/TabScreenContainer";

export default function ProfileScreen() {
  const theme = useTheme();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize Auth0 when component mounts
    Authenticator.initialize(
      "auth.online.ntnu.no",
      "EniGfQ4MlcVuS2FWbUMmCjaFB65EqjzZ"
    );

    // Check if already logged in
    checkLoginStatus();

    // Listen to login state changes
    const removeListener = Authenticator.addLoginStateListener((loggedIn) => {
      setIsLoggedIn(loggedIn);
      if (loggedIn) {
        loadUserProfile();
      } else {
        setUser(null);
        setError(null);
      }
    });

    return removeListener;
  }, []);

  const checkLoginStatus = async () => {
    try {
      const credentials = await Authenticator.fetchStoredCredentials();
      const isAuthenticated = !!credentials;
      setIsLoggedIn(isAuthenticated);

      if (isAuthenticated) {
        loadUserProfile();
      }
    } catch (error) {
      console.log("Error checking login status:", error);
      setError("Failed to check login status");
    }
  };

  const loadUserProfile = async () => {
    try {
      setError(null);
      const userProfile = Authenticator.user ?? (await getUser());
      setUser(userProfile);
    } catch (error) {
      console.error("Error loading user profile:", error);
      setError("Failed to load profile");
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      console.log("🔄 Starting login...");
      const credentials = await Authenticator.login();

      if (credentials) {
        console.log("✅ Login successful!");
        // Profile will load automatically via the listener
      } else {
        console.log("❌ Login failed or was cancelled");
        Alert.alert("Login Failed", "Login was unsuccessful or cancelled.");
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "An error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await Authenticator.logout();
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "An error occurred during logout.");
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadUserProfile();
    setIsRefreshing(false);
  };

  const formatMembershipType = (type: string) => {
    return type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatSpecialization = (spec: string | null) => {
    if (!spec) return "Not specified";
    return spec
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (!isLoggedIn) {
    return (
      <TabScreenContainer>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={[
            styles.container,
            { backgroundColor: theme.background },
          ]}
        >
          <View style={styles.content}>
            <Text style={[styles.title, { color: theme.onBackground }]}>
              Velkommen til Online-Appen!
            </Text>
            <Text style={[styles.subtitle, { color: theme.onSurfaceVariant }]}>
              Vennligst logg inn for å se og administrere profilen din.
            </Text>

            <TouchableOpacity
              style={[styles.loginButton, { opacity: isLoading ? 0.6 : 1 }]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? "Logger Inn..." : "Logg Inn"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TabScreenContainer>
    );
  }

  return (
    <TabScreenContainer>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={[styles.container, { backgroundColor: theme.background }]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          {error && (
            <View
              style={[
                styles.errorContainer,
                { backgroundColor: theme.errorContainer },
              ]}
          >
            <Text
              style={[
                styles.errorText,
                { color: theme.onErrorContainer },
              ]}
            >
              {error}
            </Text>
            <TouchableOpacity
              onPress={loadUserProfile}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>Prøv igjen</Text>
            </TouchableOpacity>
          </View>
        )}

        {user ? (
          <>
            {/* Profile Header */}
            <View
              style={[
                styles.profileHeader,
                { backgroundColor: theme.surfaceContainer },
              ]}
            >
              {user.imageUrl ? (
                <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
              ) : (
                <View
                  style={[
                    styles.avatarPlaceholder,
                    { backgroundColor: theme.surfaceVariant },
                  ]}
                >
                  <Text
                    style={[
                      styles.avatarText,
                      { color: theme.onSurfaceVariant },
                    ]}
                  >
                    {user.name?.charAt(0)?.toUpperCase() ||
                      user.email?.charAt(0)?.toUpperCase() ||
                      "?"}
                  </Text>
                </View>
              )}

              <Text style={[styles.name, { color: theme.onBackground }]}>
                {user.name || "Unknown User"}
              </Text>

              <Text style={[styles.email, { color: theme.onSurfaceVariant }]}>
                {user.email}
              </Text>

              <Text
                style={[
                  styles.profileSlug,
                  { color: theme.onSurfaceVariant },
                ]}
              >
                @{user.profileSlug}
              </Text>
            </View>

            {/* Biography */}
            {user.biography && (
              <View
                style={[
                  styles.section,
                  { backgroundColor: theme.surfaceContainer },
                ]}
              >
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: theme.onBackground },
                  ]}
                >
                  Biografi
                </Text>
                <Text
                  style={[
                    styles.sectionContent,
                    { color: theme.onSurfaceVariant },
                  ]}
                >
                  {user.biography}
                </Text>
              </View>
            )}

            {/* Personal Information */}
            <View
              style={[
                styles.section,
                { backgroundColor: theme.surfaceContainer },
              ]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.onBackground },
                ]}
              >
                Personlig Informasjon
              </Text>

              {user.phone && (
                <View style={styles.infoRow}>
                  <Text
                    style={[
                      styles.infoLabel,
                      { color: theme.onSurfaceVariant },
                    ]}
                  >
                    Telefonnummer:
                  </Text>
                  <Text
                    style={[
                      styles.infoValue,
                      { color: theme.onBackground },
                    ]}
                  >
                    {user.phone}
                  </Text>
                </View>
              )}

              {user.gender && (
                <View style={styles.infoRow}>
                  <Text
                    style={[
                      styles.infoLabel,
                      { color: theme.onSurfaceVariant },
                    ]}
                  >
                    Kjønn:
                  </Text>
                  <Text
                    style={[
                      styles.infoValue,
                      { color: theme.onBackground },
                    ]}
                  >
                    {user.gender}
                  </Text>
                </View>
              )}

              {user.dietaryRestrictions && (
                <View style={styles.infoRow}>
                  <Text
                    style={[
                      styles.infoLabel,
                      { color: theme.onSurfaceVariant },
                    ]}
                  >
                    Dietære Restriksjoner:
                  </Text>
                  <Text
                    style={[
                      styles.infoValue,
                      { color: theme.onBackground },
                    ]}
                  >
                    {user.dietaryRestrictions}
                  </Text>
                </View>
              )}

              {user.ntnuUsername && (
                <View style={styles.infoRow}>
                  <Text
                    style={[
                      styles.infoLabel,
                      { color: theme.onSurfaceVariant },
                    ]}
                  >
                    NTNU Brukernavn:
                  </Text>
                  <Text
                    style={[
                      styles.infoValue,
                      { color: theme.onBackground },
                    ]}
                  >
                    {user.ntnuUsername}
                  </Text>
                </View>
              )}
            </View>

            {/* Memberships */}
            {user.memberships && user.memberships.length > 0 && (
              <View
                style={[
                  styles.section,
                  { backgroundColor: theme.surfaceContainer },
                ]}
              >
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: theme.onBackground },
                  ]}
                >
                  Medlemskap ({user.memberships.length})
                </Text>

                {user.memberships.map((membership, index) => (
                  <View
                    key={membership.id}
                    style={[
                      styles.membershipCard,
                      { backgroundColor: theme.surfaceContainerHigh },
                    ]}
                  >
                    <Text style={[styles.membershipType, { color: theme.secondary }]}>
                      {formatMembershipType(membership.type)}
                    </Text>

                    <Text
                      style={[
                        styles.membershipSpec,
                        { color: theme.onSurfaceVariant },
                      ]}
                    >
                      {formatSpecialization(membership.specialization)}
                    </Text>

                    <Text
                      style={[
                        styles.membershipDates,
                        { color: theme.onSurfaceVariant },
                      ]}
                    >
                      {new Date(membership.start).toLocaleDateString()} -{" "}
                      {new Date(membership.end).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Flags */}
            {/* {user.flags && user.flags.length > 0 && (
              <View
                style={[
                  styles.section,
                  { backgroundColor: isDark ? "#111" : "#f8f9fa" },
                ]}
              >
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: isDark ? "#fff" : "#000" },
                  ]}
                >
                  Flagg
                </Text>
                <View style={styles.flagsContainer}>
                  {user.flags.map((flag, index) => (
                    <View
                      key={index}
                      style={[
                        styles.flag,
                        { backgroundColor: isDark ? "#333" : "#e3f2fd" },
                      ]}
                    >
                      <Text style={[styles.flagText, { color: "#fab759" }]}>
                        {flag}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )} */}

            {/* Account Information */}
            <View
              style={[
                styles.section,
                { backgroundColor: theme.surfaceContainer },
              ]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.onBackground },
                ]}
              >
                Kontoinformasjon
              </Text>

              <View style={styles.infoRow}>
                <Text
                  style={[
                    styles.infoLabel,
                    { color: theme.onSurfaceVariant },
                  ]}
                >
                  Studieår
                </Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: theme.onBackground },
                  ]}
                >
                  {new Date(user.createdAt).toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text
                  style={[
                    styles.infoLabel,
                    { color: theme.onSurfaceVariant },
                  ]}
                >
                  Medlem siden:
                </Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: theme.onBackground },
                  ]}
                >
                  {new Date(user.createdAt).toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text
                  style={[
                    styles.infoLabel,
                    { color: theme.onSurfaceVariant },
                  ]}
                >
                  Sist oppdatert:
                </Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: theme.onBackground },
                  ]}
                >
                  {new Date(user.updatedAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.loadingContainer}>
            <Text
              style={[styles.loadingText, { color: theme.onSurfaceVariant }]}
            >
              Laster profil...
            </Text>
          </View>
        )}

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: theme.deregisterButton, opacity: isLoading ? 0.6 : 1 }]}
          onPress={handleLogout}
          disabled={isLoading}
        >
          <Text style={[styles.logoutButtonText, { color: theme.onDeregisterButton }]}>
            {isLoading ? "Logger Ut..." : "Logg Ut"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </TabScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 40,
  },
  profileHeader: {
    alignItems: "center",
    padding: 24,
    borderRadius: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "600",
  },
  name: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    marginBottom: 4,
  },
  profileSlug: {
    fontSize: 14,
    fontStyle: "italic",
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    flex: 1,
    textAlign: "right",
  },
  membershipCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  membershipType: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  membershipSpec: {
    fontSize: 14,
    marginBottom: 4,
  },
  membershipDates: {
    fontSize: 12,
  },
  flagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  flag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  flagText: {
    fontSize: 12,
    fontWeight: "500",
  },
  loginButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: "center",
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  errorContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  errorText: {
    flex: 1,
    fontSize: 14,
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
  },
});
