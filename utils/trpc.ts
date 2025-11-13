import { createTRPCUntypedClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import Authenticator from "./authenticator";
import { jwtDecode } from "jwt-decode";
import { User } from "types/user";
import { UserClaims } from "types/user-claims";
import { RegistrationAvailabilityResult, EventAttendanceBundle } from "types/event";

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

export async function getAllEvents(): Promise<{ items?: EventAttendanceBundle[] }> {
  const result = await client.query("event.all");
  // The TRPC client is untyped here; cast to the expected shape so callers
  // can access `items` safely. If the backend response shape changes this
  // cast may be incorrect and should be updated.
  return result as { items?: EventAttendanceBundle[] };
}

export async function getAllEventsByAttendingUserId(userId: string): Promise<{ items?: EventAttendanceBundle[] } | null> {
  const credentials = await Authenticator.getCurrentCredentials();

  if (!credentials) return null;

  var decoded = jwtDecode<UserClaims>(credentials.idToken);

  const result = await client.query("event.allByAttendingUserId", {
    id: decoded.sub,
  });
  return result as { items?: EventAttendanceBundle[] };
}

export async function getEvent(eventId: string): Promise<EventAttendanceBundle | null> {
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
  attendanceId: string
): Promise<RegistrationAvailabilityResult | null> {
  const credentials = await Authenticator.getCurrentCredentials();

  if (!credentials) return null;

  var decoded = jwtDecode<UserClaims>(credentials.idToken);

  const result = await client.query(
    "event.attendance.getRegistrationAvailability",
    {
      attendanceId: attendanceId,
      userId: decoded.sub,
    }
  );

  console.log("Availability:", result);

  return result as RegistrationAvailabilityResult;
}
