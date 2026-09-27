import React from "react"
import { View, Text, Pressable, StyleSheet, Linking } from "react-native"
import type { Attendance } from "../../../types/event"
import { getAttendee, hasAttendeePaid, getAttendeeQueuePosition } from "../../../utils/attendance"
import { useCountdown } from "../../../utils/use-countdown"
import { User } from "../../../types/user"
import { Attendee } from "../../../types/event"
import { findActiveMembership } from "../../../utils/user-utils"
import {getAttendablePool, 
  getReservedAttendeeCount, 
  getUnreservedAttendeeCount 
} from "../../../utils/attendance"
import {
  formatDate,
  formatDistanceToNowStrict,
  interval,
  isFuture,
  isWithinInterval,
  roundToNearestHours,
  subMinutes,
} from "date-fns"
import { nb } from "date-fns/locale"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { MeterBar, Tag, usePanelChromeColors } from "../../Panel"
import type { IconName } from "../../Panel"
import { blendColors, useTheme } from "../../../utils/theme"

interface MainPoolCardProps {
  attendance: Attendance
  user: User | null
  authorizeUrl?: string
  chargeScheduleDate?: Date | null
}

export const MainPoolCard: React.FC<MainPoolCardProps> = ({ attendance, user, chargeScheduleDate }) => {
  const chrome = usePanelChromeColors()
  const theme = useTheme()
  const now = new Date()
  const attendee = getAttendee(attendance, user)

  const registerCountdownText = useCountdown(attendance.registerStart)
  const registerCountdownInterval = interval(subMinutes(attendance.registerStart, 15), attendance.registerStart)
  const isWithinRegisterCountdown = isWithinInterval(now, registerCountdownInterval)
  const showRegisterCountdown = isWithinRegisterCountdown && !attendee

  const paymentCountdownText = useCountdown(attendee?.paymentDeadline ?? null)
  const paymentCountdownInterval =
    attendee?.createdAt && attendee.paymentDeadline ? interval(attendee.createdAt, attendee.paymentDeadline) : null
  const isWithinPaymentCountdown =
    paymentCountdownInterval && hasAttendeePaid(attendance, attendee) === false
      ? isWithinInterval(now, paymentCountdownInterval)
      : false
  const showPaymentCountdown = isWithinPaymentCountdown && attendee?.paymentLink != null

  if (!user) {
    return (
      <View style={styles.plainStatus}>
        <StatusLine icon="account-lock-outline" text="Logg inn for å melde deg på" />
        <PaymentStatus attendance={attendance} attendee={attendee} chargeScheduleDate={chargeScheduleDate} />
      </View>
    )
  }

  const membership = findActiveMembership(user)

  if (!membership && !attendee) {
    return (
      <View style={styles.plainStatus}>
        <StatusLine icon="card-account-details-outline" text="Du har ikke registrert medlemskap" />
        <Text style={[styles.hint, { color: chrome.textMuted }]}>Registrer medlemskapet ditt på online.ntnu.no.</Text>
        <PaymentStatus attendance={attendance} attendee={attendee} chargeScheduleDate={chargeScheduleDate} />
      </View>
    )
  }

  const pool = getAttendablePool(attendance, user)

  if (!pool) {
    return (
      <View style={styles.plainStatus}>
        <StatusLine icon="account-cancel-outline" text="Du kan ikke melde deg på dette arrangementet" />
      </View>
    )
  }

  const unreservedAttendeeCount = getUnreservedAttendeeCount(attendance, pool.id)
  const reservedAttendeeCount = getReservedAttendeeCount(attendance, pool.id)
  const hasWaitlist = unreservedAttendeeCount > 0
  const isFull = pool.capacity > 0 && reservedAttendeeCount >= pool.capacity

  const servingPunishment = attendee?.earliestReservationAt && isFuture(attendee.earliestReservationAt)

  return (
    <View style={styles.poolSection}>
      <View style={styles.poolHeader}>
        <View style={styles.poolTitleRow}>
          <Text numberOfLines={1} style={[styles.poolTitle, { color: chrome.text }]}>
            {pool.title}
          </Text>
          {pool.mergeDelayHours && pool.mergeDelayHours > 0 ? (
            <Tag label={`+${pool.mergeDelayHours}t`} color={chrome.warning} />
          ) : null}
        </View>

        {!showRegisterCountdown && (
          <Text style={[styles.count, { color: isFull ? chrome.warning : chrome.text }]}>
            {reservedAttendeeCount}
            {/* Don't show capacity for merge pools (capacity = 0) */}
            {pool.capacity > 0 && <Text style={{ color: chrome.textMuted }}>/{pool.capacity}</Text>}
          </Text>
        )}
      </View>

      {showRegisterCountdown ? (
        <View
          style={[
            styles.countdown,
            { backgroundColor: chrome.recessed, borderColor: chrome.edge, borderBottomColor: chrome.highlight },
          ]}
        >
          <Text style={[styles.countdownLabel, { color: chrome.textMuted }]}>
            {pool.capacity > 0 ? `${pool.capacity} plasser` : "Påmelding"} åpner om
          </Text>
          <Text style={[styles.countdownValue, { color: chrome.text }]}>{registerCountdownText}</Text>
        </View>
      ) : (
        <>
          {pool.capacity > 0 && (
            <MeterBar
              value={reservedAttendeeCount / pool.capacity}
              color={isFull ? chrome.warning : chrome.accent}
            />
          )}

          <View style={styles.statusLines}>
            {servingPunishment ? (
              <StatusLine
                icon="timer-sand"
                color={chrome.warning}
                text={`${formatDistanceToNowStrict(attendee!.earliestReservationAt, { locale: nb })} utsettelse`}
              />
            ) : (
              <AttendanceStatus attendance={attendance} attendee={attendee} />
            )}
            {hasWaitlist && (
              <Text style={[styles.waitlist, { color: chrome.textMuted }]}>{unreservedAttendeeCount} i kø</Text>
            )}
          </View>
          <PaymentStatus attendance={attendance} attendee={attendee} chargeScheduleDate={chargeScheduleDate} />
        </>
      )}

      {showPaymentCountdown && attendee?.paymentLink && (
        // A coloured raised button (lit from above) so the deadline stands out from the grey controls.
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`Betal ${attendance.attendancePrice} kr innen ${paymentCountdownText}`}
          onPress={() => attendee.paymentLink && Linking.openURL(attendee.paymentLink)}
          style={({ pressed }) => [
            styles.payment,
            {
              backgroundColor: pressed
                ? blendColors(theme.onSecondaryContainer, theme.secondaryContainer, 0.12)
                : theme.secondaryContainer,
              borderColor: chrome.edge,
              borderTopColor: blendColors("#FFFFFF", theme.secondaryContainer, 0.35),
            },
          ]}
        >
          <MaterialCommunityIcons name="timer-sand" size={22} color={theme.onSecondaryContainer} />
          <View style={styles.paymentCopy}>
            <Text style={[styles.paymentLabel, { color: theme.onSecondaryContainer }]}>Betal innen</Text>
            <Text style={[styles.paymentValue, { color: theme.onSecondaryContainer }]}>{paymentCountdownText}</Text>
          </View>
          <Text style={[styles.paymentAction, { color: theme.onSecondaryContainer }]}>
            Betal {attendance.attendancePrice} kr
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={theme.onSecondaryContainer} />
        </Pressable>
      )}
    </View>
  )
}

const StatusLine = ({ icon, text, color }: { icon: IconName; text: string; color?: string }) => {
  const chrome = usePanelChromeColors()
  return (
    <View style={styles.textItem}>
      <MaterialCommunityIcons name={icon} size={16} color={color ?? chrome.icon} />
      <Text style={[styles.statusText, { color: color ?? chrome.text }]}>{text}</Text>
    </View>
  )
}

interface AttendanceStatusProps {
  attendance: Attendance
  attendee: Attendee | null
}

const AttendanceStatus = ({ attendance, attendee }: AttendanceStatusProps) => {
  const chrome = usePanelChromeColors()

  if (!attendee) {
    return <StatusLine icon="account-outline" text="Du er ikke påmeldt" />
  }

  if (attendee.reserved === true) {
    return <StatusLine icon="account-check" color={chrome.success} text="Du er påmeldt" />
  }

  const queuePosition = getAttendeeQueuePosition(attendance, attendee.user)

  return (
    <StatusLine
      icon="account-clock-outline"
      color={chrome.warning}
      text={`Du er ${queuePosition !== null ? `${queuePosition}. ` : ""}i køen`}
    />
  )
}

interface PaymentStatusProps {
  attendance: Attendance
  attendee: Attendee | null
  chargeScheduleDate?: Date | null
}

const PaymentStatus = ({ attendance, attendee, chargeScheduleDate }: PaymentStatusProps) => {
  const chrome = usePanelChromeColors()
  const hasPaid = hasAttendeePaid(attendance, attendee)

  if (!attendance.attendancePrice || hasPaid === null) {
    return null
  }

  if (!attendee) {
    return <StatusLine icon="cash" text={`${attendance.attendancePrice} kr`} />
  }

  if (!hasPaid) {
    return <StatusLine icon="cash-remove" color={chrome.danger} text={`${attendance.attendancePrice} kr ubetalt`} />
  }

  if (attendee.paymentChargedAt) {
    return <StatusLine icon="cash-check" color={chrome.success} text={`Betalt ${attendance.attendancePrice} kr`} />
  }

  if (attendee.paymentReservedAt) {
    return (
      <View>
        <StatusLine icon="cash-check" text={`Reservert ${attendance.attendancePrice} kr`} />
        {chargeScheduleDate && (
          <Text style={[styles.hint, styles.indented, { color: chrome.textMuted }]}>
            Trekkes rundt {formatDate(roundToNearestHours(chargeScheduleDate), "dd. MMM 'kl.' HH", { locale: nb })}
          </Text>
        )}
      </View>
    )
  }

  if (attendee.paymentRefundedAt) {
    return <StatusLine icon="cash-refund" text={`Refundert ${attendance.attendancePrice} kr`} />
  }

  return null
}

const styles = StyleSheet.create({
  plainStatus: { gap: 8 },
  hint: { fontSize: 13, lineHeight: 18 },
  indented: { marginLeft: 22 },
  poolSection: { gap: 10 },
  poolHeader: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  poolTitleRow: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 8, paddingBottom: 3 },
  poolTitle: { flexShrink: 1, fontSize: 15, fontWeight: "600" },
  count: { fontSize: 22, fontWeight: "700", fontVariant: ["tabular-nums"] },
  countdown: { paddingVertical: 12, borderWidth: 1, borderRadius: 10, alignItems: "center", gap: 2 },
  countdownLabel: { fontSize: 13 },
  countdownValue: { fontSize: 24, fontWeight: "700", fontVariant: ["tabular-nums"] },
  statusLines: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  waitlist: { fontSize: 13, fontVariant: ["tabular-nums"] },
  statusText: { fontSize: 14 },
  payment: {
    minHeight: 60,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  paymentCopy: { flex: 1 },
  paymentLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase", opacity: 0.85 },
  paymentValue: { fontSize: 22, fontWeight: "700", fontVariant: ["tabular-nums"] },
  paymentAction: { fontSize: 14, fontWeight: "700" },
  textItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
})

export default MainPoolCard
