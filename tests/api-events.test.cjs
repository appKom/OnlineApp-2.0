const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { createRequire } = require("node:module");
const { resolve } = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");

// Load app TypeScript with only native boundaries stubbed; use the real tRPC transport.
function loadAppModule(path, overrides = {}, globals = {}) {
  const filename = resolve(__dirname, "..", path);
  const localRequire = createRequire(filename);
  const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  });
  const module = { exports: {} };
  const requireModule = (id) => Object.hasOwn(overrides, id) ? overrides[id] : localRequire(id);
  new Function("require", "module", "exports", ...Object.keys(globals), outputText)(
    requireModule, module, module.exports, ...Object.values(globals),
  );
  return module.exports;
}

async function createApi(responseFor, token = null) {
  const { default: superjson } = await import("superjson");
  const requests = [];
  const fetch = async (url, options) => {
    const parsed = new URL(url);
    const paths = parsed.pathname.split("/").at(-1).split(",");
    const inputs = JSON.parse(options.body ?? parsed.searchParams.get("input"));
    const request = {
      method: options.method,
      headers: new Headers(options.headers),
      operations: paths.map((path, i) => ({ path, input: superjson.deserialize(inputs[i]) })),
    };
    requests.push(request);
    const responses = request.operations.map(({ path, input }) => responseFor(path, input));
    if (responses[0] instanceof Response) return responses[0];
    return new Response(JSON.stringify(responses.map((data) => ({
      result: { data: superjson.serialize(data) },
    }))), { headers: { "Content-Type": "application/json" } });
  };
  const api = loadAppModule("utils/trpc.ts", {
    superjson,
    "./authenticator": { getAccessToken: async () => token },
  }, { fetch });
  return { api, requests };
}

const user = { id: "viewer" };
const eventStart = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
const attendee = {
  id: "ticket-id",
  userId: user.id,
  registered: true,
  completionDeadline: new Date(Date.now() + 60 * 60 * 1000),
  paymentChargedAt: null,
  paymentReservedAt: null,
  paymentRefundedAt: null,
};
const summary = {
  event: { id: "event-id", title: "Event", start: eventStart, end: eventStart, locationTitle: "Office" },
  attendance: {
    registerStart: eventStart,
    registerEnd: eventStart,
    attendancePrice: 100,
    pools: [{ capacity: 30 }, { capacity: 20 }],
    currentUserAttendee: attendee,
    registeredAttendeeCount: 42,
  },
};

test("anonymous batched queries carry the app source without an Authorization header", async () => {
  const { api, requests } = await createApi((path) => path === "event.findFeaturedEvents" ? [] : { items: [] });
  await Promise.all([api.getUpcomingEvents({}), api.getEndedEvents({})]);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].operations.length, 2);
  assert.equal(requests[0].headers.get("X-Request-Source"), "online-app");
  assert.equal(requests[0].headers.has("Authorization"), false);
});

test("authenticated queries and mutations keep both source and bearer headers", async () => {
  const { api, requests } = await createApi(() => ({ items: [] }), "access-token");
  await Promise.all([api.getMyEvents(user.id, {}, false), api.updateUser(user.id, { biography: "Hello" })]);
  assert.equal(requests.length, 2);
  assert.deepEqual(requests.map((request) => request.method).sort(), ["GET", "POST"]);
  for (const request of requests) {
    assert.equal(request.headers.get("X-Request-Source"), "online-app");
    assert.equal(request.headers.get("Authorization"), "Bearer access-token");
  }
});

test("a query retried after an HTML proxy response retains source and authorization", async () => {
  let attempt = 0;
  const { api, requests } = await createApi(() => ++attempt === 1
    ? new Response("<html>Unavailable</html>", { status: 503, headers: { "Content-Type": "text/html" } })
    : { items: [summary] }, "access-token");
  const result = await api.getEndedEvents({});
  assert.equal(result.items[0].event.id, summary.event.id);
  assert.equal(requests.length, 2);
  for (const request of requests) {
    assert.equal(request.headers.get("X-Request-Source"), "online-app");
    assert.equal(request.headers.get("Authorization"), "Bearer access-token");
  }
});

test("featured pages preserve server ranking and advance by numeric offset", async () => {
  const ranked = [
    { ...summary, event: { ...summary.event, id: "later", start: new Date(eventStart.getTime() + 1000) } },
    { ...summary, event: { ...summary.event, id: "earlier" } },
  ];
  const { api, requests } = await createApi((path, input) => {
    assert.equal(path, "event.findFeaturedEvents");
    return input.offset === 0 ? ranked : [summary];
  });
  const filter = { byType: ["COMPANY"], byVisibility: ["COMMITTEE_ONLY"] };
  const first = await api.getUpcomingEvents(filter, undefined, 2);
  const last = await api.getUpcomingEvents(filter, first.nextCursor, 2);
  assert.deepEqual(first.items.map((bundle) => bundle.event.id), ["later", "earlier"]);
  assert.equal(first.nextCursor, "2");
  assert.equal(last.nextCursor, undefined);
  assert.deepEqual(requests.map((request) => request.operations[0].input.offset), [0, 2]);
  for (const request of requests) {
    const input = request.operations[0].input;
    assert.equal(input.limit, 2);
    assert.deepEqual(input.filter.byType, filter.byType);
    assert.deepEqual(input.filter.byVisibility, filter.byVisibility);
    assert.deepEqual(input.filter.excludingVisibility, []);
    assert.ok(input.filter.byEndDate.min);
    assert.equal(input.filter.byEndDate.max, null);
    assert.equal(input.filter.byStartDate, undefined); // Include ongoing events.
  }
});

test("past events and bookmarks use summaries and retain date, ID and cursor filters", async () => {
  const { api, requests } = await createApi((path) => {
    assert.equal(path, "event.allSummaries");
    return { items: [summary], nextCursor: summary.event.id };
  });
  const past = await api.getEndedEvents({ byType: ["SOCIAL"] }, "previous-id", 10);
  assert.equal(past.nextCursor, summary.event.id);
  const pastInput = requests[0].operations[0].input;
  assert.equal(pastInput.cursor, "previous-id");
  assert.equal(pastInput.take, 10);
  assert.equal(pastInput.filter.orderBy, "desc");
  assert.equal(pastInput.filter.byEndDate.min, null);
  assert.ok(pastInput.filter.byEndDate.max);
  assert.deepEqual(pastInput.filter.byType, ["SOCIAL"]);
  await api.getEventsByIds([summary.event.id]);
  assert.deepEqual(requests[1].operations[0].input.filter.byId, [summary.event.id]);
  assert.deepEqual(await api.getEventsByIds([]), []);
  assert.equal(requests.length, 2);
});

test("mine and profile queries retain attendance summaries and use ID pagination", async () => {
  const { api, requests } = await createApi((path) => {
    assert.equal(path, "event.allSummariesByAttendingUserId");
    return { items: [summary], nextCursor: summary.event.id };
  }, "access-token");
  const mine = await api.getMyEvents(user.id, { byVisibility: ["COMMITTEE_ONLY"] }, false, "previous-id", 10);
  const profile = await api.getEventSummariesByAttendingUserId("other-user", true);
  await api.getAllFutureEventsByAttendingUserId(user.id, 1);
  assert.equal(mine.items[0].attendance.currentUserAttendee.id, attendee.id);
  assert.equal(profile.items[0].attendance.registeredAttendeeCount, 42);
  const inputs = requests.map((request) => request.operations[0].input);
  assert.equal(inputs[0].id, user.id);
  assert.equal(inputs[0].cursor, "previous-id");
  assert.equal(inputs[0].filter.orderBy, "asc");
  assert.deepEqual(inputs[0].filter.byVisibility, ["COMMITTEE_ONLY"]);
  assert.equal(inputs[1].id, "other-user");
  assert.equal(inputs[1].filter.orderBy, "desc");
  assert.ok(inputs[1].filter.byEndDate.max);
  assert.equal(inputs[2].take, 1);
  assert.ok(inputs[2].filter.byStartDate.min);
});

test("event details still fetch full attendance", async () => {
  const full = { ...summary, attendance: { attendees: [attendee] } };
  const { api } = await createApi((path, input) => {
    assert.equal(path, "event.get");
    assert.equal(input, summary.event.id);
    return full;
  });
  assert.deepEqual(await api.getEvent(summary.event.id), full);
});

const attendance = loadAppModule("utils/attendance.ts", { "./user-utils": {} });

test("summary attendance supports capacity, viewer identity and payment deadlines", () => {
  assert.equal(attendance.getAttendanceCapacity(summary.attendance), 50);
  assert.equal(attendance.getAttendee(summary.attendance, user), attendee);
  assert.equal(attendance.getAttendee(summary.attendance, { id: "another-user" }), null);
  assert.equal(attendance.getAttendee(summary.attendance, null), null);
  assert.equal(attendance.getAttendee({ ...summary.attendance, currentUserAttendee: null }, user), null);
  assert.equal(attendance.hasAttendeePaid(summary.attendance, attendee), false);
  assert.deepEqual(attendance.getPendingPaymentDeadline(summary.attendance, attendee), attendee.completionDeadline);
  const paid = { ...attendee, paymentChargedAt: new Date() };
  assert.equal(attendance.getPendingPaymentDeadline(summary.attendance, paid), null);
  assert.equal(attendance.getAttendee({ attendees: [attendee] }, user), attendee);
});

test("attendee state follows monoweb's completion rules", () => {
  const paid = { ...attendee, paymentChargedAt: new Date() };
  const queued = { ...attendee, registered: false };
  assert.equal(attendance.getAttendeeState(summary.attendance, null), null);
  assert.equal(attendance.getAttendeeState(summary.attendance, queued), "QUEUED");
  assert.equal(attendance.getAttendeeState(summary.attendance, attendee), "RESERVED");
  assert.deepEqual(attendance.getMissingCompletionRequirements(summary.attendance, attendee), ["PAYMENT"]);
  assert.equal(attendance.getAttendeeState(summary.attendance, paid), "REGISTERED");
  assert.equal(attendance.getAttendeeState({ attendancePrice: null }, attendee), "REGISTERED");
  assert.deepEqual(attendance.getMissingCompletionRequirements({ attendancePrice: 0 }, attendee), []);
});

test("reminders reconcile both full events and summaries without confusing profile owners with viewers", async () => {
  const scheduled = [];
  const notifications = {
    SchedulableTriggerInputTypes: { DATE: "date" },
    getPermissionsAsync: async () => ({ status: "granted" }),
    getAllScheduledNotificationsAsync: async () => [],
    cancelScheduledNotificationAsync: async () => {},
    scheduleNotificationAsync: async (reminder) => scheduled.push(reminder),
  };
  const reminders = loadAppModule("utils/reminders.ts", {
    "expo-notifications": notifications,
    "react-native": { Platform: { OS: "ios" } },
    "./attendance": attendance,
  });
  const bookmarked = {
    event: { ...summary.event, id: "bookmark" },
    attendance: { ...summary.attendance, currentUserAttendee: null },
  };
  const full = {
    event: { ...summary.event, id: "full-event" },
    attendance: { ...summary.attendance, attendees: [attendee] },
  };
  delete full.attendance.currentUserAttendee;
  await reminders.syncEventReminders([summary, bookmarked, full], user, (id) => id === "bookmark");
  assert.deepEqual(scheduled.map((reminder) => reminder.identifier).sort(), [
    "event-reminder:bookmark:registration",
    "event-reminder:event-id:start",
    "event-reminder:full-event:start",
  ]);
  const count = scheduled.length;
  await reminders.updateEventReminders(summary, { id: "profile-owner" }, false);
  assert.equal(scheduled.length, count);
});
