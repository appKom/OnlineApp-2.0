/** Shared by the event reminder and the native Live Activity start window. */
export const EVENT_START_LEAD_MS = 60 * 60 * 1000;
export const eventStartReminderId = (eventId: string) => `event-reminder:${eventId}:start`;
