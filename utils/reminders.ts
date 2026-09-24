import * as Notifications from "expo-notifications";
import { SchedulableTriggerInputTypes } from "expo-notifications";
import { Platform } from "react-native";
import type { EventAttendanceBundle } from "../types/event";
import type { User } from "../types/user";
import { getAttendee } from "./attendance";

// Local reminders for events the user cares about (bookmarked or signed up to):
// - 15 min before registration opens, while they are not signed up
// - 1 hour before the event starts, if they have a spot (or it's a bookmarked event without registration)

const PREFIX = "event-reminder:";
const LEGACY_PREFIX = "registration-reminder-";
const CHANNEL_ID = "event_reminders";

const REGISTRATION_LEAD_MS = 15 * 60 * 1000;
const START_LEAD_MS = 60 * 60 * 1000;

type Reminder = { id: string; date: Date; title: string; body: string; eventId: string; eventTitle: string };

const reminderId = (eventId: string, kind: "registration" | "start") => `${PREFIX}${eventId}:${kind}`;

function remindersFor(bundle: EventAttendanceBundle, user: User | null, bookmarked: boolean): Reminder[] {
  const { event, attendance } = bundle;
  const attendee = getAttendee(attendance, user);
  if (!bookmarked && !attendee) return [];

  const now = Date.now();
  const title = event.title ?? "Arrangement";
  const reminders: Reminder[] = [];

  if (attendance && !attendee) {
    const date = new Date(new Date(attendance.registerStart).getTime() - REGISTRATION_LEAD_MS);
    if (date.getTime() > now) {
      reminders.push({
        id: reminderId(event.id, "registration"),
        date,
        title: "Påmeldingen åpner om 15 minutter",
        body: title,
        eventId: event.id,
        eventTitle: title,
      });
    }
  }

  if (attendee?.reserved || (bookmarked && !attendance)) {
    const date = new Date(new Date(event.start).getTime() - START_LEAD_MS);
    if (date.getTime() > now) {
      reminders.push({
        id: reminderId(event.id, "start"),
        date,
        title: "Starter om en time",
        body: event.locationTitle ? `${title} · ${event.locationTitle}` : title,
        eventId: event.id,
        eventTitle: title,
      });
    }
  }

  return reminders;
}

let channelReady = false;

async function hasPermission(ask: boolean) {
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();
  if (status === "granted") return true;
  if (!ask || !canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).status === "granted";
}

async function schedule(reminder: Reminder) {
  if (Platform.OS === "android" && !channelReady) {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Arrangementspåminnelser",
      importance: Notifications.AndroidImportance.HIGH,
    });
    channelReady = true;
  }

  await Notifications.scheduleNotificationAsync({
    identifier: reminder.id,
    content: {
      title: reminder.title,
      body: reminder.body,
      sound: true,
      data: { eventId: reminder.eventId, eventTitle: reminder.eventTitle },
    },
    trigger: { type: SchedulableTriggerInputTypes.DATE, date: reminder.date, channelId: CHANNEL_ID },
  });
}

/**
 * Brings one event's reminders in line with its current state. Call after the user bookmarks or
 * signs up; `askPermission` is only for such direct actions so we never prompt out of the blue.
 */
export async function updateEventReminders(
  bundle: EventAttendanceBundle,
  user: User | null,
  bookmarked: boolean,
  { askPermission = false } = {},
) {
  try {
    const wanted = remindersFor(bundle, user, bookmarked);
    if (wanted.length > 0 && !(await hasPermission(askPermission))) return;

    await Promise.all(
      (["registration", "start"] as const).map((kind) =>
        Notifications.cancelScheduledNotificationAsync(reminderId(bundle.event.id, kind)),
      ),
    );
    await Promise.all(wanted.map(schedule));
  } catch (error) {
    console.error("Failed to update event reminders:", error);
  }
}

/**
 * Full reconcile from the events list: `bundles` must hold every event the user is signed up to or
 * has bookmarked, since reminders for anything else are cancelled.
 */
export async function syncEventReminders(
  bundles: EventAttendanceBundle[],
  user: User | null,
  isBookmarked: (eventId: string) => boolean,
) {
  try {
    if (!(await hasPermission(false))) return;

    const wanted = new Map<string, Reminder>();
    bundles.forEach((bundle) =>
      remindersFor(bundle, user, isBookmarked(bundle.event.id)).forEach((reminder) =>
        wanted.set(reminder.id, reminder),
      ),
    );

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const stale = scheduled
      .map((request) => request.identifier)
      .filter(
        (id) => id.startsWith(LEGACY_PREFIX) || (id.startsWith(PREFIX) && !wanted.has(id)),
      );

    await Promise.all(stale.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
    // Rescheduling with the same identifier replaces it, which also picks up changed times.
    await Promise.all([...wanted.values()].map(schedule));
  } catch (error) {
    console.error("Failed to sync event reminders:", error);
  }
}
