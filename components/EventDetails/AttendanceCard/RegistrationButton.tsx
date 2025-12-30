import React, { useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { isFuture, min } from "date-fns"
import type { Attendance, Attendee, Event } from "../../../types/event"
import type Punishment from "../../../types/punishment"
import type { User } from "../../../types/user"
import type { AttendanceStatus } from "../../../types/attendanceStatus"
import { getAttendee, getAttendablePool, getAttendanceStatus, getReservedAttendeeCount } from "../../../utils/attendance"
import { findActiveMembership } from "../../../utils/user-utils"
import { useTheme } from "../../../utils/theme"
import { DeregisterModal, type DeregisterReasonFormResult } from "../DeregisterModal"

const getButtonColor = (
  theme: ReturnType<typeof useTheme>,
  disabled: boolean,
  attendee: boolean,
  isPoolFull: boolean,
  hasPunishment: boolean,
  hasMergeDelay: boolean
) => {
  if (disabled) return { backgroundColor: theme.surfaceVariant, color: theme.onSurfaceVariant }
  if (attendee) return { backgroundColor: theme.deregisterButton, color: theme.onDeregisterButton }
  if (isPoolFull || hasPunishment || hasMergeDelay)
    return { backgroundColor: theme.registerForWaitlist, color: theme.onRegisterForWaitlist }

  return { backgroundColor: theme.registerButton, color: theme.onRegisterButton }
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
}) => {
  const theme = useTheme()
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
  const disabled = Boolean(disabledText)

  const colors = getButtonColor(theme, disabled, Boolean(attendee), isPoolFull, hasPunishment, hasMergeDelay)

  const getIconName = () => {
    if (disabled) return "lock"
    if (attendee) return "account-minus"
    return "account-plus"
  }

  return (
    <View style={{ gap: 8 }}>
      <TouchableOpacity
        onPress={attendee ? () => setDeregisterModalOpen(true) : registerForAttendance}
        disabled={disabled || isLoading}
        style={[
          styles.button,
          {
            backgroundColor: colors.backgroundColor,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.color} size="small" />
        ) : (
          <View style={styles.buttonContent}>
            <MaterialCommunityIcons name={getIconName()} size={20} color={colors.color} />
            <Text style={[styles.buttonText, { color: colors.color }]}>{buttonText}</Text>
          </View>
        )}
      </TouchableOpacity>

      {disabled && disabledText && (
        <View style={[styles.disabledTextContainer, { backgroundColor: theme.surfaceVariant }]}>
          <MaterialCommunityIcons name="alert-circle" size={16} color={theme.onSurfaceVariant} />
          <Text style={[styles.disabledText, { color: theme.onSurfaceVariant }]}>{disabledText}</Text>
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
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 48,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  disabledTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  disabledText: {
    fontSize: 13,
    flex: 1,
  },
})
