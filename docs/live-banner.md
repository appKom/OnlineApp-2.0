# Event Live Activity (client prototype)

The iOS banner uses `expo-widgets` and native SwiftUI views. Its layout focuses on
Online's existing left-aligned wordmark, a prominent centred native countdown, event name on the lower left, location on the lower right and a
vertically centred QR in a rounded white card, using the app's current theme colours.
Beside the logo, a compact badge shows **Påmeldt**, **Venteliste** or **Reservert**
using the event page's `getAttendeeState` rules. Reserved means payment is still
required; having a QR does not imply a confirmed place. Older saved banners omit
the badge until attendance is refreshed. The QR's size and styling are unchanged.
Before the event, the countdown has no caption. During the event, it is replaced
by start and end times above a rounded native progress bar. The compact Dynamic
Island retains a remaining-time countdown. Apple's timed progress view advances
without JavaScript; custom progress styles are unsupported and its gradient tint
renders as a flat accent colour on the simulator.
The ticket uses the
same attendee-ID QR payload as the existing app ticket. The QR PNG lives in the
shared app group, so the extension can read it while the app is suspended.

## Reminders and banners: the device-side backfill

The events API has no push notifications, so the app backfills them. `EventSync`
(mounted in the root layout, logic in `utils/event-sync.ts`) reads every upcoming
event the user attends, wherever they signed up, plus bookmarked events. It runs
on launch, return to the foreground, login, and after (de)registration on an event
page. Each run:

1. Plans banners for the next three attended events (`planLiveEvents`): signed up,
   reserved or waitlisted. Banners for events no longer attended, or pushed out by
   sooner ones, end. Existing banners get their registration badge refreshed.
2. Schedules a local reminder one hour before every attended or bookmarked event,
   and cancels the rest (`syncEventReminders`).
3. Renders each new ticket's QR off-screen and starts its banner:
   - On iOS 26+, ActivityKit schedules it for one hour before start, even while
     the app is closed. iOS requires an alert for a scheduled start, so that
     alert, with the reminder's text, replaces that event's local reminder. If a
     banner ends or fails to schedule, the next reminder pass restores the local
     reminder, so each event gets exactly one alert.
   - On iOS 18–25, the banner starts when the app runs inside that hour, and the
     local reminder is the alert.

Swiping a banner away is remembered for that event; it is never started again,
and its local reminder still fires. Banners advance from starts-soon to doors-open
15 minutes before start, then ongoing at start, while the app runs. Doors-open is
still an assumption because the event contract has no explicit time for it.
Tapping the QR opens the event's ticket modal; tapping elsewhere opens the event.
Logout ends every banner.

After login the app asks once for notification permission, with a short
explanation, so users who only sign up on the website still get reminders. It
waits until the App Tracking Transparency prompt has been answered.

`utils/background-sync.ts` registers a background task (`expo-background-task`).
iOS runs it now and then, at times it chooses and never after a force-quit, to
backfill reminders for website sign-ups without opening the app. ActivityKit only
starts banners from the foreground, so banners wait for the next app launch. The
task skips the run if it cannot read the signed-in user (for example while the
keychain is locked), so it never cancels reminders by mistake.

What still needs the backend: an instant confirmation after signing up on the
website, and banners that start or update while the app has not been opened.
Both need the events backend to send APNs pushes.

## Testing

1. Rebuild the native app after installing dependencies: `npx expo run:ios`.
   Expo Go and previously installed builds do not include the extension or the
   background task. Use Node 22.13 or newer. If Xcode picks an older Node
   installation, point `ios/.xcode.env.local` at the same Node executable used by
   your terminal. If `pod install` fails with an encoding error, run it with
   `LANG=en_US.UTF-8`. Build with normal simulator signing so the app and
   extension can access their shared image container.
2. Sign up for an event that starts within a few hours, then reopen the app.
   In Simulator / Device Hub, use **Controls → Lock** for the Lock Screen and
   **Controls → Home** for the Dynamic Island. Choose **Allow**, then
   **Always Allow** if iOS asks whether Online may show Live Activities.
3. To try it without real upcoming events, temporarily shift past attended
   events' times in `loadSyncedEvents` and do not commit the change. The iPhone 18
   Pro simulator was checked this way with real tickets: three events got two
   scheduled banners and one local reminder (for the event whose banner had been
   swiped away), the nearest banner started on time with the app terminated, its
   QR decoded to the same attendee ID as the in-app ticket, and removing the
   events ended both banners on the next sync.
4. The background task only runs on a physical device; the simulator has no
   background task scheduler. In a debug build on a device, trigger it with
   `BackgroundTask.triggerTaskWorkerForTestingAsync()` after sending the app to
   the background.
5. Test long titles, Live Activities disabled in iOS settings, and scanning on a
   physical iPhone.

## Scope and production follow-up

This is a client prototype with native advance scheduling on iOS 26+. Android
live notifications and automatic remote starts are not implemented. `enablePushNotifications` stays
false: no server tokens are registered or sent anywhere.

Neither React Native timers nor a widget timeline can reliably change ActivityKit
content when the app is suspended. `staleDate` marks the content stale at the next
boundary; it does **not** advance its phase or end it. The native timer reaches
zero, and the label updates when the app next runs. An iOS 26+ scheduled banner
can start while the app is terminated; later phase changes still require the app
to run or ActivityKit pushes.

For background phase updates and remote starts on older iOS, add APNs push-to-start registration,
per-activity push-token registration, and server jobs for doors-open, start, end,
cancellation, and registration changes. Keep ticket images available before
remote start, or fall back to a ticket link until the app creates the shared PNG.
Add an explicit doors-open timestamp to the event contract. ActivityKit also
limits activity duration, so long events need a defined product policy.

The missing Expo scheduling bridge and timed progress node are patched in
`scripts/patch-expo-widgets.cjs`, applied by postinstall and the iOS config plugin.
It adds Apple's iOS 26 scheduling request (whose alert is mandatory) and includes pending activities in
instance recovery/cancellation. The native progress view source is maintained in
`widgets/native/EventProgressView.swift` and added to Expo's native node dispatcher.
The patch is guarded against Expo Widgets version or
source changes, so review it during an SDK upgrade.

See [Expo Widgets](https://docs.expo.dev/versions/latest/sdk/widgets/),
[Apple's timed progress view](https://developer.apple.com/documentation/swiftui/progressview/init(timerinterval:countsdown:)) and
[Apple's scheduled ActivityKit request](https://developer.apple.com/documentation/activitykit/activity/request(attributes:content:pushtype:style:alertconfiguration:start:)).

`npm test` covers phase boundaries, planning several banners, serialized native
lifecycle operations, the reminder hand-off, relaunch recovery and migration from
the single-banner storage, QR write ordering, logout, user dismissal, rollback
after storage failure, paging through attended events, and unsupported runtimes. It also builds Expo's
isolated widget runtime and checks every region emits supported native view nodes.

The pinned SDK 58 canary overwrites the SwiftUI `Image` global with React Native's
image stub. The layout emits `ImageView` nodes directly to avoid that collision.
The ticket uses a dedicated 112-point SVG export; larger source PNGs can exceed
ActivityKit's image budget and produce a gray placeholder even with a smaller
SwiftUI frame. Keep both workarounds until an SDK upgrade is verified natively.
