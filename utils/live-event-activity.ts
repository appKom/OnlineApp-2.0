import AsyncStorage from "@react-native-async-storage/async-storage";
import { requireOptionalNativeModule } from "expo";
import { AppState, Platform } from "react-native";
import type { LiveActivityFactory } from "expo-widgets";
import type { EventActivityProps } from "../widgets/EventLiveActivity";
import { eventStartAlert, eventStartReminderId } from "./event-timing";
import { getLiveEventPhase, liveEventStartsAt, nextLiveEventBoundary, validateLiveEvent, type LiveEvent, type LiveEventSession } from "./live-event-model";

const STORAGE_KEY = "online.live-events.v2";
/** Single banner saved by earlier builds; migrated on first load. */
const LEGACY_STORAGE_KEY = "online.live-event.v1";
const DISMISSED_KEY = "online.live-event.dismissed.v1";
let sessions: LiveEventSession[] = [];
let initialized = false;
let queue: Promise<unknown> = Promise.resolve();
const listeners = new Set<() => void>();
let factory: LiveActivityFactory<EventActivityProps> | undefined;
type Appearance = { backgroundColor: string; textColor: string; mutedColor: string; accentColor: string; isDark: boolean };
let appearance: Appearance = { backgroundColor: "#0F1417", textColor: "#DFE3E7", mutedColor: "#C1C7CE", accentColor: "#91CEF5", isDark: true };
type SchedulingModule = { scheduleEventLiveActivity?: (name: string, props: string, url: string, start: number, stale: number, title: string, body: string) => string };

export function liveActivitySchedulingAvailability(): string | null {
  const unavailable = liveActivityAvailability();
  if (unavailable) return unavailable;
  if (Number.parseInt(String(Platform.Version), 10) < 26) return "Automatisk planlegging krever iOS 26. På eldre iOS kan banneret startes fra én time før arrangementet.";
  if (!requireOptionalNativeModule<SchedulingModule>("ExpoWidgets")?.scheduleEventLiveActivity) return "Bygg appen på nytt for å aktivere automatisk planlegging.";
  return null;
}

export function liveActivityAvailability(): string | null {
  if (Platform.OS !== "ios") return "Live-banner er foreløpig tilgjengelig på iOS.";
  if (Number.parseInt(String(Platform.Version), 10) < 18) return "Live-banner krever iOS 18 eller nyere i denne appen.";
  if (!requireOptionalNativeModule("ExpoWidgets")) return "Installer en ny native build for å bruke Live-banner. Expo Go støttes ikke.";
  return null;
}

function getFactory() {
  const unavailable = liveActivityAvailability();
  if (unavailable) throw new Error(unavailable);
  // Keep Android, web, Expo Go and older native builds from loading the iOS widget runtime.
  factory ??= require("../widgets/EventLiveActivity").default as LiveActivityFactory<EventActivityProps>;
  return factory;
}

function serialized<T>(operation: () => Promise<T>): Promise<T> {
  const next = queue.then(operation);
  queue = next.catch(() => undefined);
  return next;
}

function publish() { listeners.forEach((listener) => listener()); }
export function subscribeLiveEvent(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
/** Every banner the app has started or scheduled, oldest first. */
export function getLiveEventSessions() { return sessions; }

/** Events whose banner the user swiped away; they are never started again. */
export async function getDismissedLiveEvents(): Promise<string[]> {
  try {
    const parsed = JSON.parse(await AsyncStorage.getItem(DISMISSED_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

async function markDismissed(eventId: string) {
  const dismissed = (await getDismissedLiveEvents()).filter((id) => id !== eventId);
  await AsyncStorage.setItem(DISMISSED_KEY, JSON.stringify([...dismissed, eventId].slice(-20)));
}

function propsFor(current: LiveEventSession): EventActivityProps {
  const ongoing = current.phase === "ongoing";
  return {
    title: current.event.title,
    location: current.event.location,
    phase: current.phase === "doors-open" ? "doors-open" : ongoing ? "ongoing" : "starting-soon",
    intervalStart: ongoing ? current.event.startsAt : liveEventStartsAt(current.event),
    intervalEnd: ongoing ? current.event.endsAt : current.event.startsAt,
    qrImageURI: current.qrImageURI,
    eventURL: current.event.eventURL,
    ticketURL: current.event.ticketURL,
    registrationStatus: current.event.registrationStatus,
    ...appearance,
    logoURI: appearance.isDark ? current.branding?.logoDarkURI : current.branding?.logoLightURI,
    markURI: current.branding?.markURI,
  };
}

const staleDateFor = (current: LiveEventSession) =>
  new Date(nextLiveEventBoundary(current.event, current.phase === "upcoming" ? "starting-soon" : current.phase));
const findInstance = (current: LiveEventSession) => getFactory().getInstances().find((item) => item.getId() === current.activityId);

function parseSession(value: unknown): LiveEventSession {
  const parsed = value as LiveEventSession;
  validateLiveEvent(parsed.event);
  if (typeof parsed.activityId !== "string" || typeof parsed.qrImageURI !== "string" || typeof parsed.event.ownerId !== "string") {
    throw new Error("Invalid activity");
  }
  return parsed;
}

async function initialize() {
  if (initialized) return;
  try {
    const stored = JSON.parse(await AsyncStorage.getItem(STORAGE_KEY) ?? "[]");
    sessions = Array.isArray(stored) ? stored.map(parseSession) : [];
  } catch {
    sessions = [];
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
  const legacy = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
  if (legacy) {
    try { sessions = [...sessions, parseSession(JSON.parse(legacy))]; } catch { /* dropped below */ }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
  }
  initialized = true;
  publish();
}

async function save(next: LiveEventSession[]) {
  if (next.length) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  else await AsyncStorage.removeItem(STORAGE_KEY);
  sessions = next;
  publish();
}

async function deleteQR(uri: string) {
  const { widgetsDirectory } = require("expo-widgets") as typeof import("expo-widgets");
  if (widgetsDirectory && uri.startsWith(`${widgetsDirectory.replace(/\/$/, "")}/online-ticket-`)) {
    const { File } = require("expo-file-system") as typeof import("expo-file-system");
    const file = new File(uri);
    if (file.exists) file.delete();
  }
}

async function endSession(current: LiveEventSession) {
  await findInstance(current)?.end("immediate");
  await deleteQR(current.qrImageURI);
}

async function endAll() {
  if (liveActivityAvailability()) return;
  // Also removes orphaned instances left by a crash or an interrupted save.
  for (const instance of getFactory().getInstances()) await instance.end("immediate");
  const old = sessions;
  await save([]);
  for (const current of old) await deleteQR(current.qrImageURI);
}

/**
 * Starts the event's banner, or schedules it for one hour before start on iOS 26+.
 * Replaces an existing banner for the same event; others are kept. QR is a PNG
 * exported by react-native-svg.
 */
export function startLiveEvent(event: LiveEvent, qrPNGBase64: string) {
  return serialized(async () => {
    await initialize();
    validateLiveEvent(event);
    const phase = getLiveEventPhase(event);
    if (phase === "ended") throw new Error("Arrangementet er avsluttet.");
    if (phase === "upcoming") {
      const unavailable = liveActivitySchedulingAvailability();
      if (unavailable) throw new Error(unavailable);
    }
    const activityFactory = getFactory();
    const { widgetsDirectory } = require("expo-widgets") as typeof import("expo-widgets");
    if (!widgetsDirectory) throw new Error("Live-banner mangler en delt bilde-mappe. Bygg appen på nytt.");
    const { prepareLiveEventBranding } = require("./live-event-branding") as typeof import("./live-event-branding");
    const branding = await prepareLiveEventBranding();
    const others = sessions.filter((current) => current.event.eventId !== event.eventId);
    for (const replaced of sessions.filter((current) => !others.includes(current))) await endSession(replaced);
    const { File } = require("expo-file-system") as typeof import("expo-file-system");
    const image = new File(widgetsDirectory, `online-ticket-${event.eventId.replace(/[^\w-]/g, "_")}-${Date.now()}.png`);
    const next: LiveEventSession = { event, qrImageURI: image.uri, activityId: "", phase, branding };
    try {
      await image.write(qrPNGBase64, { encoding: "base64" });
      const staleDate = staleDateFor(next).getTime();
      const alert = eventStartAlert(event.title, event.location);
      next.activityId = phase === "upcoming"
        ? requireOptionalNativeModule<SchedulingModule>("ExpoWidgets")!.scheduleEventLiveActivity!(
          "OnlineEventActivity", JSON.stringify(propsFor(next)), event.eventURL, liveEventStartsAt(event), staleDate, alert.title, alert.body,
        )
        : activityFactory.start(propsFor(next), event.eventURL, new Date(staleDate)).getId();
      await save([...others, next]);
      // The scheduled start brings its own alert; the next reminder sync restores ours if the banner goes.
      if (phase === "upcoming") {
        const Notifications = require("expo-notifications") as typeof import("expo-notifications");
        await Notifications.cancelScheduledNotificationAsync(eventStartReminderId(event.eventId)).catch((error) => console.warn("Live-banner reminder:", error));
      }
    } catch (error) {
      if (next.activityId) await findInstance(next)?.end("immediate");
      if (image.exists) image.delete();
      if (others.length !== sessions.length) await save(others).catch(() => undefined);
      throw error;
    }
  });
}

/** Ends one event's banner, or every banner when no event is given (logout). */
export function stopLiveEvent(eventId?: string) {
  return serialized(async () => {
    if (liveActivityAvailability()) return;
    await initialize();
    if (eventId === undefined) { await endAll(); return; }
    const current = sessions.find((item) => item.event.eventId === eventId);
    if (!current) return;
    await endSession(current);
    await save(sessions.filter((item) => item !== current));
  });
}

/** Refresh the attendee's status without replacing the ticket or its scheduled start. */
export function updateLiveEventRegistration(eventId: string, ownerId: string, registrationStatus: NonNullable<LiveEvent["registrationStatus"]>) {
  return serialized(async () => {
    if (liveActivityAvailability()) return;
    await initialize();
    const current = sessions.find((item) => item.event.eventId === eventId && item.event.ownerId === ownerId);
    if (!current || current.event.registrationStatus === registrationStatus) return;
    const instance = findInstance(current);
    if (!instance) {
      await markDismissed(eventId);
      await endSession(current);
      await save(sessions.filter((item) => item !== current));
      return;
    }
    const next = { ...current, event: { ...current.event, registrationStatus } };
    await instance.update(propsFor(next), staleDateFor(next));
    await save(sessions.map((item) => item === current ? next : item));
  });
}

/**
 * Foreground reconciliation: advances phases, ends finished banners and banners of
 * another user, and remembers banners the user swiped away. Background phase
 * changes require APNs.
 */
export function reconcileLiveEvents(ownerId?: string | null) {
  return serialized(async () => {
    if (liveActivityAvailability()) return;
    await initialize();
    const known = new Set(sessions.map((current) => current.activityId));
    for (const orphan of getFactory().getInstances().filter((instance) => !known.has(instance.getId()))) await orphan.end("immediate");
    const kept: LiveEventSession[] = [];
    let changed = false;
    for (const current of sessions) {
      const instance = findInstance(current);
      const phase = getLiveEventPhase(current.event);
      const foreign = ownerId !== undefined && current.event.ownerId !== ownerId;
      if (foreign || !instance || phase === "ended") {
        if (!foreign && !instance && phase !== "ended") await markDismissed(current.event.eventId);
        await endSession(current);
        changed = true;
        continue;
      }
      if (current.phase !== phase || !current.branding) {
        const { prepareLiveEventBranding } = require("./live-event-branding") as typeof import("./live-event-branding");
        const next = { ...current, phase, branding: current.branding ?? await prepareLiveEventBranding() };
        await instance.update(propsFor(next), staleDateFor(next));
        kept.push(next);
        changed = true;
      } else {
        kept.push(current);
      }
    }
    if (changed) await save(kept);
  });
}

export function setLiveEventAppearance(next: Appearance) {
  return serialized(async () => {
    if (JSON.stringify(appearance) === JSON.stringify(next)) return;
    appearance = next;
    if (liveActivityAvailability()) return;
    for (const current of sessions) await findInstance(current)?.update(propsFor(current), staleDateFor(current));
  });
}

export function watchLiveEvent(onError: (error: unknown) => void, getOwnerId: () => string | null | undefined = () => undefined) {
  if (liveActivityAvailability()) return () => {};
  let refreshing = false;
  const refresh = () => {
    if (AppState.currentState !== "active" || refreshing || (initialized && !sessions.length)) return;
    refreshing = true;
    void reconcileLiveEvents(getOwnerId()).catch(onError).finally(() => { refreshing = false; });
  };
  refresh();
  const interval = setInterval(refresh, 1000);
  const subscription = AppState.addEventListener("change", (state) => { if (state === "active") refresh(); });
  return () => { clearInterval(interval); subscription.remove(); };
}
