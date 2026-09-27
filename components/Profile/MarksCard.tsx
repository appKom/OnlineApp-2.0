import { MaterialCommunityIcons } from "@expo/vector-icons";
import { differenceInCalendarDays, differenceInMilliseconds, format, formatDistanceToNowStrict } from "date-fns";
import { nb } from "date-fns/locale";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Linking, Pressable, Share, StyleSheet, Text, View } from "react-native";
import type { EventAttendanceBundle } from "../../types/event";
import type { MarkType, VisiblePersonalMark } from "../../types/mark";
import type { Punishment } from "../../types/punishment";
import { getAttendee, hasAttendeePaid } from "../../utils/attendance";
import {
  SUSPENSION_WEIGHT,
  formatMarkCount,
  getActiveMarkWeight,
  getDelayHoursForWeight,
  getGroupDisplayName,
  getMarkExpiry,
  isIndefiniteMark,
  isMarkActive,
} from "../../utils/marks";
import { blendColors } from "../../utils/theme";
import { getAllEventsByAttendingUserId } from "../../utils/trpc";
import { AnimatedModal } from "../AnimatedModal";
import { EventRulesModal } from "../EventDetails/AttendanceCard/EventRules";
import { InsetField, MeterBar, Panel, RaisedButton, Tag, type IconName } from "../Panel";
import { ProfileDivider, ProfileSurface, useProfileChromeColors } from "./ProfileSurface";

const MARK_ICONS: Record<MarkType, IconName> = {
  MANUAL: "alert-circle-outline",
  LATE_ATTENDANCE: "clock-alert-outline",
  MISSED_ATTENDANCE: "account-cancel-outline",
  MISSING_FEEDBACK: "comment-alert-outline",
  MISSING_PAYMENT: "cash-remove",
};

const MARK_REASONS: Partial<Record<MarkType, string>> = {
  LATE_ATTENDANCE: "Gitt for å møte opp etter start, eller etter at innslippet var ferdig.",
  MISSED_ATTENDANCE: "Gitt fordi du ikke møtte opp på et arrangement du hadde plass på.",
  MISSING_FEEDBACK: "Gitt fordi du ikke svarte på tilbakemeldingsskjemaet innen fristen.",
  MISSING_PAYMENT:
    "Du er suspendert fra alle arrangementer til betalingen er gjort. Ta kontakt med arrangøren for å ordne betalingen, så fjerner de suspensjonen.",
};

// Labels under the six cells of the meter: what having that many marks does to your registrations.
const THRESHOLD_LABELS = ["1 t", "4 t", "24 t", "", "", "Susp."];

const formatDay = (date: Date) => format(date, "d. MMM yyyy", { locale: nb });

function useSeverityColor(weight: number) {
  const chrome = useProfileChromeColors();
  if (weight >= SUSPENSION_WEIGHT) return chrome.danger;
  if (weight > 0) return chrome.warning;
  return chrome.success;
}

export function MarksCard({
  marks,
  punishment,
  userId,
}: {
  marks: VisiblePersonalMark[];
  punishment: Punishment | null;
  userId: string;
}) {
  const chrome = useProfileChromeColors();
  const [showExpired, setShowExpired] = useState(false);
  const [selected, setSelected] = useState<VisiblePersonalMark | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);

  const { active, expired } = useMemo(() => {
    const byNewest = [...marks].sort(
      (a, b) => new Date(b.personalMark.createdAt).getTime() - new Date(a.personalMark.createdAt).getTime(),
    );
    return { active: byNewest.filter(isMarkActive), expired: byNewest.filter((info) => !isMarkActive(info)) };
  }, [marks]);

  const weight = getActiveMarkWeight(marks);
  const color = useSeverityColor(weight);
  // The server's verdict wins; the local weight only drives the meter.
  const suspended = punishment?.suspended ?? weight >= SUSPENSION_WEIGHT;
  const delay = punishment ? punishment.delay : (getDelayHoursForWeight(weight) ?? 0);
  const status = suspended
    ? { icon: "cancel" as const, text: "Suspendert", color: chrome.danger }
    : delay > 0
      ? { icon: "timer-sand" as const, text: `${delay} t utsatt påmelding`, color: chrome.warning }
      : { icon: "check-circle-outline" as const, text: "Ingen utsettelse", color: chrome.success };

  return (
    <ProfileSurface>
      <View style={styles.summary}>
        <View style={styles.summaryTop}>
          <View style={styles.count}>
            <Text style={[styles.countValue, { color: weight > 0 ? color : chrome.text }]}>{weight}</Text>
            <Text style={[styles.countLabel, { color: chrome.textMuted }]}>
              {weight === 1 ? "aktiv prikk" : "aktive prikker"}
            </Text>
          </View>
          <View style={styles.status}>
            <MaterialCommunityIcons name={status.icon} size={16} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
          </View>
        </View>

        <MarkMeter weight={weight} color={color} />
      </View>

      {active.length > 0 && (
        <>
          <ProfileDivider />
          {active.map((info) => (
            <MarkRow key={info.mark.id} info={info} onPress={() => setSelected(info)} />
          ))}
        </>
      )}

      {expired.length > 0 && (
        <>
          <ProfileDivider />
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: showExpired }}
            onPress={() => setShowExpired((current) => !current)}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <Text style={[styles.toggleText, { color: chrome.text }]}>
              {showExpired ? "Skjul utløpte prikker" : `Vis utløpte prikker (${expired.length})`}
            </Text>
            <MaterialCommunityIcons name={showExpired ? "chevron-up" : "chevron-down"} size={20} color={chrome.icon} />
          </Pressable>
          {showExpired &&
            expired.map((info) => <MarkRow key={info.mark.id} info={info} onPress={() => setSelected(info)} />)}
        </>
      )}

      <ProfileDivider />
      <Pressable
        accessibilityRole="button"
        onPress={() => setRulesOpen(true)}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons name="book-open-outline" size={18} color={chrome.icon} />
        <Text style={[styles.rulesText, { color: chrome.text }]}>Slik fungerer prikker</Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color={chrome.icon} />
      </Pressable>

      <MarkDetailsModal info={selected} userId={userId} onClose={() => setSelected(null)} />
      <EventRulesModal visible={rulesOpen} onClose={() => setRulesOpen(false)} />
    </ProfileSurface>
  );
}

/** Six cells, one per mark up to suspension, in a recessed track. */
function MarkMeter({ weight, color }: { weight: number; color: string }) {
  const chrome = useProfileChromeColors();
  const fill = blendColors(color, chrome.recessed, 0.6);
  const current = Math.min(weight, SUSPENSION_WEIGHT);

  return (
    <View accessibilityLabel={`${formatMarkCount(weight)} av ${SUSPENSION_WEIGHT} før suspensjon`}>
      <View
        style={[
          styles.meter,
          { backgroundColor: chrome.recessed, borderColor: chrome.edge, borderBottomColor: chrome.highlight },
        ]}
      >
        {THRESHOLD_LABELS.map((_, index) => (
          <View
            key={index}
            style={[
              styles.meterCell,
              index > 0 && { borderLeftWidth: 1, borderLeftColor: chrome.edge },
              index < current && { backgroundColor: fill },
            ]}
          />
        ))}
      </View>
      <View style={styles.meterLabels}>
        {THRESHOLD_LABELS.map((label, index) => (
          <Text
            key={index}
            style={[
              styles.meterLabel,
              {
                color: index === current - 1 ? color : chrome.textMuted,
                fontWeight: index === current - 1 ? "700" : "500",
              },
            ]}
          >
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

function MarkRow({ info, onPress }: { info: VisiblePersonalMark; onPress: () => void }) {
  const chrome = useProfileChromeColors();
  const { mark } = info;
  const active = isMarkActive(info);
  const expiry = getMarkExpiry(info);
  const color = useSeverityColor(mark.weight >= SUSPENSION_WEIGHT ? SUSPENSION_WEIGHT : 1);

  const timing = !active
    ? `Utløpt ${formatDay(expiry)}`
    : isIndefiniteMark(mark.duration)
      ? "Til den er løst"
      : `${formatDistanceToNowStrict(expiry, { locale: nb })} igjen`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Viser detaljer om prikken"
      onPress={onPress}
      style={({ pressed }) => [styles.row, styles.markRow, pressed && styles.pressed]}
    >
      <MaterialCommunityIcons name={MARK_ICONS[mark.type] ?? MARK_ICONS.MANUAL} size={20} color={active ? color : chrome.textMuted} />
      <View style={styles.markCopy}>
        <Text numberOfLines={2} style={[styles.markTitle, { color: active ? chrome.text : chrome.textMuted }]}>
          {mark.title}
        </Text>
        <Text numberOfLines={1} style={[styles.markMeta, { color: chrome.textMuted }]}>
          {formatMarkCount(mark.weight)} · {timing}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={chrome.icon} />
    </Pressable>
  );
}

function MarkDetailsModal({
  info,
  userId,
  onClose,
}: {
  info: VisiblePersonalMark | null;
  userId: string;
  onClose: () => void;
}) {
  // Keep the last mark while the close animation runs.
  const [shown, setShown] = useState(info);
  useEffect(() => {
    if (info) setShown(info);
  }, [info]);

  return (
    <AnimatedModal visible={info !== null} onClose={onClose} modalWidth="92%" modalMaxWidth={420}>
      {(closeModal) => shown && <MarkDetails info={shown} userId={userId} onClose={closeModal} />}
    </AnimatedModal>
  );
}

function MarkDetails({ info, userId, onClose }: { info: VisiblePersonalMark; userId: string; onClose: () => void }) {
  const chrome = useProfileChromeColors();
  const router = useRouter();
  const { mark, personalMark } = info;
  const given = new Date(personalMark.createdAt);
  const expiry = getMarkExpiry(info);
  const active = isMarkActive(info);
  const indefinite = isIndefiniteMark(mark.duration);
  const color = useSeverityColor(mark.weight >= SUSPENSION_WEIGHT ? SUSPENSION_WEIGHT : 1);
  const unpaidEvent = useUnpaidEvent(active && mark.type === "MISSING_PAYMENT" ? info : null, userId);

  const totalDays = Math.max(1, differenceInCalendarDays(expiry, given));
  const daysLeft = Math.max(0, differenceInCalendarDays(expiry, new Date()));
  const remaining = Math.max(0, differenceInMilliseconds(expiry, new Date())) / differenceInMilliseconds(expiry, given);

  const contact = mark.groups.find((group) => group.email || group.contactUrl);
  const openContact = async () => {
    if (!contact) return;
    if (contact.email) {
      try {
        await Linking.openURL(`mailto:${contact.email}?subject=${encodeURIComponent(`Prikk: ${mark.title}`)}`);
        return;
      } catch {
        // No mail app (e.g. the simulator, or Mail deleted): fall through.
      }
    }
    if (contact.contactUrl) {
      try {
        await Linking.openURL(contact.contactUrl);
        return;
      } catch {}
    }
    if (contact.email) {
      const email = contact.email;
      Alert.alert("Fant ingen e-postapp", `Send en e-post til ${email}.`, [
        { text: "Del adresse", onPress: () => void Share.share({ message: email }) },
        { text: "OK", style: "cancel" },
      ]);
    }
  };

  const openEvent = (eventId: string) => {
    onClose();
    router.push({ pathname: "/event-details", params: { eventId } });
  };

  const reason = MARK_REASONS[mark.type];

  return (
    <Panel style={styles.modal}>
      <View style={styles.modalHeader}>
        <MaterialCommunityIcons
          name={MARK_ICONS[mark.type] ?? MARK_ICONS.MANUAL}
          size={22}
          color={active ? color : chrome.textMuted}
        />
        <View style={styles.modalTitleBlock}>
          <Text style={[styles.modalTitle, { color: chrome.text }]}>{mark.title}</Text>
          <View style={styles.modalTags}>
            <Tag label={formatMarkCount(mark.weight)} color={active ? color : chrome.textMuted} />
            <Tag label={active ? "Aktiv" : "Utløpt"} />
          </View>
        </View>
      </View>

      {(mark.details || reason) && (
        <View style={styles.modalBody}>
          {mark.details ? <Text style={[styles.bodyText, { color: chrome.text }]}>{mark.details}</Text> : null}
          {reason ? <Text style={[styles.bodyText, { color: chrome.textMuted }]}>{reason}</Text> : null}
        </View>
      )}

      {active && !indefinite && (
        <View style={styles.remaining}>
          <MeterBar value={remaining} color={color} />
          <Text style={[styles.remainingText, { color: chrome.textMuted }]}>
            {daysLeft === 0 ? "Utløper i dag" : `${daysLeft} av ${totalDays} dager igjen`}
          </Text>
        </View>
      )}

      <View style={styles.facts}>
        <InsetField icon="calendar-plus" label="Gitt" value={formatDay(given)} />
        <InsetField
          icon="calendar-clock"
          label={active ? "Utløper" : "Utløpt"}
          value={indefinite ? "Når betalingen er ordnet" : format(expiry, "d. MMM yyyy 'kl.' HH:mm", { locale: nb })}
        />
        {mark.groups.length > 0 && (
          <InsetField icon="account-group-outline" label="Fra" value={mark.groups.map(getGroupDisplayName).join(", ")} />
        )}
      </View>

      {active && contact && mark.type !== "MISSING_PAYMENT" && (
        <Text style={[styles.hint, { color: chrome.textMuted }]}>
          Mener du prikken er feil, kan du ta kontakt med {getGroupDisplayName(contact)}.
        </Text>
      )}

      <View style={styles.actions}>
        {unpaidEvent && (
          <RaisedButton
            icon="calendar-arrow-right"
            label="Åpne arrangementet"
            onPress={() => openEvent(unpaidEvent.event.id)}
          />
        )}
        {active && contact && (
          <RaisedButton
            icon={contact.email ? "email-outline" : "open-in-new"}
            label={`Kontakt ${getGroupDisplayName(contact)}`}
            tone="accent"
            onPress={() => void openContact()}
          />
        )}
        <RaisedButton label="Lukk" onPress={onClose} />
      </View>
    </Panel>
  );
}

/**
 * Payment suspensions don't reference their event, only its title in the details text,
 * so look for an event the user is signed up to, hasn't paid for and whose title matches.
 */
function useUnpaidEvent(info: VisiblePersonalMark | null, userId: string) {
  const [event, setEvent] = useState<EventAttendanceBundle | null>(null);
  const text = info ? `${info.mark.title} ${info.mark.details ?? ""}` : null;

  useEffect(() => {
    setEvent(null);
    if (!text) return;
    let cancelled = false;
    getAllEventsByAttendingUserId(userId, 50, undefined, "desc")
      .then((result) => {
        if (cancelled) return;
        const match = (result?.items ?? []).find((bundle) => {
          if (!bundle.attendance?.attendancePrice || !text.includes(bundle.event.title)) return false;
          const attendee = getAttendee(bundle.attendance, { id: userId });
          return hasAttendeePaid(bundle.attendance, attendee) === false;
        });
        setEvent(match ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [text, userId]);

  return event;
}

const styles = StyleSheet.create({
  summary: { padding: 15, gap: 14 },
  summaryTop: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 12 },
  count: { flexDirection: "row", alignItems: "baseline", gap: 7 },
  countValue: { fontSize: 30, lineHeight: 34, fontWeight: "700", fontVariant: ["tabular-nums"] },
  countLabel: { fontSize: 13, fontWeight: "500" },
  status: { flexShrink: 1, flexDirection: "row", alignItems: "center", gap: 5, paddingBottom: 4 },
  statusText: { flexShrink: 1, fontSize: 13, fontWeight: "700" },
  meter: { height: 14, borderWidth: 1, borderRadius: 7, overflow: "hidden", flexDirection: "row" },
  meterCell: { flex: 1 },
  meterLabels: { marginTop: 5, flexDirection: "row" },
  meterLabel: { flex: 1, fontSize: 10, textAlign: "center", fontVariant: ["tabular-nums"] },
  row: { minHeight: 48, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", gap: 10 },
  markRow: { minHeight: 62, paddingVertical: 10 },
  pressed: { opacity: 0.7 },
  markCopy: { flex: 1, minWidth: 0, gap: 2 },
  markTitle: { fontSize: 14, lineHeight: 19, fontWeight: "600" },
  markMeta: { fontSize: 12 },
  toggleText: { flex: 1, fontSize: 13, fontWeight: "700" },
  rulesText: { flex: 1, fontSize: 13, fontWeight: "600" },
  modal: { padding: 16, gap: 14 },
  modalHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  modalTitleBlock: { flex: 1, minWidth: 0, gap: 5 },
  modalTitle: { fontSize: 17, lineHeight: 22, fontWeight: "700" },
  modalTags: { flexDirection: "row", gap: 10 },
  modalBody: { gap: 8 },
  bodyText: { fontSize: 14, lineHeight: 20 },
  remaining: { gap: 6 },
  remainingText: { fontSize: 12, fontVariant: ["tabular-nums"] },
  facts: { gap: 6 },
  hint: { fontSize: 12, lineHeight: 17 },
  actions: { gap: 8 },
});
