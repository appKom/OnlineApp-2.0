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
  /** The signed-in user the ticket belongs to. */
  ownerId: string;
  /** Same registration/payment state used by the event page; absent in older saved banners. */
  registrationStatus?: AttendeeState;
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
  return event.startsAt - EVENT_START_LEAD_MS;
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
}

export function getLiveEventPhase(event: LiveEvent, now = Date.now()): LiveEventPhase {
  if (now >= event.endsAt) return "ended";
  if (now < liveEventStartsAt(event)) return "upcoming";
  if (now >= event.startsAt) return "ongoing";
  if (now >= event.doorsOpenAt) return "doors-open";
  return "starting-soon";
}

/** An event the signed-in user is attending, with the QR payload of their ticket. */
export interface LiveEventCandidate {
  event: LiveEvent;
  ticketValue: string;
}

/** iOS caps concurrent Live Activities per app; stay well below it. */
export const MAX_LIVE_EVENTS = 3;

export interface LiveEventPlan {
  /** New banners to start or schedule, soonest first. */
  start: LiveEventCandidate[];
  /** Existing banners whose registration badge may need refreshing. */
  update: LiveEventCandidate[];
  /** Event IDs whose banner should end: no longer attended, or pushed out by sooner events. */
  stop: string[];
  /** When the next banner can start, if it can't be scheduled ahead (iOS 18–25). */
  retryAt?: number;
}

/**
 * Banners for the user's next attended events, soonest first. Events the user
 * swiped away are skipped. Without advance scheduling, only events inside their
 * one-hour window can get a banner.
 */
export function planLiveEvents(
  candidates: LiveEventCandidate[],
  sessions: LiveEventSession[],
  dismissedEventIds: string[],
  canSchedule: boolean,
  now = Date.now(),
  max = MAX_LIVE_EVENTS,
): LiveEventPlan {
  const eligible = candidates
    .filter(({ event }) => getLiveEventPhase(event, now) !== "ended" && !dismissedEventIds.includes(event.eventId))
    .sort((a, b) => a.event.startsAt - b.event.startsAt);
  const waiting = canSchedule ? [] : eligible.filter(({ event }) => getLiveEventPhase(event, now) === "upcoming");
  const wanted = eligible.filter((candidate) => !waiting.includes(candidate)).slice(0, max);
  const isRunning = ({ event }: LiveEventCandidate) =>
    sessions.some((current) => current.event.eventId === event.eventId && current.event.ownerId === event.ownerId);
  return {
    start: wanted.filter((candidate) => !isRunning(candidate)),
    update: wanted.filter(isRunning),
    stop: sessions
      .filter((current) => !wanted.some(({ event }) => event.eventId === current.event.eventId && event.ownerId === current.event.ownerId))
      .map((current) => current.event.eventId),
    retryAt: waiting.length ? Math.min(...waiting.map(({ event }) => liveEventStartsAt(event))) : undefined,
  };
}

export function liveEventLinks(eventId: string) {
  const eventURL = `ntnu.online.app://event-details?eventId=${encodeURIComponent(eventId)}`;
  return { eventURL, ticketURL: `${eventURL}&showTicket=1` };
}
