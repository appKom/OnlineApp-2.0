import { createTRPCUntypedClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import Authenticator from "./authenticator";
import { jwtDecode } from "jwt-decode";
import { User } from "types/user";
import { UserClaims } from "types/user-claims";

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

export async function getAllEvents() {
  const result = await client.query("event.all");
  return result;
}

export async function getAllEventsByAttendingUserId(userId: string) {
  const credentials = await Authenticator.getCurrentCredentials();

  if (!credentials) return null;

  var decoded = jwtDecode<UserClaims>(credentials.idToken);

  const result = await client.query("event.allByAttendingUserId", {
    id: decoded.sub,
  });
  return result;
}

export async function getEvent(eventId: string) {
  const result = await client.query("event.get", eventId);
  return result;
}

export async function getUser(): Promise<User | null> {
  const credentials = await Authenticator.getCurrentCredentials();

  if (!credentials) return null;

  var decoded = jwtDecode<UserClaims>(credentials.idToken);

  const result = await client.query("user.get", decoded.sub);
  return result as User;
}
