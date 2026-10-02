import { createTRPCUntypedClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import Authenticator from "./authenticator";
import { jwtDecode } from "jwt-decode";
import { User } from "types/user";
import { UserClaims } from "types/user-claims";
import { UserGroup } from "types/group";
import type { VisiblePersonalMark } from "types/mark";
import {
  RegistrationAvailabilityResult,
  EventAttendanceBundle,
  EventSummaryBundle,
  AttendanceSelectionResponse,
  EventFilterParams,
} from "types/event";

export const DEREGISTER_REASON_TYPES = [
  "SCHOOL",
  "WORK",
  "ECONOMY",
  "TIME",
  "SICK",
  "NO_FAMILIAR_FACES",
  "OTHER",
] as const;
export type DeregisterReasonType = (typeof DEREGISTER_REASON_TYPES)[number];

const client = createTRPCUntypedClient({
  links: [
    httpBatchLink({
      url: "https://rpc.online.ntnu.no/api/trpc",
      transformer: superjson,
      // Proxies in front of the API answer with HTML error pages while it restarts or is overloaded.
      // Retry queries once, then fail with a readable message instead of a JSON parse error.
      async fetch(url, options) {
        const isQuery = !options?.method || options.method === "GET";
        for (let attempt = 0; ; attempt++) {
          const response = await fetch(url, options as RequestInit);
          if ((response.headers.get("content-type") ?? "").includes("json")) return response;

          if (isQuery && attempt === 0) {
            await new Promise((resolve) => setTimeout(resolve, 800));
            continue;
          }
          console.warn(`tRPC got a non-JSON ${response.status} response for ${String(url).slice(0, 200)}`);
          throw new Error(`Fikk ikke kontakt med Online (${response.status}). Prøv igjen om litt.`);
        }
      },
      async headers() {
        const accessToken = await Authenticator.getAccessToken();

        return {
          "X-Request-Source": "online-app",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        };
      },
    }),
  ],
});

type order = "asc" | "desc";

export async function getAllEvents(
  take: number = 20,
  cursor?: string,
  orderBy: order = "desc",
  filter?: EventFilterParams,
): Promise<EventPage> {
  const params = {
    take,
    cursor,
    filter: {
      byStartDate: filter?.byStartDate ?? {
        max: null,
        // min: "2025-01-01T00:00:00.000Z",
        //min: new Date().toISOString(),
        min: null,
      },
      byEndDate: filter?.byEndDate ?? {
        max: null,
        min: null,
      },
      byType: filter?.byType,
      byId: filter?.byId,
      excludingType: filter?.excludingType ?? [],
      byVisibility: filter?.byVisibility,
      // The API defaults this to ["COMMITTEE_ONLY"]; send it explicitly so committee members get internal events.
      // The server still hides what the caller isn't allowed to see.
      excludingVisibility: filter?.excludingVisibility ?? [],
      orderBy,
    },
  };

  const result = await client.query("event.allSummaries", params);
  return result as EventPage;
}

export async function getAllPastEvents(
  take: number = 20,
  cursor?: string,
  orderBy: order = "desc",
): Promise<EventPage> {
  return getAllEvents(take, cursor, orderBy, {
    byStartDate: {
      min: null,
      max: new Date().toISOString(),
    },
  });
}

export async function getAllFutureEvents(
  take: number = 20,
  cursor?: string,
  orderBy: order = "asc",
): Promise<EventPage> {
  return getAllEvents(take, cursor, orderBy, {
    byStartDate: {
      min: new Date().toISOString(),
      max: null,
    },
  });
}

export async function getAllEventsByAttendingUserId(
  userId: string,
  limit: number = 20,
  cursor?: string,
  orderBy: order = "desc",
  filter?: EventFilterParams,
): Promise<EventPage> {
  const params = {
    id: userId,
    take: limit,
    cursor,
    filter: {
      byStartDate: filter?.byStartDate ?? {
        max: null,
        min: null,
      },
      byEndDate: filter?.byEndDate ?? {
        max: null,
        min: null,
      },
      byType: filter?.byType,
      excludingType: filter?.excludingType ?? [],
      byVisibility: filter?.byVisibility,
      excludingVisibility: filter?.excludingVisibility ?? [],
      orderBy,
    },
  };
  const result = await client.query("event.allSummariesByAttendingUserId", params);
  return result as EventPage;
}

export async function getAllPastEventsByAttendingUserId(
  userId: string,
  limit: number = 20,
  cursor?: string,
  orderBy: order = "desc",
): Promise<EventPage> {
  return getAllEventsByAttendingUserId(userId, limit, cursor, orderBy, {
    byStartDate: {
      min: null,
      max: new Date().toISOString(),
    },
  });
}

export async function getAllFutureEventsByAttendingUserId(
  userId: string,
  limit: number = 20,
  cursor?: string,
  orderBy: order = "asc",
): Promise<EventPage> {
  return getAllEventsByAttendingUserId(userId, limit, cursor, orderBy, {
    byStartDate: {
      min: new Date().toISOString(),
      max: null,
    },
  });
}

type EventPage = { items?: EventSummaryBundle[]; nextCursor?: string };

/** The list filter chips: a type or visibility restriction on top of the date range. */
export type EventListFilter = Pick<EventFilterParams, "byType" | "byVisibility">;

// "Upcoming" means not yet ended, so ongoing events are included (same as online.ntnu.no).
const upcomingRange = () => ({ min: new Date().toISOString(), max: null });
const endedRange = () => ({ min: null, max: new Date().toISOString() });

export async function getUpcomingEvents(
  filter: EventListFilter,
  cursor?: string,
  take: number = 20,
): Promise<EventPage> {
  // Featured pagination uses a numeric offset; expose it as a string to the list's page state.
  const offset = cursor === undefined ? 0 : Number(cursor);
  const items = await client.query("event.findFeaturedEvents", {
    offset,
    limit: take,
    filter: {
      ...filter,
      byEndDate: upcomingRange(),
      excludingType: [],
      excludingVisibility: [],
    },
  }) as EventSummaryBundle[];
  return {
    items,
    nextCursor: items.length < take ? undefined : String(offset + items.length),
  };
}

export async function getEndedEvents(
  filter: EventListFilter,
  cursor?: string,
  take: number = 20,
): Promise<EventPage> {
  return getAllEvents(take, cursor, "desc", { ...filter, byEndDate: endedRange() });
}

export async function getMyEvents(
  userId: string,
  filter: EventListFilter,
  ended: boolean,
  cursor?: string,
  take: number = 20,
): Promise<EventPage> {
  const result = await getAllEventsByAttendingUserId(userId, take, cursor, ended ? "desc" : "asc", {
    ...filter,
    byEndDate: ended ? endedRange() : upcomingRange(),
  });
  return result;
}

export async function getEventsByIds(ids: string[]): Promise<EventSummaryBundle[]> {
  if (ids.length === 0) return [];
  const result = await getAllEvents(ids.length, undefined, "asc", { byId: ids });
  return result.items ?? [];
}

export async function getEvent(
  eventId: string,
): Promise<EventAttendanceBundle | null> {
  const result = await client.query("event.get", eventId);
  // Cast the untyped TRPC response to our EventAttendanceBundle shape.
  // If the backend returns null/undefined, normalize to null.
  return (result as EventAttendanceBundle) ?? null;
}

export async function getUser(): Promise<User | null> {
  const credentials = await Authenticator.getCurrentCredentials();

  if (!credentials) return null;

  var decoded = jwtDecode<UserClaims>(credentials.idToken);

  const result = await client.query("user.get", decoded.sub);
  return result as User;
}

/** Fields a user may change on themselves (monoweb's UserWriteSchema minus admin-only name/email). */
export type UserEdit = Partial<Pick<User, "phone" | "gender" | "biography" | "dietaryRestrictions" | "imageUrl">>;

export async function updateUser(userId: string, input: UserEdit): Promise<User> {
  const result = await client.mutation("user.update", { id: userId, input });
  return result as User;
}

/** Sends a verification link when Auth0 manages the email; otherwise changes it right away. */
export async function requestEmailChange(newEmail: string): Promise<{ verificationSent: boolean }> {
  const result = await client.mutation("user.requestEmailChange", { newEmail });
  return result as { verificationSent: boolean };
}

/** Copies a verified email from Auth0 into the user, after the user clicked the verification link. */
export async function syncEmailFromAuth0(): Promise<User> {
  const result = await client.mutation("user.syncEmailFromAuth0", undefined);
  return result as User;
}

export type PresignedPost = { url: string; fields: Record<string, string> };

export async function createUserFileUpload(filename: string, contentType: string): Promise<PresignedPost> {
  const result = await client.mutation("user.createFileUpload", { filename, contentType });
  return result as PresignedPost;
}

/** Another user's profile. The API returns the full user; screens must only show public fields. */
export async function getUserById(userId: string): Promise<User> {
  const result = await client.query("user.get", userId);
  return result as User;
}

/** Events someone is signed up to; attendance describes the current viewer's registration. */
export async function getEventSummariesByAttendingUserId(
  userId: string,
  ended: boolean,
  cursor?: string,
  take: number = 10,
): Promise<EventPage> {
  return getMyEvents(userId, {}, ended, cursor, take);
}

export async function getGroupsByMember(userId: string): Promise<UserGroup[]> {
  const result = await client.query("group.allByMember", { userId });
  return result as UserGroup[];
}

export async function getRegistrationAvailability(
  attendanceId: string,
): Promise<RegistrationAvailabilityResult | null> {
  const credentials = await Authenticator.getCurrentCredentials();

  if (!credentials) return null;

  var decoded = jwtDecode<UserClaims>(credentials.idToken);

  const result = await client.query(
    "event.attendance.getRegistrationAvailability",
    {
      attendanceId: attendanceId,
      userId: decoded.sub,
    },
  );

  console.log("Availability:", result);

  return result as RegistrationAvailabilityResult;
}

export async function registerForEvent(
  attendanceId: string,
  turnstileToken: string,
): Promise<RegistrationAvailabilityResult | null> {
  const result = await client.mutation("event.attendance.registerForEvent", {
    attendanceId: attendanceId,
    turnstileToken: turnstileToken,
  });

  console.log("Register result:", result);

  return result as RegistrationAvailabilityResult;
}

export async function deregisterForEvent(
  attendanceId: string,
  deregisterType: DeregisterReasonType,
  deregisterReason?: string,
): Promise<RegistrationAvailabilityResult | null> {
  const result = await client.mutation("event.attendance.deregisterForEvent", {
    attendanceId: attendanceId,
    deregisterReason: {
      type: deregisterType,
      details: deregisterReason ?? null,
    },
  });

  return result as RegistrationAvailabilityResult;
}

export async function findChargeAttendeeScheduleDate(
  attendeeId: string,
): Promise<Date | null> {
  try {
    const result = await client.query(
      "event.attendance.findChargeAttendeeScheduleDate",
      { attendeeId },
    );
    return (result as string) ? new Date(result as string) : null;
  } catch (e) {
    return null;
  }
}

export async function getVisibleMarks(userId: string): Promise<VisiblePersonalMark[]> {
  const result = await client.query("personalMark.getVisibleInformation", {
    userId,
    paginate: { take: 100 },
  });
  return (result as VisiblePersonalMark[]) ?? [];
}

export async function getExpiryDateForUser(
  userId: string,
): Promise<any | null> {
  try {
    const result = await client.query("personalMark.getExpiryDateForUser", {
      userId,
    });
    return result ?? null;
  } catch (e) {
    return null;
  }
}

export async function setSelectionsOptions(
  attendeeId: string,
  selections: AttendanceSelectionResponse[],
): Promise<void> {
  try {
    await client.mutation("event.attendance.updateSelectionResponses", {
      attendeeId,
      options: selections,
    });
  } catch (e) {
    console.error("Error setting selections:", e);
    throw e;
  }
}
