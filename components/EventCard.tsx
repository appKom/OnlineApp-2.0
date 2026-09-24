import { differenceInCalendarDays, format, isPast } from "date-fns";
import { nb } from "date-fns/locale";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { EventAttendanceBundle } from "../types/event";
import { User } from "../types/user";
import {
  getAttendanceCapacity,
  getAttendanceStatus,
  getAttendee,
  getReservedAttendeeCount,
  getUnreservedAttendeeCount,
} from "../utils/attendance";
import { useTheme, useThemeMode } from "../utils/theme";
import { TicketButton } from "./EventDetails/AttendanceCard/TicketButton";
import { PanelDivider, Tag, usePanelChromeColors } from "./Panel";

const EVENT_TYPES: Record<string, { label: string; dark: string; light: string }> = {
  SOCIAL: { label: "Sosialt", dark: "#74D69C", light: "#1B7A48" },
  ACADEMIC: { label: "Kurs", dark: "#86BCF7", light: "#1F5FA8" },
  COMPANY: { label: "Bedpres", dark: "#F2878A", light: "#B3323A" },
  GENERAL_ASSEMBLY: { label: "Generalforsamling", dark: "#F5BC6F", light: "#8F5A00" },
  INTERNAL: { label: "Intern", dark: "#C4A9FF", light: "#6A4FB0" },
  WELCOME: { label: "Fadderuke", dark: "#F5BC6F", light: "#8F5A00" },
  OTHER: { label: "Annet", dark: "#A9B1B9", light: "#5B636B" },
};

export function useEventTypeStyle(eventType: string | undefined) {
  const { mode } = useThemeMode();
  const type = EVENT_TYPES[eventType?.toUpperCase() ?? ""] ?? EVENT_TYPES.OTHER;
  return { label: type.label, color: mode === "dark" ? type.dark : type.light };
}

interface EventCardProps {
  event: EventAttendanceBundle;
  user: User | null;
  onPress: () => void;
  /** Currently running event the user attends: shows the time span and a ticket shortcut. */
  ongoing?: boolean;
}

const formatStart = (date: Date) => format(date, "EEE d. MMM · HH:mm", { locale: nb });

const formatOpens = (date: Date) =>
  differenceInCalendarDays(date, new Date()) < 6
    ? format(date, "EEE HH:mm", { locale: nb })
    : format(date, "d. MMM", { locale: nb });

const EventCard: React.FC<EventCardProps> = ({ event: bundle, user, onPress, ongoing = false }) => {
  const theme = useTheme();
  const { mode } = useThemeMode();
  const chrome = usePanelChromeColors();
  const type = useEventTypeStyle(bundle.event.type);
  const { event, attendance } = bundle;
  const start = new Date(event.start);
  const end = new Date(event.end);
  const ended = isPast(end);

  const attendee = getAttendee(attendance, user);

  const fallbackImage =
    mode === "dark"
      ? require("../assets/eventFallback/fallback_dark.png")
      : require("../assets/eventFallback/fallback_light.png");

  return (
    <View style={{ backgroundColor: theme.background }}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: pressed ? theme.surfaceContainerLow : theme.background },
        ]}
      >
        <Image
          source={event.imageUrl ? { uri: event.imageUrl } : fallbackImage}
          style={[
            styles.image,
            {
              backgroundColor: chrome.recessed,
              borderColor: chrome.edge,
              borderTopColor: chrome.highlight,
              opacity: ended ? 0.6 : 1,
            },
          ]}
          resizeMode="cover"
        />

        <View style={styles.content}>
          <Text
            numberOfLines={2}
            style={[styles.title, { color: ended ? chrome.textMuted : chrome.text }]}
          >
            {event.title ?? "Uten tittel"}
          </Text>
          <View style={styles.metaRow}>
            <Text numberOfLines={1} style={[styles.date, { color: chrome.textMuted }]}>
              {ongoing
                ? `${format(start, "HH:mm")}–${format(end, "HH:mm")}`
                : formatStart(start)}
              {ongoing && event.locationTitle ? ` · ${event.locationTitle}` : ""}
            </Text>
            {!ongoing && <Tag label={type.label} color={type.color} style={styles.typeTag} />}
          </View>
        </View>

        {ongoing && attendee?.reserved ? (
          <TicketButton attendee={attendee} compact />
        ) : (
          attendance && (
            <AttendanceSummary bundle={bundle} attendee={attendee} ended={ended} />
          )
        )}
      </Pressable>
      <PanelDivider onBackground />
    </View>
  );
};

function AttendanceSummary({
  bundle,
  attendee,
  ended,
}: {
  bundle: EventAttendanceBundle;
  attendee: ReturnType<typeof getAttendee>;
  ended: boolean;
}) {
  const chrome = usePanelChromeColors();
  const attendance = bundle.attendance!;
  const capacity = getAttendanceCapacity(attendance);
  const reserved = getReservedAttendeeCount(attendance);
  const waitlist = getUnreservedAttendeeCount(attendance);
  const isFull = capacity > 0 && reserved >= capacity;
  const status = getAttendanceStatus(attendance);

  const light = {
    NotOpened: { color: chrome.warning, label: `Åpner ${formatOpens(new Date(attendance.registerStart))}` },
    Open: { color: chrome.success, label: "Åpen" },
    Closed: { color: chrome.danger, label: "Stengt" },
  }[status];

  return (
    <View style={styles.summary}>
      <Text style={styles.count}>
        <Text style={{ color: ended ? chrome.textMuted : isFull ? chrome.danger : chrome.text }}>
          {reserved}
          {capacity > 0 && `/${capacity}`}
        </Text>
        {waitlist > 0 && !ended && <Text style={{ color: chrome.warning }}>{` +${waitlist}`}</Text>}
      </Text>

      {attendee ? (
        <Tag
          label={attendee.reserved ? "Påmeldt" : "Venteliste"}
          color={attendee.reserved ? chrome.success : chrome.warning}
        />
      ) : (
        !ended && (
          <View style={styles.status}>
            <View style={[styles.light, { backgroundColor: light.color }]} />
            <Text numberOfLines={1} style={[styles.statusText, { color: chrome.textMuted }]}>
              {light.label}
            </Text>
          </View>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 80,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  image: {
    width: 72,
    height: 52,
    borderWidth: 1,
    borderRadius: 9,
  },
  content: {
    minWidth: 0,
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "700",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  date: {
    flexShrink: 1,
    fontSize: 12,
  },
  typeTag: {
    fontSize: 10,
  },
  summary: {
    maxWidth: 118,
    alignItems: "flex-end",
    gap: 5,
  },
  count: {
    fontSize: 13,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  status: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  light: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
  },
});

export default EventCard;
