import React from "react"
import { View, Text, Pressable, StyleSheet, Linking } from "react-native"
import type { Attendance } from "../../../types/event"
import {
  getAttendee,
  getAttendeeQueuePosition,
  getAttendeeState,
  getMissingCompletionRequirements,
  hasAttendeePaid,
  type AttendeeState,
} from "../../../utils/attendance"
import { useCountdown } from "../../../utils/use-countdown"
import { User } from "../../../types/user"
import { Attendee } from "../../../types/event"
import { findActiveMembership } from "../../../utils/user-utils"
import {getAttendablePool, 
  getRegisteredAttendeeCount, 
  getQueuedAttendeeCount 
} from "../../../utils/attendance"
import {
  formatDate,
  formatDistanceToNowStrict,
  interval,
  isAfter,
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

  // Since monoweb#3870 a registered attendee only has a reserved place until they complete the
  // requirements (for now just payment) before the completion deadline.
  const attendeeState = getAttendeeState(attendance, attendee)
  const missingRequirements = attendee ? getMissingCompletionRequirements(attendance, attendee) : []
  const paymentIsMissing = missingRequirements.includes("PAYMENT")
  const completionDeadline = attendee?.completionDeadline ? new Date(attendee.completionDeadline) : null

  const completionCountdownText = useCountdown(completionDeadline)
  const completionCountdownInterval =
    attendee?.createdAt && completionDeadline ? interval(attendee.createdAt, completionDeadline) : null
  const isWithinCompletionCountdown = completionCountdownInterval
    ? isWithinInterval(now, completionCountdownInterval)
    : false
  const completionDeadlineHasPassed = completionDeadline !== null && isAfter(now, completionDeadline)
  const showCompletionPanel =
    missingRequirements.length > 0 &&
    completionDeadline !== null &&
    (isWithinCompletionCountdown || completionDeadlineHasPassed)
  const paymentLink = paymentIsMissing ? attendee?.paymentLink ?? null : null

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

  const queuedAttendeeCount = getQueuedAttendeeCount(attendance, pool.id)
  const registeredAttendeeCount = getRegisteredAttendeeCount(attendance, pool.id)
  const hasWaitlist = queuedAttendeeCount > 0
  const isFull = pool.capacity > 0 && registeredAttendeeCount >= pool.capacity

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
            {registeredAttendeeCount}
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
              value={registeredAttendeeCount / pool.capacity}
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
              <AttendanceStatus attendance={attendance} attendee={attendee} state={attendeeState} />
            )}
            {hasWaitlist && (
              <Text style={[styles.waitlist, { color: chrome.textMuted }]}>{queuedAttendeeCount} i kø</Text>
            )}
          </View>
          <PaymentStatus
            attendance={attendance}
            attendee={attendee}
            chargeScheduleDate={chargeScheduleDate}
            hideUnpaidStatus={showCompletionPanel && paymentIsMissing}
          />
        </>
      )}

      {showCompletionPanel && (
        <CompletionPanel
          countdownText={completionDeadlineHasPassed ? null : completionCountdownText}
          paymentIsMissing={paymentIsMissing}
          paymentLink={paymentLink}
          price={attendance.attendancePrice ?? null}
        />
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

/**
 * Mirrors the website's completion card: a coloured raised surface (lit from above) with the deadline,
 * what is missing, and a way to pay when that is what's missing.
 */
const CompletionPanel = ({
  countdownText,
  paymentIsMissing,
  paymentLink,
  price,
}: {
  /** Null once the deadline has passed. */
  countdownText: string | null
  paymentIsMissing: boolean
  paymentLink: string | null
  price: number | null
}) => {
  const chrome = usePanelChromeColors()
  const theme = useTheme()
  const color = theme.onSecondaryContainer
  const surface = {
    backgroundColor: theme.secondaryContainer,
    borderColor: chrome.edge,
    borderTopColor: blendColors("#FFFFFF", theme.secondaryContainer, 0.35),
  }

  const content = (
    <>
      <MaterialCommunityIcons name="timer-sand" size={22} color={color} />
      <View style={styles.paymentCopy}>
        <Text style={[styles.paymentLabel, { color }]}>
          {countdownText ? "Fullfør innen" : "Fristen for å fullføre er ute"}
        </Text>
        {countdownText ? <Text style={[styles.paymentValue, { color }]}>{countdownText}</Text> : null}
        {paymentIsMissing && (
          <View style={styles.textItem}>
            <MaterialCommunityIcons name="close" size={15} color={color} />
            <Text style={[styles.statusText, { color }]}>Du har ikke betalt</Text>
          </View>
        )}
      </View>
      {paymentLink && (
        <>
          <Text style={[styles.paymentAction, { color }]}>{price ? `Betal ${price} kr` : "Betal"}</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={color} />
        </>
      )}
    </>
  )

  if (!paymentLink) {
    return <View style={[styles.payment, surface]}>{content}</View>
  }

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={
        countdownText ? `Fullfør påmeldingen innen ${countdownText}. Gå til betaling` : "Gå til betaling"
      }
      onPress={() => Linking.openURL(paymentLink)}
      style={({ pressed }) => [
        styles.payment,
        surface,
        pressed && { backgroundColor: blendColors(color, theme.secondaryContainer, 0.12) },
      ]}
    >
      {content}
    </Pressable>
  )
}

interface AttendanceStatusProps {
  attendance: Attendance
  attendee: Attendee | null
  state: AttendeeState | null
}

const AttendanceStatus = ({ attendance, attendee, state }: AttendanceStatusProps) => {
  const chrome = usePanelChromeColors()

  if (!attendee) {
    return <StatusLine icon="account-outline" text="Du er ikke påmeldt" />
  }

  if (state === "RESERVED") {
    return <StatusLine icon="account-clock" color={chrome.warning} text="Du har reservert plass" />
  }

  if (state === "REGISTERED") {
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
  /** The completion panel already says the payment is missing. */
  hideUnpaidStatus?: boolean
}

const PaymentStatus = ({ attendance, attendee, chargeScheduleDate, hideUnpaidStatus = false }: PaymentStatusProps) => {
  const chrome = usePanelChromeColors()
  const hasPaid = hasAttendeePaid(attendance, attendee)

  if (!attendance.attendancePrice || hasPaid === null) {
    return null
  }

  if (!attendee) {
    return <StatusLine icon="cash" text={`${attendance.attendancePrice} kr`} />
  }

  // Queued attendees don't pay until they get a place.
  if (!attendee.registered) {
    return null
  }

  if (!hasPaid) {
    if (hideUnpaidStatus) return null
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
    paddingVertical: 10,
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
