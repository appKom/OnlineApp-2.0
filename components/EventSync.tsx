import { getTrackingPermissionsAsync, PermissionStatus } from "expo-tracking-transparency";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import type { EventSummaryBundle } from "../types/event";
import { getAttendee, getAttendeeState } from "../utils/attendance";
import Authenticator from "../utils/authenticator";
import { askForEventNotificationsOnce, loadSyncedEvents, subscribeEventSync, syncReminders, type SyncedEvents } from "../utils/event-sync";
import {
  getDismissedLiveEvents,
  getLiveEventSessions,
  liveActivityAvailability,
  liveActivitySchedulingAvailability,
  reconcileLiveEvents,
  startLiveEvent,
  stopLiveEvent,
  updateLiveEventRegistration,
} from "../utils/live-event-activity";
import { liveEventLinks, planLiveEvents, type LiveEventCandidate } from "../utils/live-event-model";

type QRRef = { toDataURL: (callback: (data: unknown) => void) => void };
const DOORS_OPEN_LEAD_MS = 15 * 60_000;
const MAX_TIMER_MS = 2_147_483_647;
const warn = (error: unknown) => console.warn("Event sync:", error);
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** The off-screen SVG returns no image until it has drawn, so retry briefly. */
async function exportQR(qr: { current: QRRef | null }) {
  for (let attempt = 0; attempt < 20; attempt++) {
    if (qr.current) {
      const ref = qr.current;
      const data = await Promise.race([
        new Promise<unknown>((resolve) => ref.toDataURL(resolve)),
        wait(1000).then(() => null),
      ]);
      if (typeof data === "string" && data.length > 0) return data;
    }
    await wait(100);
  }
  throw new Error("Kunne ikke lage QR-bildet.");
}

function toCandidate({ event, attendance }: EventSummaryBundle, userId: string): LiveEventCandidate | null {
  const attendee = getAttendee(attendance, { id: userId });
  if (!attendance || !attendee) return null;
  const startsAt = new Date(event.start).getTime();
  return {
    ticketValue: attendee.id,
    event: {
      eventId: event.id,
      title: event.title,
      location: event.locationTitle || "Sted ikke oppgitt",
      // The event contract has no doors-open time; assume 15 minutes before start.
      doorsOpenAt: startsAt - DOORS_OPEN_LEAD_MS,
      startsAt,
      endsAt: new Date(event.end).getTime(),
      ...liveEventLinks(event.id),
      ownerId: userId,
      registrationStatus: getAttendeeState(attendance, attendee) ?? undefined,
    },
  };
}

/** Ends, refreshes and queues banners; returns when to check again on iOS without scheduling. */
async function syncBanners(userId: string, attending: EventSummaryBundle[], queue: (candidates: LiveEventCandidate[]) => void) {
  const candidates = attending.map((bundle) => toCandidate(bundle, userId)).filter((item) => item !== null);
  const plan = planLiveEvents(candidates, getLiveEventSessions(), await getDismissedLiveEvents(), !liveActivitySchedulingAvailability());
  for (const eventId of plan.stop) await stopLiveEvent(eventId);
  for (const { event } of plan.update) {
    if (event.registrationStatus) await updateLiveEventRegistration(event.eventId, userId, event.registrationStatus);
  }
  queue(plan.start);
  return plan.retryAt;
}

/**
 * Keeps reminders and Live Activities in step with every upcoming event the user attends,
 * wherever they signed up. `userId` is undefined until auth is ready and null when logged out.
 */
export function EventSync({ userId }: { userId: string | null | undefined }) {
  const [pending, setPending] = useState<LiveEventCandidate[]>([]);
  const qr = useRef<QRRef | null>(null);
  const running = useRef(false);
  const rerun = useRef(false);
  const retry = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastSynced = useRef<SyncedEvents | null>(null);

  const sync = useCallback(async () => {
    if (userId === undefined) return;
    if (running.current) { rerun.current = true; return; }
    running.current = true;
    clearTimeout(retry.current);
    try {
      const banners = !liveActivityAvailability();
      // Also loads saved banners and ends those of a previous user.
      if (banners) await reconcileLiveEvents(userId);
      const data = await loadSyncedEvents(userId);
      lastSynced.current = data;
      // Banners first: a scheduled banner's alert stands in for that event's reminder.
      const retryAt = banners && userId ? await syncBanners(userId, data.attending, setPending) : undefined;
      await syncReminders(Authenticator.user, data);
      if (retryAt) retry.current = setTimeout(() => void sync(), Math.min(Math.max(retryAt - Date.now(), 0), MAX_TIMER_MS));
    } catch (error) {
      warn(error);
    } finally {
      running.current = false;
      if (rerun.current) { rerun.current = false; void sync(); }
    }
  }, [userId]);

  useEffect(() => {
    void sync();
    const appState = AppState.addEventListener("change", (state) => { if (state === "active") void sync(); });
    const unsubscribe = subscribeEventSync(() => void sync());
    return () => { appState.remove(); unsubscribe(); clearTimeout(retry.current); };
  }, [sync]);

  // Ask once after login, without competing with the tracking prompt shown at launch.
  useEffect(() => {
    if (!userId) return;
    const timer = setTimeout(async () => {
      try {
        if (Platform.OS === "ios" && (await getTrackingPermissionsAsync()).status === PermissionStatus.UNDETERMINED) return;
        // Reminders were skipped without permission; schedule them now.
        if (await askForEventNotificationsOnce()) void sync();
      } catch (error) {
        warn(error);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [userId, sync]);

  const next = pending[0];
  useEffect(() => {
    if (!next) return;
    let cancelled = false;
    // Runs after the hidden QR below has rendered and handed over its ref.
    const timer = setTimeout(async () => {
      try {
        const image = await exportQR(qr);
        if (!cancelled) await startLiveEvent(next.event, image);
      } catch (error) {
        warn(error);
      } finally {
        if (!cancelled) setPending((queue) => queue.filter((item) => item !== next));
        // Once every banner is in place, restore reminders for any that could not be scheduled.
        if (!cancelled && pending.length === 1 && lastSynced.current) {
          void syncReminders(Authenticator.user, lastSynced.current).catch(warn);
        }
      }
    }, 0);
    return () => { cancelled = true; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [next]);

  if (!next) return null;
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ position: "absolute", opacity: 0, width: 112, height: 112 }}
    >
      {/* Export at the widget's display size; ActivityKit replaces oversized PNGs with a gray placeholder. */}
      <QRCode key={next.ticketValue} value={next.ticketValue} size={112} quietZone={8} ecl="M" getRef={(ref: QRRef) => { qr.current = ref; }} />
    </View>
  );
}
