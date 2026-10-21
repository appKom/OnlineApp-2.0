import AsyncStorage from "@react-native-async-storage/async-storage";
import { requireOptionalNativeModule } from "expo";
import { AppState, Platform } from "react-native";
import type { LiveActivityFactory } from "expo-widgets";
import type { EventActivityProps } from "../widgets/EventLiveActivity";
import { getLiveEventPhase, liveEventStartsAt, nextLiveEventBoundary, validateLiveEvent, type LiveEvent, type LiveEventSession } from "./live-event-model";
import { eventStartReminderId } from "./event-timing";

const STORAGE_KEY = "online.live-event.v1";
let session: LiveEventSession | null = null;
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

export function setLiveEventAppearance(next: Appearance) {
  return serialized(async () => {
    if (JSON.stringify(appearance) === JSON.stringify(next)) return;
    appearance = next;
    if (session && !liveActivityAvailability()) {
      const instance = getFactory().getInstances().find((item) => item.getId() === session!.activityId);
      if (instance) await instance.update(propsFor(session), new Date(nextLiveEventBoundary(session.event, session.phase === "upcoming" ? "starting-soon" : session.phase)));
    }
  });
}

export function liveActivityAvailability(): string | null {
  if (Platform.OS !== "ios") return "Live-banner er foreløpig tilgjengelig på iOS.";
  if (Number.parseInt(String(Platform.Version), 10) < 18) return "Live-banner krever iOS 18 eller nyere i denne appen.";
  if (!requireOptionalNativeModule("ExpoWidgets")) return "Installer en ny native build for å teste Live-banner. Expo Go støttes ikke.";
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
export function getLiveEventSession() { return session; }

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
    isDemo: current.event.ownerId === null,
    registrationStatus: current.event.registrationStatus,
    ...appearance,
    logoURI: appearance.isDark ? current.branding?.logoDarkURI : current.branding?.logoLightURI,
    markURI: current.branding?.markURI,
  };
}

async function initialize() {
  if (initialized) return;
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as LiveEventSession;
      validateLiveEvent(parsed.event);
      if (typeof parsed.activityId !== "string" || typeof parsed.qrImageURI !== "string") throw new Error("Invalid activity");
      session = parsed;
    } catch {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  }
  initialized = true;
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

async function endCurrent() {
  if (liveActivityAvailability()) return;
  // Also recover and remove orphaned instances after a crash or an interrupted save.
  for (const instance of getFactory().getInstances()) await instance.end("immediate");
  const old = session;
  session = null;
  await AsyncStorage.removeItem(STORAGE_KEY);
  if (old) await deleteQR(old.qrImageURI);
  publish();
}

/** Starts one banner, replacing the previous event. QR is a PNG exported by react-native-svg. */
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
    await endCurrent();
    const { File } = require("expo-file-system") as typeof import("expo-file-system");
    const image = new File(widgetsDirectory, `online-ticket-${Date.now()}.png`);
    try {
      await image.write(qrPNGBase64, { encoding: "base64" });
      const next: LiveEventSession = { event, qrImageURI: image.uri, activityId: "", phase, branding };
      const staleDate = nextLiveEventBoundary(event, phase === "upcoming" ? "starting-soon" : phase);
      if (phase === "upcoming") {
        next.activityId = requireOptionalNativeModule<SchedulingModule>("ExpoWidgets")!.scheduleEventLiveActivity!(
          "OnlineEventActivity", JSON.stringify(propsFor(next)), event.eventURL, liveEventStartsAt(event), staleDate,
          event.ownerId === null ? "Live-banner starter" : "Starter om en time", `${event.title} · ${event.location}`,
        );
      } else {
        next.activityId = activityFactory.start(propsFor(next), event.eventURL, new Date(staleDate)).getId();
      }
      session = next;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      // The scheduled ActivityKit start supplies its own system alert at this time.
      if (phase === "upcoming" && event.ownerId !== null) {
        const Notifications = require("expo-notifications") as typeof import("expo-notifications");
        await Notifications.cancelScheduledNotificationAsync(eventStartReminderId(event.eventId)).catch((error) => console.warn("Live-banner reminder:", error));
      }
      publish();
    } catch (error) {
      await endCurrent();
      if (image.exists) image.delete();
      throw error;
    }
  });
}

export function stopLiveEvent() { return serialized(async () => { await initialize(); await endCurrent(); }); }

/** Refresh the attendee's status without replacing the ticket or its scheduled start. */
export function updateLiveEventRegistration(eventId: string, ownerId: string | null, registrationStatus: NonNullable<LiveEvent["registrationStatus"]>) {
  return serialized(async () => {
    if (liveActivityAvailability()) return;
    await initialize();
    if (!session || session.event.eventId !== eventId || session.event.ownerId !== ownerId || session.event.registrationStatus === registrationStatus) return;
    const instance = getFactory().getInstances().find((item) => item.getId() === session!.activityId);
    if (!instance) { await endCurrent(); return; }
    const next = { ...session, event: { ...session.event, registrationStatus } };
    await instance.update(propsFor(next), new Date(nextLiveEventBoundary(next.event, next.phase === "upcoming" ? "starting-soon" : next.phase)));
    session = next;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    publish();
  });
}

export function updateLiveEvent(event: LiveEvent) {
  return serialized(async () => {
    await initialize();
    validateLiveEvent(event);
    if (!session || session.event.eventId !== event.eventId || session.event.ownerId !== event.ownerId) {
      throw new Error("Start Live-banner først.");
    }
    const phase = getLiveEventPhase(event);
    if (phase === "ended" || phase === "upcoming") throw new Error("Arrangementet er ikke aktivt.");
    const instance = getFactory().getInstances().find((item) => item.getId() === session!.activityId);
    if (!instance) { await endCurrent(); throw new Error("Live-banner er avsluttet. Start det på nytt."); }
    const next = { ...session, event, phase };
    await instance.update(propsFor(next), new Date(nextLiveEventBoundary(event, phase)));
    session = next;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    publish();
  });
}

/** Foreground reconciliation only. Background phase changes require APNs. */
export function reconcileLiveEvent(ownerId?: string | null) {
  return serialized(async () => {
    if (liveActivityAvailability()) return;
    await initialize();
    if (!session) {
      if (getFactory().getInstances().length) await endCurrent();
      return;
    }
    if (ownerId !== undefined && session.event.ownerId !== null && session.event.ownerId !== ownerId) {
      await endCurrent();
      return;
    }
    const instance = getFactory().getInstances().find((item) => item.getId() === session!.activityId);
    const phase = getLiveEventPhase(session.event);
    if (!instance || phase === "ended") { await endCurrent(); return; }
    if (session.phase !== phase || !session.branding) {
      const { prepareLiveEventBranding } = require("./live-event-branding") as typeof import("./live-event-branding");
      const next = { ...session, phase, branding: session.branding ?? await prepareLiveEventBranding() };
      await instance.update(propsFor(next), new Date(nextLiveEventBoundary(next.event, phase === "upcoming" ? "starting-soon" : phase)));
      session = next;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      publish();
    }
  });
}

export function watchLiveEvent(onError: (error: unknown) => void, getOwnerId: () => string | null | undefined = () => undefined) {
  if (liveActivityAvailability()) return () => {};
  let refreshing = false;
  const refresh = () => {
    if (AppState.currentState !== "active" || refreshing || (initialized && !session)) return;
    refreshing = true;
    void reconcileLiveEvent(getOwnerId()).catch(onError).finally(() => { refreshing = false; });
  };
  refresh();
  const interval = setInterval(refresh, 1000);
  const subscription = AppState.addEventListener("change", (state) => { if (state === "active") refresh(); });
  return () => { clearInterval(interval); subscription.remove(); };
}
