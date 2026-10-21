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

## Try it

1. Rebuild the native app after installing dependencies: `npx expo run:ios`.
   Expo Go and previously installed builds do not include the new extension.
   Use Node 22.13 or newer. If Xcode picks an older Node installation, point
   `ios/.xcode.env.local` at the same Node executable used by your terminal.
2. In a development build, open **Profil → Test Live-banner**. Login is optional.
   The route also opens with `ntnu.online.app://live-banner-test`.
3. Choose **Dørene er åpne** or **Arrangementet pågår**. The screen confirms
   **Live Activity startet**; the in-app QR is a test ticket preview.
   In Simulator / Device Hub, use **Controls → Lock** for the Lock Screen and
   **Controls → Home** for the Dynamic Island. If Lock puts the display into
   its dim always-on state, use Lock again to wake it. Choose **Allow**, then
   **Always Allow** if iOS asks whether Online may show Live Activities.
4. Long-press the Dynamic Island to inspect its expanded view. Scan the QR and
   check it equals `ONLINE-LIVE-BANNER-TEST-NOT-A-VALID-TICKET`. This is a dummy
   ticket and must not be accepted by a real event scanner.
5. Tap the QR to open the app ticket; tap elsewhere on the banner for the event
   page. Return to the test screen to switch states on the same activity.
6. **Kjør demo** counts down 20 seconds to start, then runs for 90 seconds. Keep
   the app in the foreground for phase changes and automatic dismissal. The
   native countdown and ongoing progress bar continue with the screen locked. Reopening the app reconciles
   the phase or removes an expired banner.
   **Planlegg demo** schedules the native banner to appear after 30 seconds;
   lock the screen and terminate the app to verify it starts without JavaScript.
   This test event opens its doors after 60 seconds, starts after 90 seconds and
   ends after 180 seconds. Reopen the app to reconcile those later phases.
7. Test dismissal, force-quit/relaunch, Live Activities disabled in iOS settings,
   and long titles on a physical iPhone. Native rendering and scanning require
   device validation. The iPhone 18 Pro simulator was visually checked for
   both event states, the Lock Screen QR and compact Dynamic Island. The
   shared PNG was decoded with Apple's Vision API to verify its dummy payload.
   The smaller QR in its rounded card was also decoded from the rendered
   Lock Screen screenshot, and tapping the banner was checked separately.
   Native advance scheduling was also verified: the Lock Screen was empty
   before the scheduled start, then the branded banner appeared after the
   app was terminated. The ongoing progress bar was checked at two different
   positions after terminating the app, confirming it keeps advancing natively.
   Build with normal simulator signing so the app and
   extension can access their shared image container.

For an event you have a place at or are waitlisted for, enable **Planlegg Live-banner · 1 time før start**
in its attendance card. On iOS 26+, ActivityKit schedules the start for exactly
one hour before the event, even while the app is closed. Its system alert replaces
the local one-hour reminder to avoid duplicate alerts. Cancelling the scheduled
banner on the event page restores the local reminder. On iOS 18–25, start it
manually within the one-hour window. Internally, the initial starts-soon state changes
to doors-open 15 minutes before start, then ongoing at start. The design shows one
countdown without a caption or repeated pre-event status. Doors-open is still
an assumption because the event contract has no explicit time for it.

Only one event is enabled at a time; enabling another replaces the previous
active or scheduled banner. Tapping the QR opens the event's ticket modal.
Foreground reconciliation ends the banner at the event end, on logout, or after
deregistration is observed on the event page. User dismissal is respected.
Waitlisted and reserved attendees can also enable it and open their QR ticket.
Refreshing attendance on the event page updates the badge on the existing
active or pending banner without replacing its QR or scheduled start. Changes
while the app is closed need server pushes, like other background updates.
The test screen includes **Påmeldt** and **Venteliste** preview controls.

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
It adds Apple's iOS 26 scheduling request and includes pending activities in
instance recovery/cancellation. The native progress view source is maintained in
`widgets/native/EventProgressView.swift` and added to Expo's native node dispatcher.
The patch is guarded against Expo Widgets version or
source changes, so review it during an SDK upgrade.

See [Expo Widgets](https://docs.expo.dev/versions/latest/sdk/widgets/),
[Apple's timed progress view](https://developer.apple.com/documentation/swiftui/progressview/init(timerinterval:countsdown:)) and
[Apple's scheduled ActivityKit request](https://developer.apple.com/documentation/activitykit/activity/request(attributes:content:pushtype:style:alertconfiguration:start:)).

`npm test` covers phase boundaries, serialized native lifecycle operations,
manual updates, relaunch recovery, QR write ordering, logout, user dismissal,
rollback after storage failure, and unsupported runtimes. It also builds Expo's
isolated widget runtime and checks every region emits supported native view nodes.

The pinned SDK 58 canary overwrites the SwiftUI `Image` global with React Native's
image stub. The layout emits `ImageView` nodes directly to avoid that collision.
The ticket uses a dedicated 112-point SVG export; larger source PNGs can exceed
ActivityKit's image budget and produce a gray placeholder even with a smaller
SwiftUI frame. Keep both workarounds until an SDK upgrade is verified natively.
