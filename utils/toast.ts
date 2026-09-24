import { useSyncExternalStore } from "react";
import type { IconName } from "../components/Panel";

// A single transient message at the bottom of the screen, optionally with one action (e.g. "Angre").

export type Toast = {
  id: number;
  message: string;
  icon?: IconName;
  action?: { label: string; onPress: () => void };
};

const DURATION_MS = 5000;

let current: Toast | null = null;
let nextId = 1;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function set(toast: Toast | null) {
  current = toast;
  listeners.forEach((listener) => listener());
}

export function showToast(toast: Omit<Toast, "id">) {
  if (timer) clearTimeout(timer);
  const id = nextId++;
  set({ ...toast, id });
  timer = setTimeout(() => dismissToast(id), DURATION_MS);
}

export function dismissToast(id?: number) {
  if (!current || (id !== undefined && current.id !== id)) return;
  if (timer) clearTimeout(timer);
  timer = null;
  set(null);
}

export function useToast() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
  );
}
