import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useSyncExternalStore } from "react";

// Bookmarked event ids, kept on the device only (the API has no bookmark concept).

const STORAGE_KEY = "bookmarkedEventIds";

let bookmarkIds: string[] = [];
let loaded = false;
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
      emit();
    }
  } catch (error) {
    console.error("Failed to load bookmarks:", error);
  }
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

/** Drops bookmarks for events that no longer need quick access (e.g. ended). */
export function removeBookmarks(eventIds: string[]) {
  if (!eventIds.some((id) => bookmarkIds.includes(id))) return;
  bookmarkIds = bookmarkIds.filter((id) => !eventIds.includes(id));
  emit();
  persist();
}

export function useBookmarks() {
  const ids = useSyncExternalStore(subscribe, getSnapshot);
  const isBookmarked = useCallback((eventId: string) => ids.includes(eventId), [ids]);
  return { bookmarkIds: ids, isBookmarked, toggleBookmark };
}
