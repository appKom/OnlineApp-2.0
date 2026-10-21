const fs = require("node:fs");
const path = require("node:path");

const MARKER = "// Online: scheduled event Live Activities (iOS 26+)";
// Bump when the bridge changes, so an already patched node_modules is updated.
const SCHEDULE_MARKER = `${MARKER} v3`;
const SCHEDULE_FUNCTION = `    ${SCHEDULE_MARKER}
    // ActivityKit requires an alert for a scheduled start; it stands in for the event's local reminder.
    Function("scheduleEventLiveActivity") { (name: String, props: String, url: URL?, startDate: Date, staleDate: Date?, title: String, body: String) in
      guard #available(iOS 26.0, *) else { throw LiveActivitiesNotSupportedException() }
      guard ActivityAuthorizationInfo().areActivitiesEnabled else { throw LiveActivitiesNotSupportedException() }
      let state = LiveActivityAttributes.ContentState(name: name, props: props)
      let activity = try Activity<LiveActivityAttributes>.request(
        attributes: LiveActivityAttributes(url: url?.absoluteString),
        content: ActivityContent(state: state, staleDate: staleDate),
        pushType: nil,
        style: .standard,
        alertConfiguration: AlertConfiguration(title: "\\(title)", body: "\\(body)", sound: .default),
        start: startDate
      )
      return activity.id
    }

`;

function patchModule(source) {
  if (source.includes(SCHEDULE_MARKER)) return source;
  const anchor = '    Function("reloadAllWidgets") {';
  if (!source.includes(anchor)) throw new Error("Expo Widgets module changed; review the scheduling bridge patch.");
  // Replace an older version of the bridge in place.
  const previous = source.indexOf(`    ${MARKER}`);
  if (previous >= 0) source = source.slice(0, previous) + source.slice(source.indexOf(anchor));
  return source.replace(anchor, SCHEDULE_FUNCTION + anchor);
}

function patchFactory(source) {
  if (source.includes(MARKER)) return source;
  const anchor = ".filter { $0.activityState == .active || $0.activityState == .stale }";
  if (!source.includes(anchor)) throw new Error("Expo Widgets factory changed; review pending-activity recovery.");
  return source.replace(anchor, `.filter { activity in
        ${MARKER}
        if #available(iOS 26.0, *), activity.activityState == .pending { return true }
        return activity.activityState == .active || activity.activityState == .stale
      }`);
}

function patchProgress(source) {
  const marker = '// Online: timed event progress node';
  if (!source.includes(marker)) {
    const anchor = '    case "ProgressView":';
    if (!source.includes(anchor)) throw new Error("Expo Widgets view dispatcher changed; review event progress rendering.");
    source = source.replace(anchor, `    ${marker}
    case "OnlineEventProgressView":
      if let props = node["props"] as? [String: Any],
         let start = props["start"] as? Double,
         let end = props["end"] as? Double,
         let accent = props["accent"] as? String {
        OnlineEventProgressView(start: Date(timeIntervalSince1970: start / 1000),
                                end: Date(timeIntervalSince1970: end / 1000), accentHex: accent)
      }
${anchor}`);
  }
  const viewMarker = '// Online: native event progress view\n';
  const view = fs.readFileSync(path.join(__dirname, "../widgets/native/EventProgressView.swift"), "utf8");
  const index = source.indexOf(viewMarker);
  return (index < 0 ? source.trimEnd() + "\n\n" : source.slice(0, index)) + viewMarker + view;
}

function applyPatch(root = path.resolve(__dirname, "..")) {
  const packageRoot = path.dirname(require.resolve("expo-widgets/package.json", { paths: [root] }));
  const version = JSON.parse(fs.readFileSync(path.join(packageRoot, "package.json"))).version;
  if (version !== "58.0.0-canary-20260909-ea7a89a") throw new Error("Review the scheduled Live Activity bridge when upgrading Expo Widgets.");
  for (const [name, patch] of [["WidgetsModule.swift", patchModule], ["LiveActivityFactory.swift", patchFactory], ["Widgets/DynamicView.swift", patchProgress]]) {
    const file = path.join(packageRoot, "ios", name);
    const source = fs.readFileSync(file, "utf8");
    const updated = patch(source);
    if (updated !== source) fs.writeFileSync(file, updated);
  }
}

module.exports = { applyPatch, patchModule, patchFactory, patchProgress };
if (require.main === module) applyPatch();
