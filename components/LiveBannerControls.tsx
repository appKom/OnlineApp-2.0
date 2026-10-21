import { useRef, useState, useSyncExternalStore } from "react";
import { Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Panel, PanelHeader, RaisedButton, usePanelChromeColors } from "./Panel";
import { getLiveEventSession, liveActivityAvailability, liveActivitySchedulingAvailability, startLiveEvent, stopLiveEvent, subscribeLiveEvent, updateLiveEvent, updateLiveEventRegistration } from "../utils/live-event-activity";
import { getLiveEventPhase, makeDemoEvent, makeScheduledDemoEvent, type LiveEvent } from "../utils/live-event-model";

export const DEMO_TICKET = "ONLINE-LIVE-BANNER-TEST-NOT-A-VALID-TICKET";
type QRRef = { toDataURL: (callback: (data: string) => void) => void };

/** Export a dedicated widget-sized QR with a quiet zone and the same ticket payload. */
export function LiveBannerControls({ event, ticketValue }: { event?: LiveEvent; ticketValue?: string }) {
  const chrome = usePanelChromeColors();
  const current = useSyncExternalStore(subscribeLiveEvent, getLiveEventSession, () => null);
  const qr = useRef<QRRef | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoRegistration, setDemoRegistration] = useState<NonNullable<LiveEvent["registrationStatus"]>>("REGISTERED");
  const scheduled = event && getLiveEventPhase(event) === "upcoming";
  const unavailable = scheduled ? liveActivitySchedulingAvailability() : liveActivityAvailability();
  const schedulingUnavailable = liveActivitySchedulingAvailability();
  const mine = current?.event.eventId === (event?.eventId ?? "local-live-banner-demo");

  const run = async (operation: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try { await operation(); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  const start = (next: LiveEvent) => run(async () => {
    if (!event) next = { ...next, registrationStatus: demoRegistration };
    if (!event && mine && current?.phase !== "upcoming" && getLiveEventPhase(next) !== "upcoming") { await updateLiveEvent(next); return; }
    const image = await new Promise<string>((resolve, reject) => {
      if (!qr.current) { reject(new Error("Billetten er ikke klar ennå.")); return; }
      const timeout = setTimeout(() => reject(new Error("Kunne ikke lage QR-bildet. Prøv igjen.")), 5000);
      // Export at the widget's display size; ActivityKit replaces oversized PNGs
      // with a gray placeholder even when SwiftUI resizes them with a frame.
      qr.current.toDataURL((data) => { clearTimeout(timeout); resolve(data); });
    });
    await startLiveEvent(next, image);
  });

  const previewRegistration = (status: NonNullable<LiveEvent["registrationStatus"]>) => run(async () => {
    setDemoRegistration(status);
    if (mine && current) await updateLiveEventRegistration(current.event.eventId, null, status);
  });

  return (
    <Panel style={{ padding: 14, gap: 12 }}>
      <PanelHeader title={event ? "Live-banner" : "Test Live-banner"} />
      <Text style={{ color: chrome.textMuted, fontSize: 13 }}>
        {event ? "Banneret starter én time før arrangementet, samtidig med påminnelsen. Innslipp antas å åpne 15 minutter før start." : "Start et lokalt testarrangement, og lås skjermen for å se den native Live Activity. Testbilletten gir ikke adgang."}
      </Text>
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ position: "absolute", opacity: 0, width: 112, height: 112 }}
      >
        <QRCode value={ticketValue ?? DEMO_TICKET} size={112} quietZone={8} ecl="M" getRef={(ref: QRRef) => { qr.current = ref; }} />
      </View>
      {!event && <View style={{ alignSelf: "center", backgroundColor: "white" }}><QRCode value={DEMO_TICKET} size={160} quietZone={12} ecl="M" /></View>}
      {mine && <Text style={{ color: chrome.accent, fontSize: 14 }}>{current?.phase === "upcoming" ? "Live Activity planlagt" : `Live Activity startet · ${current?.phase === "ongoing" ? "Arrangementet pågår" : current?.phase === "starting-soon" ? "Starter snart" : "Dørene er åpne"}`}</Text>}
      {unavailable && <Text style={{ color: chrome.textMuted, fontSize: 13 }}>{unavailable}</Text>}
      {error && <Text accessibilityRole="alert" style={{ color: chrome.text, fontSize: 13 }}>{error}</Text>}
      {event ? (
        <RaisedButton icon="calendar-clock" label={scheduled ? "Planlegg Live-banner · 1 time før start" : mine ? "Oppdater Live-banner" : "Start Live-banner"} disabled={busy || Boolean(unavailable)} onPress={() => void start(event)} />
      ) : (
        <>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <RaisedButton flex icon="account-check-outline" label="Påmeldt" disabled={busy || Boolean(unavailable)} onPress={() => void previewRegistration("REGISTERED")} />
            <RaisedButton flex icon="account-clock-outline" label="Venteliste" disabled={busy || Boolean(unavailable)} onPress={() => void previewRegistration("QUEUED")} />
          </View>
          <RaisedButton icon="clock-outline" label="Starter snart · 1 time til start" disabled={busy || Boolean(unavailable)} onPress={() => void start(makeDemoEvent("starting-soon"))} />
          <RaisedButton icon="door-open" label="Dørene er åpne · 15 min til start" disabled={busy || Boolean(unavailable)} onPress={() => void start(makeDemoEvent("doors-open"))} />
          <RaisedButton icon="calendar-clock" label="Arrangementet pågår · 60 min igjen" disabled={busy || Boolean(unavailable)} onPress={() => void start(makeDemoEvent("ongoing"))} />
          <RaisedButton icon="timer-outline" label="Kjør demo · start om 20 sekunder" disabled={busy || Boolean(unavailable)} onPress={() => void start(makeDemoEvent("doors-open", Date.now(), true))} />
          <RaisedButton icon="calendar-clock" label="Planlegg demo · banner om 30 sek" disabled={busy || Boolean(schedulingUnavailable)} onPress={() => void start(makeScheduledDemoEvent())} />
          {schedulingUnavailable && <Text style={{ color: chrome.textMuted, fontSize: 12 }}>{schedulingUnavailable}</Text>}
          <Text style={{ color: chrome.textMuted, fontSize: 12 }}>Den korte demoen slutter 90 sekunder etter start. Hold appen åpen for automatiske fasebytter; nedtellingen fortsetter også når skjermen er låst.</Text>
        </>
      )}
      {mine && <RaisedButton icon="stop-circle-outline" label="Avslutt Live-banner" disabled={busy} onPress={() => void run(stopLiveEvent)} />}
    </Panel>
  );
}
