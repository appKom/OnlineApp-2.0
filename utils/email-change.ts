import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "../types/user";
import { syncEmailFromAuth0 } from "./trpc";

const KEY = "pendingEmailChange";

/** Remember an email change waiting for the user to click the verification link. */
export async function setPendingEmailChange(email: string) {
  try {
    await AsyncStorage.setItem(KEY, email);
  } catch {}
}

/**
 * Once the link is clicked, Auth0 has the new address but the API user doesn't until it's synced
 * (the website does this when opening settings). Returns the synced user, or null if nothing is pending.
 */
export async function syncPendingEmailChange(): Promise<User | null> {
  let pending: string | null = null;
  try {
    pending = await AsyncStorage.getItem(KEY);
  } catch {}
  if (!pending) return null;

  const user = await syncEmailFromAuth0();
  if (user.email?.toLowerCase() === pending.toLowerCase()) {
    try {
      await AsyncStorage.removeItem(KEY);
    } catch {}
  }
  return user;
}
