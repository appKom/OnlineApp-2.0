import Auth0, { Credentials } from "react-native-auth0";
import { Platform } from "react-native";
import { User } from "types/user";
import { getUser } from "./trpc";

const AUTH0_DOMAIN = "auth.online.ntnu.no";
const AUTH0_CLIENT_ID = "EniGfQ4MlcVuS2FWbUMmCjaFB65EqjzZ";

type StateListener = (isLoggedIn: boolean) => void;
type UserListener = (user: User | null) => void;

class Authenticator {
  private static auth0: Auth0 | null = null;
  private static credentials: Credentials | null = null;
  private static _loggedIn: boolean = false;
  private static listeners: StateListener[] = [];
  private static userListeners: UserListener[] = [];
  public static user: User | null = null;

  /** Replace the signed-in user after an edit, so every screen shows the new values. */
  static setUser(user: User | null) {
    this.user = user;
    this.userListeners.forEach((listener) => listener(user));
  }

  static addUserListener(listener: UserListener) {
    this.userListeners.push(listener);
    return () => {
      this.userListeners = this.userListeners.filter((l) => l !== listener);
    };
  }

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

  /**
   * The one Auth0 client, created on first use. A second client would get its own credentials manager, and
   * two managers refreshing at once can present the same single-use refresh token, ending the session.
   * Creating it lazily also survives this module being re-evaluated (Fast Refresh), which resets the statics
   * while the screen that used to call initialize() stays mounted.
   */
  private static get client(): Auth0 {
    if (!this.auth0) {
      console.log("🚀 Initializing Auth0...");
      this.auth0 = new Auth0({ domain: AUTH0_DOMAIN, clientId: AUTH0_CLIENT_ID });
    }
    return this.auth0;
  }

  /** Kept for existing callers; the client is created on demand anyway. */
  static initialize(_domain?: string, _clientId?: string) {
    void this.client;
  }

  /**
   * Check for stored credentials on app startup
   * This automatically handles token refresh if needed
   */
  static async fetchStoredCredentials(): Promise<Credentials | null> {
    console.log("🔍 Checking for stored credentials...");


    try {
      // Checks if we have valid, non-expired credentials
      const hasValidCredentials =
        await this.client.credentialsManager.hasValidCredentials();
      console.log(`📋 Has valid credentials: ${hasValidCredentials}`);

      if (hasValidCredentials) {
        try {
          // Automatically refreshes the token if needed
          this.credentials =
            await this.client.credentialsManager.getCredentials();
          // An API outage must not end the session: screens load the user again when they need it.
          this.user = await getUser().catch((userError) => {
            console.log("⚠️ Could not load user, keeping the session:", userError);
            return null;
          });
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

          await this.client.credentialsManager.clearCredentials();
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


    try {
      console.log("🌐 Opening web authentication...");

      const redirectUrl =
        Platform.OS === "ios"
          ? "ntnu.online.app://auth.online.ntnu.no/ios/ntnu.online.app/callback"
          : "ntnu.online.app://auth.online.ntnu.no/android/ntnu.online.app/callback";

      const response = await this.client.webAuth.authorize({
        scope: "openid profile email offline_access", // offline_access is crucial for refresh tokens!
        // audience: "https://rpc.online.ntnu.no/api/trpc", // TODO: This is new. If it breaks anything, remove it
        redirectUrl,
        additionalParameters: {
          prompt: "login",   // ignore existing SSO and show the chooser
          max_age: "0",      // force fresh auth (string per OIDC/TS types)
        },    // ignore existing SSO, show the login UI
      });

      console.log("💾 Storing credentials securely...");
      // This stores credentials in iOS Keychain / Android Keystore
      await this.client.credentialsManager.saveCredentials(response);

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


    try {
      console.log("🌐 Clearing web session...");

      const returnToUrl =
        Platform.OS === "ios"
          ? "ntnu.online.app://auth.online.ntnu.no/ios/ntnu.online.app/callback"
          : "ntnu.online.app://auth.online.ntnu.no/android/ntnu.online.app/callback";

      await this.client.webAuth.clearSession({
        returnToUrl,
      });

      console.log("🗑️ Clearing stored credentials...");
      await this.client.credentialsManager.clearCredentials();

      // Clear the user before notifying so listeners never see a stale user without credentials.
      this.credentials = null;
      this.user = null;
      this.setLoggedIn(false);

      console.log("✅ Logout successful!");
    } catch (error) {
      // Clear local state even if logout fails
      this.credentials = null;
      this.user = null;
      this.setLoggedIn(false);

      console.log("❌ Logout error:", error);
    }
  }

  /**
   * Get current access token (automatically refreshed if needed)
   */
  static async getAccessToken(): Promise<string | null> {
    try {
      // This will automatically refresh the token if it's expired!
      const credentials = await this.client.credentialsManager.getCredentials();
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
    try {
      const credentials =
        this.credentials ??
        (await this.client.credentialsManager.getCredentials());
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
