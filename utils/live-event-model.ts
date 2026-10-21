import { EVENT_START_LEAD_MS } from "./event-timing";
import type { AttendeeState } from "./attendance";

export type LiveEventPhase = "upcoming" | "starting-soon" | "doors-open" | "ongoing" | "ended";

export interface LiveEvent {
  eventId: string;
  title: string;
  location: string;
  doorsOpenAt: number;
  startsAt: number;
  endsAt: number;
  eventURL: string;
  ticketURL: string;
  /** Null for the local demo; real tickets belong to the signed-in user. */
  ownerId: string | null;
  /** Same registration/payment state used by the event page; absent in older saved banners. */
  registrationStatus?: AttendeeState;
  /** Only the accelerated scheduled demo overrides the normal one-hour lead. */
  demoLiveStartsAt?: number;
}

export type LiveEventBranding = { logoLightURI: string; logoDarkURI: string; markURI: string };

export interface LiveEventSession {
  event: LiveEvent;
  qrImageURI: string;
  activityId: string;
  phase: LiveEventPhase;
  branding?: LiveEventBranding;
}

export function liveEventStartsAt(event: LiveEvent) {
  return event.ownerId === null && event.demoLiveStartsAt !== undefined ? event.demoLiveStartsAt : event.startsAt - EVENT_START_LEAD_MS;
}

export function nextLiveEventBoundary(event: LiveEvent, phase: LiveEventPhase) {
  if (phase === "upcoming") return liveEventStartsAt(event);
  if (phase === "starting-soon") return event.doorsOpenAt;
  return phase === "doors-open" ? event.startsAt : event.endsAt;
}

export function validateLiveEvent(event: LiveEvent) {
  if (!event.eventId || !event.title ||
      ![event.doorsOpenAt, event.startsAt, event.endsAt].every(Number.isFinite) ||
      event.doorsOpenAt > event.startsAt || event.startsAt >= event.endsAt) {
    throw new Error("Arrangementet har ugyldige tidspunkter.");
  }
  if (event.demoLiveStartsAt !== undefined && (event.ownerId !== null || !Number.isFinite(event.demoLiveStartsAt) || event.demoLiveStartsAt > event.doorsOpenAt)) {
    throw new Error("Testarrangementet har ugyldig starttid for Live-banner.");
  }
}

export function getLiveEventPhase(event: LiveEvent, now = Date.now()): LiveEventPhase {
  if (now >= event.endsAt) return "ended";
  if (now < liveEventStartsAt(event)) return "upcoming";
  if (now >= event.startsAt) return "ongoing";
  if (now >= event.doorsOpenAt) return "doors-open";
  return "starting-soon";
}

export function makeDemoEvent(phase: "starting-soon" | "doors-open" | "ongoing", now = Date.now(), accelerated = false): LiveEvent {
  const startsAt = phase === "ongoing" ? now - (accelerated ? 60_000 : 60 * 60_000) : now + (accelerated ? 20_000 : phase === "starting-soon" ? EVENT_START_LEAD_MS : 15 * 60_000);
  return {
    eventId: "local-live-banner-demo",
    title: "Online-kveld · test",
    location: "Kontoret · A4",
    doorsOpenAt: phase === "starting-soon" || phase === "ongoing" ? startsAt - 15 * 60_000 : now - 1000,
    startsAt,
    endsAt: accelerated ? startsAt + 90_000 : phase === "starting-soon" ? startsAt + 60 * 60_000 : now + 60 * 60_000,
    eventURL: "ntnu.online.app://live-banner-test",
    ticketURL: "ntnu.online.app://live-banner-test?showTicket=1",
    ownerId: null,
    registrationStatus: "REGISTERED",
  };
}

export function makeScheduledDemoEvent(now = Date.now()): LiveEvent {
  return { ...makeDemoEvent("starting-soon", now), demoLiveStartsAt: now + 30_000, doorsOpenAt: now + 60_000, startsAt: now + 90_000, endsAt: now + 180_000 };
}

export function liveEventLinks(eventId: string) {
  const eventURL = `ntnu.online.app://event-details?eventId=${encodeURIComponent(eventId)}`;
  return { eventURL, ticketURL: `${eventURL}&showTicket=1` };
}
