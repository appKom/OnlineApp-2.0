import React, { useState } from "react"
import { View, Text, StyleSheet } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { isFuture, min } from "date-fns"
import type { Attendance, Attendee, Event } from "../../../types/event"
import type Punishment from "../../../types/punishment"
import type { User } from "../../../types/user"
import type { AttendanceStatus } from "../../../types/attendanceStatus"
import { getAttendee, getAttendablePool, getAttendanceStatus, getReservedAttendeeCount } from "../../../utils/attendance"
import { findActiveMembership } from "../../../utils/user-utils"
import { DeregisterModal, type DeregisterReasonFormResult } from "../DeregisterModal"
import { RaisedButton, usePanelChromeColors } from "../../Panel"
import Authenticator from "../../../utils/authenticator"

const getButtonVariant = (
  attendee: boolean,
  isPoolFull: boolean,
  hasPunishment: boolean,
  hasMergeDelay: boolean
) => {
  if (attendee) return "danger" as const
  if (isPoolFull || hasPunishment || hasMergeDelay) return "warning" as const
  return "accent" as const
}

const getDisabledText = (
  status: AttendanceStatus,
  attendee: Attendee | null,
  pool: boolean,
  hasBeenCharged: boolean,
  isPastDeregisterDeadline: boolean,
  isLoggedIn: boolean,
  hasMembership: boolean,
  isSuspended: boolean,
  registeredToParentEvent: boolean | null,
  reservedToParentEvent: boolean | null
) => {
  if (!isLoggedIn) {
    return "Du må være innlogget for å melde deg på"
  }

  if (attendee) {
    if (isPastDeregisterDeadline && attendee.reserved) {
      return "Avmeldingsfristen har utløpt"
    }
    if (hasBeenCharged) {
      return "Betaling er utført. Kontakt arrangør for avmelding og refusjon"
    }

    return null
  }

  if (isSuspended) {
    return "Du er suspendert fra Online"
  }
  if (!hasMembership) {
    return "Du må ha registrert medlemskap for å melde deg på"
  }
  if (status === "NotOpened") {
    return "Påmeldinger har ikke åpnet"
  }
  if (status === "Closed") {
    return "Påmeldingen er stengt"
  }
  if (!pool) {
    return "Du har ingen påmeldingsgruppe"
  }
  if (registeredToParentEvent === false) {
    return "Du er ikke påmeldt foreldrearrangementet"
  }
  if (reservedToParentEvent === false && registeredToParentEvent === true) {
    return "Du er i kø på foreldrearrangementet"
  }

  return null
}

interface RegistrationButtonProps {
  registerForAttendance: () => void
  unregisterForAttendance: (reason: DeregisterReasonFormResult) => void
  attendance: Attendance
  parentAttendance?: Attendance | null
  punishment?: Punishment | null
  user: User | null
  event: Event
  isLoading?: boolean
  chargeScheduleDate?: Date | null
  isVerified?: boolean
}

export const RegistrationButton: React.FC<RegistrationButtonProps> = ({
  registerForAttendance,
  unregisterForAttendance,
  attendance,
  parentAttendance,
  punishment,
  user,
  event,
  isLoading,
  chargeScheduleDate,
  isVerified,
}) => {
  const chrome = usePanelChromeColors()
  const [deregisterModalOpen, setDeregisterModalOpen] = useState(false)

  const attendee = getAttendee(attendance, user)
  const pool = getAttendablePool(attendance, user)
  const attendanceStatus = getAttendanceStatus(attendance)
  const hasMembership = user !== null && Boolean(findActiveMembership(user))

  const actualDeregisterDeadline = chargeScheduleDate
    ? min([attendance.deregisterDeadline, chargeScheduleDate])
    : attendance.deregisterDeadline

  const isPastDeregisterDeadline = !isFuture(actualDeregisterDeadline)
  const hasMergeDelay = pool?.mergeDelayHours ? pool.mergeDelayHours > 0 : false
  const isSuspended = punishment?.suspended ?? false
  const hasPunishment = punishment ? punishment.delay > 0 || isSuspended : false
  const isPoolFull = pool
    ? pool.capacity !== 0 && getReservedAttendeeCount(attendance, pool?.id) >= pool.capacity
    : false

  const parentAttendanceAttendee = parentAttendance && getAttendee(parentAttendance, user)
  const registeredToParentEvent = parentAttendance ? Boolean(parentAttendanceAttendee) : null
  const reservedToParentEvent = parentAttendance && parentAttendanceAttendee ? parentAttendanceAttendee.reserved : null

  const buttonText = attendee ? "Meld meg av" : "Meld meg på"

  const disabledText = getDisabledText(
    attendanceStatus,
    attendee,
    Boolean(pool),
    Boolean(attendee?.paymentChargedAt),
    isPastDeregisterDeadline,
    Boolean(user),
    hasMembership,
    isSuspended,
    registeredToParentEvent,
    reservedToParentEvent
  )
  
  // Disable if there's an existing reason OR if trying to register and not verified
  const needsVerification = !attendee && !isVerified
  const disabled = Boolean(disabledText) || needsVerification
  
  const finalDisabledText = needsVerification ? "Fullfør sikkerhetskontroll" : disabledText

  const variant = getButtonVariant(Boolean(attendee), isPoolFull, hasPunishment, hasMergeDelay)

  const getIconName = () => {
    if (disabled) return "lock-outline" as const
    if (attendee) return "account-minus-outline" as const
    return "account-plus-outline" as const
  }

  if (!user) {
    // Login opens in a browser sheet on top of this screen; the event page refetches once signed in.
    return (
      <RaisedButton
        icon="login"
        label="Logg inn for å melde deg på"
        tone="accent"
        onPress={() => void Authenticator.login()}
      />
    )
  }

  return (
    <View style={styles.container}>
      <RaisedButton
        icon={getIconName()}
        label={isLoading ? "Vent…" : buttonText}
        tone={disabled ? "default" : variant}
        disabled={disabled || isLoading}
        onPress={attendee ? () => setDeregisterModalOpen(true) : registerForAttendance}
      />

      {disabled && finalDisabledText && (
        <View style={styles.disabledTextContainer}>
          <MaterialCommunityIcons name="information-outline" size={14} color={chrome.textMuted} />
          <Text style={[styles.disabledText, { color: chrome.textMuted }]}>{finalDisabledText}</Text>
        </View>
      )}

      {attendee && (
        <DeregisterModal
          open={deregisterModalOpen}
          setOpen={setDeregisterModalOpen}
          event={event}
          unregisterForAttendance={unregisterForAttendance}
          attendee={attendee}
        />
      )}
    </View>
  )
}

export default RegistrationButton

const styles = StyleSheet.create({
  container: { gap: 6 },
  disabledTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4,
  },
  disabledText: {
    fontSize: 13,
    flex: 1,
  },
})
