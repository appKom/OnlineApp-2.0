import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Alert } from "react-native";
import type { EventSummaryBundle } from "../types/event";
import type { User } from "../types/user";
import { getBookmarkIds } from "./bookmarks";
import { syncEventReminders } from "./reminders";
import { getEventsByIds, getMyEvents } from "./trpc";

// The API has no push notifications, so the device backfills them: every sync reads all upcoming
// events the user attends (including sign-ups on the website) and schedules local reminders and
// Live Activities for them. It runs on launch, foreground, login, after (de)registration and in
// the background when iOS allows it.

const PAGE_SIZE = 50;
const MAX_PAGES = 4;
const PROMPTED_KEY = "online.notifications.prompted.v1";

const listeners = new Set<() => void>();
/** Asks the mounted EventSync to run again, e.g. after signing up or unregistering. */
export function requestEventSync() { listeners.forEach((listener) => listener()); }
export function subscribeEventSync(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }

export interface SyncedEvents {
  attending: EventSummaryBundle[];
  bookmarked: EventSummaryBundle[];
}

/** Upcoming and ongoing events the user attends, plus bookmarked events. */
export async function loadSyncedEvents(userId: string | null): Promise<SyncedEvents> {
  const attending: EventSummaryBundle[] = [];
  if (userId) {
    let cursor: string | undefined;
    for (let page = 0; page < MAX_PAGES; page++) {
      const { items = [], nextCursor } = await getMyEvents(userId, {}, false, cursor, PAGE_SIZE);
      attending.push(...items);
      if (!nextCursor || items.length < PAGE_SIZE) break;
      cursor = nextCursor;
    }
  }
  const attendingIds = new Set(attending.map(({ event }) => event.id));
  const bookmarkIds = (await getBookmarkIds()).filter((id) => !attendingIds.has(id));
  return { attending, bookmarked: await getEventsByIds(bookmarkIds) };
}

/** Schedules reminders for every synced event and cancels the rest. */
export async function syncReminders(user: User | null, { attending, bookmarked }: SyncedEvents) {
  const bookmarkIds = new Set(await getBookmarkIds());
  await syncEventReminders([...attending, ...bookmarked], user, (eventId) => bookmarkIds.has(eventId));
}

/**
 * Asks once for notification permission, so users who only sign up on the website still get
 * reminders. Explains why first; iOS shows its own prompt only once. True when newly granted.
 */
export async function askForEventNotificationsOnce(): Promise<boolean> {
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();
  if (status === "granted") return false;
  if (!canAskAgain || await AsyncStorage.getItem(PROMPTED_KEY)) return false;
  await AsyncStorage.setItem(PROMPTED_KEY, new Date().toISOString());
  const agreed = await new Promise<boolean>((resolve) => Alert.alert(
    "Påminnelser om arrangementer",
    "Få beskjed en time før arrangementer du er påmeldt, også når du meldte deg på via nettsiden.",
    [
      { text: "Ikke nå", style: "cancel", onPress: () => resolve(false) },
      { text: "Slå på", onPress: () => resolve(true) },
    ],
    { cancelable: false },
  ));
  return agreed && (await Notifications.requestPermissionsAsync()).status === "granted";
}
