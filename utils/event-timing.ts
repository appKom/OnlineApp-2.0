/** Shared by the event reminder and the native Live Activity start window, which coincide. */
export const EVENT_START_LEAD_MS = 60 * 60 * 1000;
export const eventStartReminderId = (eventId: string) => `event-reminder:${eventId}:start`;

/** One alert per event: the local reminder, or a scheduled Live Activity's alert in its place. */
export const eventStartAlert = (title: string, location?: string | null) => ({
  title: "Starter om en time",
  body: location ? `${title} · ${location}` : title,
});
