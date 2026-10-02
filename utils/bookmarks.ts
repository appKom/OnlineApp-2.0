import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useSyncExternalStore } from "react";
import type { EventListBundle } from "../types/event";
import Authenticator from "./authenticator";
import { updateEventReminders } from "./reminders";
import { showToast } from "./toast";

// Bookmarked event ids, kept on the device only (the API has no bookmark concept).

const STORAGE_KEY = "bookmarkedEventIds";

let bookmarkIds: string[] = [];
let loaded = false;
let ready = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function persist() {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarkIds)).catch((error) =>
    console.error("Failed to save bookmarks:", error),
  );
}

async function load() {
  if (loaded) return;
  loaded = true;
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    if (Array.isArray(parsed)) {
      // Merge with anything bookmarked before storage finished loading.
      bookmarkIds = [...new Set([...parsed.filter((id) => typeof id === "string"), ...bookmarkIds])];
    }
  } catch (error) {
    console.error("Failed to load bookmarks:", error);
  }
  ready = true;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  void load();
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return bookmarkIds;
}

export function toggleBookmark(eventId: string) {
  bookmarkIds = bookmarkIds.includes(eventId)
    ? bookmarkIds.filter((id) => id !== eventId)
    : [...bookmarkIds, eventId];
  emit();
  persist();
}

/**
 * Bookmark toggle for user actions: updates the event's reminders and shows a toast with undo.
 */
export function toggleBookmarkWithUndo(bundle: EventListBundle) {
  const apply = () => {
    toggleBookmark(bundle.event.id);
    const bookmarked = bookmarkIds.includes(bundle.event.id);
    void updateEventReminders(bundle, Authenticator.user, bookmarked, { askPermission: bookmarked });
    return bookmarked;
  };

  const added = apply();
  showToast({
    message: added ? "Lagt til i bokmerker" : "Fjernet fra bokmerker",
    icon: added ? "bookmark-check-outline" : "bookmark-remove-outline",
    action: { label: "Angre", onPress: () => void apply() },
  });
}

/** Drops bookmarks for events that no longer need quick access (e.g. ended). */
export function removeBookmarks(eventIds: string[]) {
  if (!eventIds.some((id) => bookmarkIds.includes(id))) return;
  bookmarkIds = bookmarkIds.filter((id) => !eventIds.includes(id));
  emit();
  persist();
}

export function useBookmarks() {
  const ids = useSyncExternalStore(subscribe, getSnapshot);
  // True once stored bookmarks are loaded, so an empty list really means "none".
  const isReady = useSyncExternalStore(subscribe, () => ready);
  const isBookmarked = useCallback((eventId: string) => ids.includes(eventId), [ids]);
  return { bookmarkIds: ids, ready: isReady, isBookmarked, toggleBookmark };
}
