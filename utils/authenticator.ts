import Auth0, { Credentials } from "react-native-auth0";
import { Platform } from "react-native";
import { User } from "types/user";
import { getUser } from "./trpc";

type StateListener = (isLoggedIn: boolean) => void;

class Authenticator {
  private static auth0: Auth0 | null = null;
  private static credentials: Credentials | null = null;
  private static _loggedIn: boolean = false;
  private static listeners: StateListener[] = [];
  public static user: User | null = null;

  static get loggedIn(): boolean {
    return this._loggedIn;
  }

  private static setLoggedIn(value: boolean) {
    if (this._loggedIn !== value) {
      this._loggedIn = value;
      console.log(
        `🔐 Login state changed: ${value ? "LOGGED IN" : "LOGGED OUT"}`
      );
      this.listeners.forEach((listener) => listener(value));
    }
  }

  static initialize(domain: string, clientId: string) {
    console.log("🚀 Initializing Auth0...");
    this.auth0 = new Auth0({
      domain,
      clientId,
    });
    console.log(`✅ Auth0 initialized`);
  }

  /**
   * Check for stored credentials on app startup
   * This automatically handles token refresh if needed
   */
  static async fetchStoredCredentials(): Promise<Credentials | null> {
    console.log("🔍 Checking for stored credentials...");

    if (!this.auth0) {
      throw new Error("Auth0 has not been initialized!");
    }

    try {
      // Checks if we have valid, non-expired credentials
      const hasValidCredentials =
        await this.auth0.credentialsManager.hasValidCredentials();
      console.log(`📋 Has valid credentials: ${hasValidCredentials}`);

      if (hasValidCredentials) {
        try {
          // Automatically refreshes the token if needed
          this.credentials =
            await this.auth0.credentialsManager.getCredentials();
          this.user = await getUser();
          this.setLoggedIn(true);

          console.log("✅ Retrieved stored credentials");
          console.log(
            `🔐 Access token expires: ${new Date(
              this.credentials.expiresAt! * 1000
            )}`
          );

          return this.credentials;
        } catch (error) {
          console.log("❌ Error retrieving credentials:", error);

          await this.auth0.credentialsManager.clearCredentials();
          this.user = null;
          this.setLoggedIn(false);

          return null;
        }
      }

      this.setLoggedIn(false);
      console.log("ℹ️ No valid credentials found");
      return null;
    } catch (error) {
      console.log("❌ Error checking stored credentials:", error);
      this.setLoggedIn(false);
      return null;
    }
  }

  static async login(): Promise<Credentials | null> {
    console.log("🔑 Starting login process...");

    if (!this.auth0) {
      throw new Error("Auth0 has not been initialized!");
    }

    try {
      console.log("🌐 Opening web authentication...");

      const redirectUrl =
        Platform.OS === "ios"
          ? "ntnu.online.app://auth.online.ntnu.no/ios/ntnu.online.app/callback"
          : "ntnu.online.app://auth.online.ntnu.no/android/ntnu.online.app/callback";

      const response = await this.auth0.webAuth.authorize({
        scope: "openid profile email offline_access", // offline_access is crucial for refresh tokens!
        // audience: "https://rpc.online.ntnu.no/api/trpc", // TODO: This is new. If it breaks anything, remove it
        redirectUrl,
      });

      console.log("💾 Storing credentials securely...");
      // This stores credentials in iOS Keychain / Android Keystore
      await this.auth0.credentialsManager.saveCredentials(response);

      this.credentials = response;
      this.user = await getUser();
      this.setLoggedIn(true);

      console.log("✅ Login successful!");
      console.log(
        `🔐 Access token expires: ${new Date(response.expiresAt! * 1000)}`
      );
      console.log(
        `🔄 Refresh token: ${
          response.refreshToken ? "Available" : "Not available"
        }`
      );

      return response;
    } catch (error) {
      console.log("❌ Login failed:", error);
      return null;
    }
  }

  static async logout(): Promise<void> {
    console.log("🚪 Starting logout process...");

    if (!this.auth0) {
      throw new Error("Auth0 has not been initialized!");
    }

    try {
      console.log("🌐 Clearing web session...");

      const returnToUrl =
        Platform.OS === "ios"
          ? "ntnu.online.app://auth.online.ntnu.no/ios/ntnu.online.app/callback"
          : "ntnu.online.app://auth.online.ntnu.no/android/ntnu.online.app/callback";

      await this.auth0.webAuth.clearSession({
        returnToUrl,
      });

      console.log("🗑️ Clearing stored credentials...");
      await this.auth0.credentialsManager.clearCredentials();

      this.credentials = null;
      this.setLoggedIn(false);
      this.user = null;

      console.log("✅ Logout successful!");
    } catch (error) {
      // Clear local state even if logout fails
      this.credentials = null;
      this.setLoggedIn(false);
      this.user = null;

      console.log("❌ Logout error:", error);
    }
  }

  /**
   * Get current access token (automatically refreshed if needed)
   */
  static async getAccessToken(): Promise<string | null> {
    if (!this.auth0) return null;

    try {
      // This will automatically refresh the token if it's expired!
      const credentials = await this.auth0.credentialsManager.getCredentials();
      return credentials.accessToken;
    } catch (error) {
      console.log("❌ Error getting access token:", error);
      return null;
    }
  }

  /**
   * Get current credentials (automatically refreshed if needed)
   */
  static async getCurrentCredentials(): Promise<Credentials | null> {
    if (!this.auth0) return null;

    try {
      const credentials =
        this.credentials ??
        (await this.auth0.credentialsManager.getCredentials());
      this.credentials = credentials;
      return credentials;
    } catch (error) {
      console.log("❌ Error getting credentials:", error);
      return null;
    }
  }

  // Subscribe to login state changes
  static addLoginStateListener(listener: StateListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }
}

export default Authenticator;
