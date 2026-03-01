import { createTRPCUntypedClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import Authenticator from "./authenticator";
import { jwtDecode } from "jwt-decode";
import { User } from "types/user";
import { UserClaims } from "types/user-claims";
import {
  RegistrationAvailabilityResult,
  EventAttendanceBundle,
  AttendanceSelectionResponse,
  EventFilterParams
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
      async headers() {
        const accessToken = await Authenticator.getAccessToken();

        if (!accessToken) {
          return {};
        }

        return {
          Authorization: `Bearer ${accessToken}`,
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
): Promise<{ items?: EventAttendanceBundle[]; nextCursor?: string }> {
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
      orderBy,
    },
  };

  const result = await client.query("event.all", params);
  return result as { items?: EventAttendanceBundle[]; nextCursor?: string };
}

export async function getAllPastEvents(
  take: number = 20,
  cursor?: string,
  orderBy: order = "desc",
): Promise<{ items?: EventAttendanceBundle[]; nextCursor?: string }> {
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
): Promise<{ items?: EventAttendanceBundle[]; nextCursor?: string }> {
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
): Promise<{ items?: EventAttendanceBundle[]; nextCursor?: string } | null> {
  const params: any = { 
    id: userId, 
    take: limit,
    filter: {
      byStartDate: filter?.byStartDate ?? {
        max: null,
        min: null,
      },
      byEndDate: filter?.byEndDate ?? {
        max: null,
        min: null,
      },
      orderBy,
    },
  };
  if (cursor) {
    params.cursor = cursor;
  }

  const result = await client.query("event.allByAttendingUserId", params);
  return result as { items?: EventAttendanceBundle[]; nextCursor?: string };
}

export async function getAllPastEventsByAttendingUserId(
  userId: string,
  limit: number = 20,
  cursor?: string,
  orderBy: order = "desc",
): Promise<{ items?: EventAttendanceBundle[]; nextCursor?: string } | null> {
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
): Promise<{ items?: EventAttendanceBundle[]; nextCursor?: string } | null> {
  return getAllEventsByAttendingUserId(userId, limit, cursor, orderBy, {
    byStartDate: {
      min: new Date().toISOString(),
      max: null,
    },
  });
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
