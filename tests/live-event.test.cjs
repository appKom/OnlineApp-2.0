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
    expo: { requireOptionalNativeModule: () => nativeAvailable ? { scheduleEventLiveActivity(name, props, url, start, stale) {
      assert.equal(name, "OnlineEventActivity");
      const instance = factory.start(JSON.parse(props), url, new Date(stale));
      instance.scheduledAt = start;
      return instance.id;
    } } : null },
    "react-native": { Platform: { OS: platform, Version: version }, AppState: { currentState: "active" } },
    "expo-widgets": { widgetsDirectory: "file:///shared" },
    "expo-file-system": { File },
    "../widgets/EventLiveActivity": { default: factory },
    "./live-event-model": model,
    "./event-timing": timing,
    "./live-event-branding": { async prepareLiveEventBranding() { return { logoLightURI: "file:///shared/blue.png", logoDarkURI: "file:///shared/white.png", markURI: "file:///shared/mark.png" }; } },
    "expo-notifications": { async cancelScheduledNotificationAsync(id) { cancelledReminders.push(id); } },
  }, { Date: Clock });
  const activity = createActivity();
  return { model, activity, reload: createActivity, instances, files, storage, cancelledReminders, setNow: (value) => { now = value; }, failSave: () => { failSave = true; } };
}

test("doors, start and end use exact inclusive boundaries", () => {
  const { model } = setup();
  const event = model.makeDemoEvent("doors-open");
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

test("accelerated demo advances to ongoing and cleans up on expiry", async () => {
  const { model, activity, instances, files, storage, setNow } = setup();
  const event = model.makeDemoEvent("doors-open", 1_000_000, true);
  await activity.startLiveEvent(event, "png");
  assert.equal(instances.length, 1);
  assert.equal(instances[0].url, event.eventURL);
  assert.equal(instances[0].props.phase, "doors-open");
  setNow(event.startsAt);
  await activity.reconcileLiveEvent();
  assert.equal(instances[0].props.phase, "ongoing");
  assert.equal(instances[0].props.intervalEnd, event.endsAt);
  setNow(event.endsAt);
  await activity.reconcileLiveEvent();
  assert.equal(instances.length, 0);
  assert.equal(files.size, 0);
  assert.equal(storage.size, 0);
  assert.equal(activity.getLiveEventSession(), null);
});

test("manual state changes update the same activity and preserve its ticket", async () => {
  const { model, activity, instances } = setup();
  await activity.startLiveEvent(model.makeDemoEvent("doors-open"), "ticket-png");
  const id = instances[0].id;
  const qr = instances[0].props.qrImageURI;
  await activity.updateLiveEvent(model.makeDemoEvent("ongoing"));
  assert.equal(instances[0].id, id);
  assert.equal(instances[0].props.qrImageURI, qr);
  assert.equal(instances[0].props.phase, "ongoing");
});

test("waitlist promotion and reserved places update the existing ticket and survive relaunch", async () => {
  const { model, activity, reload, instances } = setup();
  const event = { ...model.makeDemoEvent("starting-soon"), ownerId: "user", registrationStatus: "QUEUED" };
  await activity.startLiveEvent(event, "ticket-png");
  const id = instances[0].id;
  const qr = instances[0].props.qrImageURI;
  assert.equal(instances[0].props.registrationStatus, "QUEUED");
  await activity.updateLiveEventRegistration(event.eventId, "other-user", "REGISTERED");
  assert.equal(instances[0].props.registrationStatus, "QUEUED");
  for (const state of ["RESERVED", "REGISTERED"]) {
    await activity.updateLiveEventRegistration(event.eventId, "user", state);
    assert.equal(instances[0].props.registrationStatus, state);
    assert.equal(instances[0].id, id);
    assert.equal(instances[0].props.qrImageURI, qr);
  }
  const restored = reload();
  await restored.reconcileLiveEvent("user");
  assert.equal(restored.getLiveEventSession().event.registrationStatus, "REGISTERED");
});

test("registration updates preserve the pending native start", async () => {
  const { model, activity, instances } = setup();
  const event = { ...model.makeScheduledDemoEvent(), registrationStatus: "QUEUED" };
  await activity.startLiveEvent(event, "ticket-png");
  const id = instances[0].id;
  const scheduledAt = instances[0].scheduledAt;
  await activity.updateLiveEventRegistration(event.eventId, null, "REGISTERED");
  assert.equal(instances[0].id, id);
  assert.equal(instances[0].scheduledAt, scheduledAt);
  assert.equal(instances[0].props.registrationStatus, "REGISTERED");
  assert.equal(activity.getLiveEventSession().phase, "upcoming");
});

test("concurrent starts leave one banner and one QR for the last requested event", async () => {
  const { model, activity, instances, files } = setup();
  const first = model.makeDemoEvent("ongoing");
  const second = { ...first, eventId: "second-event", title: "Second event" };
  await Promise.all([
    activity.startLiveEvent(first, "first-png"),
    activity.startLiveEvent(second, "second-png"),
  ]);
  assert.equal(instances.length, 1);
  assert.equal(files.size, 1);
  assert.equal(activity.getLiveEventSession().event.eventId, "second-event");
  assert.equal(files.get(instances[0].props.qrImageURI), "second-png");
});

test("relaunch recovers the existing activity and updates the elapsed phase", async () => {
  const { model, activity, reload, instances, setNow } = setup();
  const event = model.makeDemoEvent("doors-open");
  await activity.startLiveEvent(event, "png");
  const id = instances[0].id;
  setNow(event.startsAt);
  const restored = reload();
  await restored.reconcileLiveEvent();
  assert.equal(restored.getLiveEventSession().activityId, id);
  assert.equal(instances.length, 1);
  assert.equal(instances[0].props.phase, "ongoing");
});

test("logout removes a real ticket; the anonymous demo remains available", async () => {
  const { model, activity, instances } = setup();
  await activity.startLiveEvent({ ...model.makeDemoEvent("ongoing"), ownerId: "user-id" }, "real-png");
  await activity.reconcileLiveEvent(null);
  assert.equal(instances.length, 0);
  await activity.startLiveEvent(model.makeDemoEvent("ongoing"), "demo-png");
  await activity.reconcileLiveEvent(null);
  assert.equal(instances.length, 1);
});

test("user dismissal is respected and never recreates the banner", async () => {
  const { model, activity, instances, files } = setup();
  await activity.startLiveEvent(model.makeDemoEvent("ongoing"), "png");
  instances.length = 0;
  await activity.reconcileLiveEvent();
  assert.equal(activity.getLiveEventSession(), null);
  assert.equal(files.size, 0);
});

test("an interrupted persistence write rolls back the native activity and QR", async () => {
  const { model, activity, instances, files, failSave } = setup();
  failSave();
  await assert.rejects(activity.startLiveEvent(model.makeDemoEvent("ongoing"), "png"), /save failed/);
  assert.equal(instances.length, 0);
  assert.equal(files.size, 0);
});

test("unsupported runtimes do not initialize the native layout", async () => {
  for (const [platform, available] of [["android", true], ["ios", false], ["web", false]]) {
    const { activity, model, instances } = setup(platform, available);
    assert.ok(activity.liveActivityAvailability());
    await assert.rejects(activity.startLiveEvent(model.makeDemoEvent("ongoing"), "png"));
    assert.equal(instances.length, 0);
  }
});

test("event and ticket links safely encode event IDs", () => {
  const { model } = setup();
  const links = model.liveEventLinks("event & id");
  const url = new URL(links.ticketURL);
  assert.equal(url.searchParams.get("eventId"), "event & id");
  assert.equal(url.searchParams.get("showTicket"), "1");
});

test("scheduled native activity survives relaunch and starts at the reminder boundary", async () => {
  const { model, activity, reload, instances, setNow, cancelledReminders } = setup();
  const event = { ...model.makeDemoEvent("starting-soon"), ownerId: "user", startsAt: 10_000_000, doorsOpenAt: 9_100_000, endsAt: 14_000_000 };
  await activity.startLiveEvent(event, "png");
  assert.equal(instances[0].scheduledAt, event.startsAt - 60 * 60_000);
  assert.equal(instances[0].props.phase, "starting-soon");
  assert.equal(instances[0].staleDate.getTime(), event.doorsOpenAt);
  assert.deepEqual(cancelledReminders, ["event-reminder:local-live-banner-demo:start"]);
  const restored = reload();
  await restored.reconcileLiveEvent("user");
  assert.equal(restored.getLiveEventSession().phase, "upcoming");
  setNow(instances[0].scheduledAt);
  await restored.reconcileLiveEvent("user");
  assert.equal(restored.getLiveEventSession().phase, "starting-soon");
  setNow(event.doorsOpenAt);
  await restored.reconcileLiveEvent("user");
  assert.equal(instances[0].props.phase, "doors-open");
  assert.equal(instances[0].staleDate.getTime(), event.startsAt);
});

test("cancelling a scheduled activity removes its QR before its native start", async () => {
  const { model, activity, instances, files } = setup();
  await activity.startLiveEvent(model.makeScheduledDemoEvent(), "png");
  assert.equal(activity.getLiveEventSession().phase, "upcoming");
  await activity.stopLiveEvent();
  assert.equal(instances.length, 0);
  assert.equal(files.size, 0);
});

test("older iOS supports the one-hour stage but refuses advance scheduling", async () => {
  const { model, activity, instances } = setup("ios", true, "18.0");
  await assert.rejects(activity.startLiveEvent(model.makeScheduledDemoEvent(), "png"), /iOS 26/);
  await activity.startLiveEvent(model.makeDemoEvent("starting-soon"), "png");
  assert.equal(instances[0].props.phase, "starting-soon");
});

test("appearance changes update the current native activity using app theme tokens", async () => {
  const { model, activity, instances } = setup();
  await activity.startLiveEvent(model.makeDemoEvent("ongoing"), "png");
  await activity.setLiveEventAppearance({ backgroundColor: "#F6FAFE", textColor: "#181C1F", mutedColor: "#41484D", accentColor: "#206487", isDark: false });
  assert.equal(instances[0].props.backgroundColor, "#F6FAFE");
  assert.equal(instances[0].props.logoURI, "file:///shared/blue.png");
  assert.equal(instances[0].props.markURI, "file:///shared/mark.png");
});
