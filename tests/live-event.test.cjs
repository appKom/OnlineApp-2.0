const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");

function load(path, overrides, globals = {}) {
  const { outputText } = ts.transpileModule(readFileSync(resolve(__dirname, "..", path), "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  });
  const module = { exports: {} };
  new Function("require", "module", "exports", ...Object.keys(globals), outputText)(
    (id) => { if (Object.hasOwn(overrides, id)) return overrides[id]; throw new Error(`Unexpected native import: ${id}`); },
    module, module.exports, ...Object.values(globals),
  );
  return module.exports;
}

function setup(platform = "ios", nativeAvailable = true, version = "27.0") {
  let now = 1_000_000;
  class Clock extends Date { static now() { return now; } }
  const timing = load("utils/event-timing.ts", {});
  const model = load("utils/live-event-model.ts", { "./event-timing": timing }, { Date: Clock });
  const storage = new Map();
  const files = new Map();
  const instances = [];
  let sequence = 0;
  let failSave = false;
  const cancelledReminders = [];
  const factory = {
    start(props, url, staleDate) {
      assert.ok(files.has(props.qrImageURI), "QR PNG must finish writing before ActivityKit starts");
      const instance = {
        id: String(++sequence), props, url, staleDate,
        getId() { return this.id; },
        async update(next, stale) { this.props = next; this.staleDate = stale; },
        async end(policy) { assert.equal(policy, "immediate"); instances.splice(instances.indexOf(this), 1); },
      };
      instances.push(instance);
      return instance;
    },
    getInstances() { return [...instances]; },
  };
  class File {
    constructor(...parts) { this.uri = parts.join("/"); }
    get exists() { return files.has(this.uri); }
    async write(content, options) { await Promise.resolve(); assert.equal(options.encoding, "base64"); files.set(this.uri, content); }
    delete() { files.delete(this.uri); }
  }
  const createActivity = () => load("utils/live-event-activity.ts", {
    "@react-native-async-storage/async-storage": {
      async getItem(key) { return storage.get(key) ?? null; },
      async setItem(key, value) { if (failSave) throw new Error("save failed"); storage.set(key, value); },
      async removeItem(key) { storage.delete(key); },
    },
    expo: { requireOptionalNativeModule: () => nativeAvailable ? { scheduleEventLiveActivity(name, props, url, start, stale, title, body) {
      assert.equal(name, "OnlineEventActivity");
      const instance = factory.start(JSON.parse(props), url, new Date(stale));
      instance.scheduledAt = start;
      instance.alert = { title, body };
      return instance.id;
    } } : null },
    "react-native": { Platform: { OS: platform, Version: version }, AppState: { currentState: "active" } },
    "expo-widgets": { widgetsDirectory: "file:///shared" },
    "expo-file-system": { File },
    "../widgets/EventLiveActivity": { default: factory },
    "./live-event-model": model,
    "./event-timing": timing,
    "expo-notifications": { async cancelScheduledNotificationAsync(id) { cancelledReminders.push(id); } },
    "./live-event-branding": { async prepareLiveEventBranding() { return { logoLightURI: "file:///shared/blue.png", logoDarkURI: "file:///shared/white.png", markURI: "file:///shared/mark.png" }; } },
  }, { Date: Clock });
  const activity = createActivity();
  // A signed-in user's event in the given phase; `short` runs 20 s to start and 90 s after.
  const fixture = (phase, short = false, eventId = "event-id") => {
    const startsAt = phase === "ongoing" ? now - (short ? 60_000 : 60 * 60_000) : now + (short ? 20_000 : phase === "starting-soon" ? 60 * 60_000 : 15 * 60_000);
    return {
      eventId,
      title: "Online-kveld",
      location: "Kontoret · A4",
      doorsOpenAt: phase === "doors-open" ? now - 1000 : startsAt - 15 * 60_000,
      startsAt,
      endsAt: short ? startsAt + 90_000 : startsAt + 2 * 60 * 60_000,
      ...model.liveEventLinks(eventId),
      ownerId: "user",
      registrationStatus: "REGISTERED",
    };
  };
  const scheduled = (eventId = "event-id", hours = 2) => ({ ...fixture("starting-soon", false, eventId), doorsOpenAt: now + hours * 60 * 60_000 - 15 * 60_000, startsAt: now + hours * 60 * 60_000, endsAt: now + (hours + 1) * 60 * 60_000 });
  return { model, activity, fixture, scheduled, reload: createActivity, instances, files, storage, cancelledReminders, setNow: (value) => { now = value; }, failSave: () => { failSave = true; } };
}

const sessionIds = (activity) => activity.getLiveEventSessions().map((session) => session.event.eventId);

test("doors, start and end use exact inclusive boundaries", () => {
  const { model, fixture } = setup();
  const event = fixture("doors-open");
  assert.equal(model.getLiveEventPhase(event, event.startsAt - 60 * 60_000 - 1), "upcoming");
  assert.equal(model.getLiveEventPhase(event, event.startsAt - 60 * 60_000), "starting-soon");
  assert.equal(model.getLiveEventPhase(event, event.doorsOpenAt - 1), "starting-soon");
  assert.equal(model.getLiveEventPhase(event, event.doorsOpenAt), "doors-open");
  assert.equal(model.getLiveEventPhase(event, event.startsAt - 1), "doors-open");
  assert.equal(model.getLiveEventPhase(event, event.startsAt), "ongoing");
  assert.equal(model.getLiveEventPhase(event, event.endsAt), "ended");
  assert.throws(() => model.validateLiveEvent({ ...event, endsAt: NaN }));
  assert.throws(() => model.validateLiveEvent({ ...event, endsAt: event.startsAt }));
});

test("event and ticket links safely encode event IDs", () => {
  const { model } = setup();
  const url = new URL(model.liveEventLinks("event & id").ticketURL);
  assert.equal(url.searchParams.get("eventId"), "event & id");
  assert.equal(url.searchParams.get("showTicket"), "1");
});

test("a short event advances to ongoing and cleans up on expiry", async () => {
  const { activity, fixture, instances, files, storage, setNow } = setup();
  const event = fixture("doors-open", true);
  await activity.startLiveEvent(event, "png");
  assert.equal(instances[0].url, event.eventURL);
  assert.equal(instances[0].props.phase, "doors-open");
  setNow(event.startsAt);
  await activity.reconcileLiveEvents("user");
  assert.equal(instances[0].props.phase, "ongoing");
  assert.equal(instances[0].props.intervalEnd, event.endsAt);
  setNow(event.endsAt);
  await activity.reconcileLiveEvents("user");
  assert.equal(instances.length, 0);
  assert.equal(files.size, 0);
  assert.equal(storage.size, 0);
  assert.deepEqual(activity.getLiveEventSessions(), []);
});

test("several events keep their own banner and ticket", async () => {
  const { activity, fixture, scheduled, instances, files, setNow } = setup();
  await activity.startLiveEvent(fixture("ongoing", false, "now"), "now-png");
  await activity.startLiveEvent(scheduled("tomorrow", 24), "tomorrow-png");
  await activity.startLiveEvent(scheduled("next-week", 24 * 7), "week-png");
  assert.deepEqual(sessionIds(activity), ["now", "tomorrow", "next-week"]);
  assert.equal(instances.length, 3);
  assert.deepEqual([...files.values()].sort(), ["now-png", "tomorrow-png", "week-png"]);
  assert.equal(instances[1].scheduledAt, 1_000_000 + 23 * 60 * 60_000);
  await activity.stopLiveEvent("tomorrow");
  assert.deepEqual(sessionIds(activity), ["now", "next-week"]);
  assert.deepEqual([...files.values()].sort(), ["now-png", "week-png"]);
  setNow(1_000_000 + 2 * 60 * 60_000);
  await activity.reconcileLiveEvents("user");
  assert.deepEqual(sessionIds(activity), ["next-week"]);
});

test("restarting an event replaces only its own banner", async () => {
  const { activity, fixture, instances, files } = setup();
  await activity.startLiveEvent(fixture("ongoing", false, "other"), "other-png");
  await Promise.all([
    activity.startLiveEvent(fixture("ongoing"), "first-png"),
    activity.startLiveEvent(fixture("ongoing"), "second-png"),
  ]);
  assert.deepEqual(sessionIds(activity), ["other", "event-id"]);
  assert.equal(instances.length, 2);
  assert.deepEqual([...files.values()].sort(), ["other-png", "second-png"]);
});

test("waitlist promotion and reserved places update the existing ticket and survive relaunch", async () => {
  const { activity, reload, fixture, instances } = setup();
  const event = { ...fixture("starting-soon"), registrationStatus: "QUEUED" };
  await activity.startLiveEvent(event, "ticket-png");
  const id = instances[0].id;
  const qr = instances[0].props.qrImageURI;
  await activity.updateLiveEventRegistration(event.eventId, "other-user", "REGISTERED");
  assert.equal(instances[0].props.registrationStatus, "QUEUED");
  for (const state of ["RESERVED", "REGISTERED"]) {
    await activity.updateLiveEventRegistration(event.eventId, "user", state);
    assert.equal(instances[0].props.registrationStatus, state);
    assert.equal(instances[0].id, id);
    assert.equal(instances[0].props.qrImageURI, qr);
  }
  const restored = reload();
  await restored.reconcileLiveEvents("user");
  assert.equal(restored.getLiveEventSessions()[0].event.registrationStatus, "REGISTERED");
});

test("registration updates preserve the pending native start", async () => {
  const { activity, scheduled, instances } = setup();
  const event = { ...scheduled(), registrationStatus: "QUEUED" };
  await activity.startLiveEvent(event, "ticket-png");
  const { id, scheduledAt } = instances[0];
  await activity.updateLiveEventRegistration(event.eventId, "user", "REGISTERED");
  assert.equal(instances[0].id, id);
  assert.equal(instances[0].scheduledAt, scheduledAt);
  assert.equal(instances[0].props.registrationStatus, "REGISTERED");
  assert.equal(activity.getLiveEventSessions()[0].phase, "upcoming");
});

test("scheduled activities survive relaunch and start at the reminder time", async () => {
  const { activity, reload, fixture, scheduled, instances, cancelledReminders, setNow } = setup();
  const event = scheduled();
  await activity.startLiveEvent(event, "png");
  await activity.startLiveEvent(fixture("ongoing", false, "now"), "png");
  // The scheduled start's required alert replaces only that event's local reminder.
  assert.deepEqual(cancelledReminders, ["event-reminder:event-id:start"]);
  assert.deepEqual(instances[0].alert, { title: "Starter om en time", body: "Online-kveld · Kontoret · A4" });
  await activity.stopLiveEvent("now");
  assert.equal(instances[0].scheduledAt, event.startsAt - 60 * 60_000);
  assert.equal(instances[0].props.phase, "starting-soon");
  assert.equal(instances[0].staleDate.getTime(), event.doorsOpenAt);
  const restored = reload();
  await restored.reconcileLiveEvents("user");
  assert.equal(restored.getLiveEventSessions()[0].phase, "upcoming");
  setNow(instances[0].scheduledAt);
  await restored.reconcileLiveEvents("user");
  assert.equal(restored.getLiveEventSessions()[0].phase, "starting-soon");
  setNow(event.doorsOpenAt);
  await restored.reconcileLiveEvents("user");
  assert.equal(instances[0].props.phase, "doors-open");
  assert.equal(instances[0].staleDate.getTime(), event.startsAt);
});

test("a banner saved by the single-banner build is migrated", async () => {
  const { activity, reload, fixture, instances, storage } = setup();
  await activity.startLiveEvent(fixture("ongoing"), "png");
  const [session] = activity.getLiveEventSessions();
  storage.clear();
  storage.set("online.live-event.v1", JSON.stringify(session));
  const restored = reload();
  await restored.reconcileLiveEvents("user");
  assert.equal(restored.getLiveEventSessions()[0].activityId, session.activityId);
  assert.equal(instances.length, 1);
  assert.ok(!storage.has("online.live-event.v1"));
  assert.ok(storage.has("online.live-events.v2"));
});

test("logout and a different user remove every ticket", async () => {
  const { activity, fixture, scheduled, instances } = setup();
  await activity.startLiveEvent(fixture("ongoing"), "png");
  await activity.startLiveEvent(scheduled("later"), "png");
  await activity.reconcileLiveEvents("other-user");
  assert.equal(instances.length, 0);
  await activity.startLiveEvent(fixture("ongoing"), "png");
  await activity.stopLiveEvent();
  assert.equal(instances.length, 0);
  assert.deepEqual(await activity.getDismissedLiveEvents(), []);
});

test("user dismissal is remembered and only affects that event", async () => {
  const { activity, fixture, instances, files } = setup();
  await activity.startLiveEvent(fixture("ongoing"), "png");
  await activity.startLiveEvent(fixture("ongoing", false, "kept"), "kept-png");
  instances.splice(0, 1);
  await activity.reconcileLiveEvents("user");
  assert.deepEqual(sessionIds(activity), ["kept"]);
  assert.deepEqual([...files.values()], ["kept-png"]);
  assert.deepEqual(await activity.getDismissedLiveEvents(), ["event-id"]);
});

test("an interrupted persistence write rolls back the native activity and QR", async () => {
  const { activity, fixture, instances, files, failSave } = setup();
  failSave();
  await assert.rejects(activity.startLiveEvent(fixture("ongoing"), "png"), /save failed/);
  assert.equal(instances.length, 0);
  assert.equal(files.size, 0);
  assert.deepEqual(activity.getLiveEventSessions(), []);
});

test("unsupported runtimes do not initialize the native layout", async () => {
  for (const [platform, available] of [["android", true], ["ios", false], ["web", false]]) {
    const { activity, fixture, instances } = setup(platform, available);
    assert.ok(activity.liveActivityAvailability());
    await assert.rejects(activity.startLiveEvent(fixture("ongoing"), "png"));
    assert.equal(instances.length, 0);
  }
});

test("cancelling a scheduled activity removes its QR before its native start", async () => {
  const { activity, scheduled, instances, files } = setup();
  await activity.startLiveEvent(scheduled(), "png");
  await activity.stopLiveEvent("event-id");
  assert.equal(instances.length, 0);
  assert.equal(files.size, 0);
});

test("older iOS supports the one-hour stage but refuses advance scheduling", async () => {
  const { activity, fixture, scheduled, instances } = setup("ios", true, "18.0");
  await assert.rejects(activity.startLiveEvent(scheduled(), "png"), /iOS 26/);
  await activity.startLiveEvent(fixture("starting-soon"), "png");
  assert.equal(instances[0].props.phase, "starting-soon");
});

test("appearance changes update every native activity using app theme tokens", async () => {
  const { activity, fixture, scheduled, instances } = setup();
  await activity.startLiveEvent(fixture("ongoing"), "png");
  await activity.startLiveEvent(scheduled("later"), "png");
  await activity.setLiveEventAppearance({ backgroundColor: "#F6FAFE", textColor: "#181C1F", mutedColor: "#41484D", accentColor: "#206487", isDark: false });
  for (const instance of instances) {
    assert.equal(instance.props.backgroundColor, "#F6FAFE");
    assert.equal(instance.props.logoURI, "file:///shared/blue.png");
    assert.equal(instance.props.markURI, "file:///shared/mark.png");
  }
});

test("the planner covers the next attended events, soonest first", () => {
  const { model, fixture, scheduled } = setup();
  const candidate = (event) => ({ event, ticketValue: `ticket-${event.eventId}` });
  const soon = candidate(fixture("starting-soon", false, "soon"));
  const tomorrow = candidate(scheduled("tomorrow", 24));
  const nextWeek = candidate(scheduled("next-week", 24 * 7));
  const later = candidate(scheduled("later", 24 * 30));
  const ended = candidate({ ...fixture("ongoing", false, "ended"), startsAt: 0, doorsOpenAt: 0, endsAt: 1 });
  const session = ({ event }, phase = "upcoming") => ({ event, qrImageURI: "file:///shared/qr.png", activityId: event.eventId, phase });
  const all = [later, ended, nextWeek, tomorrow, soon];

  assert.deepEqual(model.planLiveEvents(all, [], [], true), { start: [soon, tomorrow, nextWeek], update: [], stop: [], retryAt: undefined });
  // Existing banners are refreshed, not restarted; a sooner sign-up pushes the last one out.
  const running = [session(soon, "starting-soon"), session(nextWeek), session(later)];
  assert.deepEqual(model.planLiveEvents(all, running, [], true), { start: [tomorrow], update: [soon, nextWeek], stop: ["later"], retryAt: undefined });
  // Dismissed events are skipped, and the next one moves up.
  assert.deepEqual(model.planLiveEvents(all, [], ["soon"], true).start, [tomorrow, nextWeek, later]);
  // No longer attended (unregistered here or on the website): the banner ends.
  assert.deepEqual(model.planLiveEvents([soon], [session(tomorrow)], [], true).stop, ["tomorrow"]);
  // A banner left by another user is not counted as this user's.
  assert.deepEqual(model.planLiveEvents([soon], [session({ event: { ...soon.event, ownerId: "other" } })], [], true), { start: [soon], update: [], stop: ["soon"], retryAt: undefined });
  // Without advance scheduling only the current hour's events start; check back for the next.
  assert.deepEqual(model.planLiveEvents(all, [], [], false), { start: [soon], update: [], stop: [], retryAt: tomorrow.event.startsAt - 60 * 60_000 });
});
