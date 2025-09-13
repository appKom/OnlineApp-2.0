import { createTRPCUntypedClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";

const client = createTRPCUntypedClient({
  links: [
    httpBatchLink({
      url: "https://rpc.online.ntnu.no/api/trpc",
      transformer: superjson,
    }),
  ],
});

export async function getAllEvents() {
  const result = await client.query("event.all");
  return result;
}

export async function getEvent(eventId: string) {
  const result = await client.query("event.get", eventId);
  return result;
}
