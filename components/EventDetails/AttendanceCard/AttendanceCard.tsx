import React, { useEffect, useState, useRef } from "react"
import { View, ScrollView, Text, StyleSheet, TouchableOpacity } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import type {
  Attendance,
  Event as EventType,
  AttendanceSelectionResponse,
} from "../../../types/event"
import { User } from "../../../types/user"
import { Punishment } from "../../../types/punishment"

import { AttendanceDateInfo } from "./AttendanceDateInfo"
import { MainPoolCard } from "./MainPoolCard"
import { NonAttendablePoolsBox } from "./NonAttendablePoolsBox"
import { PunishmentBox } from "./PunishmentBox"
import { RegistrationButton } from "./RegistrationButton"
import { SelectionsForm } from "./SelectionsForm"
import { TicketButton } from "./TicketButton"
import { ViewAttendeesButton } from "./ViewAttendeesButton"
import { TurnstileBox } from "../../TurnstileModal"

import { getAttendanceStatus } from "../../../types/attendanceStatus"
import { useTheme } from "../../../utils/theme"
import * as trpc from "../../../utils/trpc"
import type { DeregisterReasonType } from "../../../utils/trpc"
import { getAttendee } from "../../../utils/attendance"
import { scheduleRegistrationReminder, cancelRegistrationReminder, isRegistrationReminderScheduled } from "../../../utils/notifications"
import { differenceInSeconds, isBefore, secondsToMilliseconds } from "date-fns"
import { TURNSTILE_SITE_KEY } from "../../../utils/turnstile"
import { useEventChromeColors } from "../EventSurface"
import { EventInsetDivider } from "../EventSurface"

interface AttendanceCardProps {
  user: User | null
  event: EventType
  initialAttendance: Attendance
  initialPunishment: Punishment | null
  parentEvent: EventType | null
  parentAttendance: Attendance | null
}

export const AttendanceCard: React.FC<AttendanceCardProps> = ({
  user,
  event,
  initialAttendance,
  initialPunishment,
  parentAttendance,
}) => {
  const [attendance, setAttendance] = useState<Attendance>(initialAttendance)
  const [punishment, setPunishment] = useState<Punishment | null>(initialPunishment)
  const [attendanceStatus, setAttendanceStatus] = useState(() => getAttendanceStatus(initialAttendance))
  const [notificationScheduled, setNotificationScheduled] = useState(false)
  const [showTurnstile, setShowTurnstile] = useState(true)
  const [isVerified, setIsVerified] = useState(false)
  const [pendingTurnstileToken, setPendingTurnstileToken] = useState<string | null>(null)
  const theme = useTheme()
  const chrome = useEventChromeColors()

  useEffect(() => {
    setAttendanceStatus(getAttendanceStatus(attendance))
  }, [attendance])

  // Hide Turnstile if user is already registered
  useEffect(() => {
    const attendee = getAttendee(attendance, user)
    if (attendee) {
      setShowTurnstile(false)
      setIsVerified(true)
    }
  }, [attendance, user])

  // Check if a notification is already scheduled for this event
  useEffect(() => {
    let mounted = true
    async function checkNotificationScheduled() {
      const isScheduled = await isRegistrationReminderScheduled(event.id)
      if (mounted) {
        setNotificationScheduled(isScheduled)
      }
    }
    void checkNotificationScheduled()
    return () => {
      mounted = false
    }
  }, [event.id])

  // Fetch server-computed punishment for the current user (mirrors RPC logic)
  useEffect(() => {
    let mounted = true
    async function fetchPunishment() {
      if (!user) return
      try {
        const p = await trpc.getExpiryDateForUser(user.id)
        if (!mounted) return
        setPunishment(p)
      } catch (e) {
        // ignore
      }
    }

    void fetchPunishment()

    return () => {
      mounted = false
    }
  }, [user])

  const attendee = getAttendee(attendance, user)
  const [chargeScheduleDate, setChargeScheduleDate] = useState<Date | null>(null)

  // Fetch attendance from server
  const fetchAttendance = async () => {
    try {
      const bundle = await trpc.getEvent(event.id)
      if (bundle?.attendance) setAttendance(bundle.attendance)
    } catch (e) {
      // ignore
    }
  }

  // Polling / subscription emulation: refetch attendance and punishment periodically.
  const [closeToEvent, setCloseToEvent] = useState(false)
  const pollingRef = useRef<number | null>(null)

  useEffect(() => {
    let mounted = true

    // initial fetch
    void fetchAttendance()

    const updateCloseToEvent = () => {
      const attendanceEventDateTimes = [attendee?.paymentDeadline ? new Date(attendee.paymentDeadline) : null]
      setCloseToEvent(
        attendanceEventDateTimes.some((date) => date && Math.abs(differenceInSeconds(date, new Date())) < 60)
      )
    }

    updateCloseToEvent()

    const intervalMs = closeToEvent ? secondsToMilliseconds(1) : secondsToMilliseconds(60)
    pollingRef.current = setInterval(() => {
      void fetchAttendance()
    }, intervalMs) as unknown as number

    return () => {
      mounted = false
      if (pollingRef.current) clearInterval(pollingRef.current as unknown as number)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id, closeToEvent])

  useEffect(() => {
    let mounted = true

    if (!attendee?.id || !attendance.attendancePrice) {
      setChargeScheduleDate(null)
      return
    }

    const attendeeId = attendee.id

    async function fetchChargeDate() {
      try {
        const d = await trpc.findChargeAttendeeScheduleDate(attendeeId)
        if (!mounted) return
        setChargeScheduleDate(d ?? null)
      } catch (e) {
        if (!mounted) return
        setChargeScheduleDate(null)
      }
    }

    void fetchChargeDate()

    return () => {
      mounted = false
    }
  }, [attendee?.id, attendance.attendancePrice])

  const registerForAttendance = async () => {
    if (!isVerified || !pendingTurnstileToken) {
      // Button should be disabled, but just in case
      return
    }
    
    // Register with the stored Turnstile token
    try {
      await trpc.registerForEvent(attendance.id ?? "", pendingTurnstileToken)
      await fetchAttendance()
    } catch (e) {
      console.error("Registration error:", e)
      // Reset verification on error
      setIsVerified(false)
      setPendingTurnstileToken(null)
      setShowTurnstile(true)
    }
  }

  const handleTurnstileToken = async (token: string) => {
    // Token received from Turnstile - just store it, don't register yet
    setIsVerified(true)
    setPendingTurnstileToken(token)
    setShowTurnstile(false)
  }

  const deregisterForAttendance = async (deregisterReason: { type: DeregisterReasonType; details?: string | null }) => {
    try {
      await trpc.deregisterForEvent(attendance.id ?? "", deregisterReason.type, deregisterReason.details ?? undefined)
      await fetchAttendance()
      
      // Reset Turnstile verification immediately so user can register again
      setShowTurnstile(true)
      setIsVerified(false)
      setPendingTurnstileToken(null)
    } catch (e) {
      // ignore errors for stub
    }
  }

  const handleSelectionChange = async (selections: AttendanceSelectionResponse[]) => {
    if (!attendee?.id) {
      return
    }

    try {
      // Save selections to server
      await trpc.setSelectionsOptions(attendee.id, selections)
    } catch (e) {
      console.error("Error saving selections:", e)
    }
  }

  const hasPunishment = Boolean(punishment && (punishment.delay > 0 || punishment.suspended))

  const handleToggleNotification = async () => {
    if (notificationScheduled) {
      await cancelRegistrationReminder(event.id)
      setNotificationScheduled(false)
    } else {
      const scheduled = await scheduleRegistrationReminder(event, attendance)
      setNotificationScheduled(scheduled)
    }
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        {
          backgroundColor: chrome.surface,
          borderColor: chrome.edge,
          borderTopColor: chrome.highlight,
          shadowColor: theme.shadow,
          shadowOpacity: chrome.shadowOpacity,
        },
      ]}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: theme.onSurface, fontSize: 20, fontWeight: "700" }}>{"Påmelding"}</Text>
        <TouchableOpacity onPress={handleToggleNotification} style={{ padding: 8 }}>
          <View style={{ alignItems: "center" }}>
            <MaterialIcons name={notificationScheduled ? "notifications-active" : "notifications"} size={24} color={chrome.icon} />
            {/* <Text style={{ fontSize: 12, color: theme.primary, fontWeight: "600" }}>{notificationScheduled ? "Avbryt" : "Påminnelse"}</Text> */}
          </View>
        </TouchableOpacity>
      </View>

      <AttendanceDateInfo attendance={attendance} attendee={attendee} chargeScheduleDate={null} />
      <EventInsetDivider />

      {punishment && hasPunishment && !attendee && <PunishmentBox punishment={punishment} />}

      <MainPoolCard attendance={attendance} user={user} authorizeUrl={undefined} chargeScheduleDate={null} />
      <EventInsetDivider />

      <View style={{ gap: 8 }}> 
        {attendee?.reserved && (attendance.selections?.length ?? 0) > 0 && (
          <SelectionsForm attendance={attendance} attendee={attendee} onSubmit={handleSelectionChange} disabled={attendanceStatus === "Closed"} />
        )}

        <NonAttendablePoolsBox attendance={attendance} user={user} />

        <View style={{ flexDirection: "row", gap: 8 }}>
          {attendee?.reserved && <TicketButton attendee={attendee} />}
          <ViewAttendeesButton attendance={attendance} user={user} />
        </View>
      </View>
      <EventInsetDivider />

      <RegistrationButton
        registerForAttendance={registerForAttendance}
        unregisterForAttendance={deregisterForAttendance}
        attendance={attendance}
        parentAttendance={parentAttendance}
        punishment={punishment}
        user={user}
        event={event}
        isLoading={false}
        chargeScheduleDate={null}
        isVerified={isVerified}
      />

      <TurnstileBox
        visible={showTurnstile}
        onToken={handleTurnstileToken}
        siteKey={TURNSTILE_SITE_KEY}
      />

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 5,
    gap: 12,
  },
})

export default AttendanceCard
