import React, { useEffect, useState, useRef } from "react"
import { View, ScrollView, Text, StyleSheet, Linking, TouchableOpacity } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import type {
  Attendance,
  Event as EventType,
  AttendanceSelectionResponse,
} from "../../../types/event"
import { User } from "../../../types/user"
import { Punishment } from "../../../types/punishment"

import { AttendanceDateInfo } from "./AttendanceDateInfo"
import { EventRules } from "./EventRules"
import { MainPoolCard } from "./MainPoolCard"
import { NonAttendablePoolsBox } from "./NonAttendablePoolsBox"
import { PaymentExplanationDialog } from "./PaymentExplanationDialog"
import { PunishmentBox } from "./PunishmentBox"
import { RegistrationButton } from "./RegistrationButton"
import { SelectionsForm } from "./SelectionsForm"
import { TicketButton } from "./TicketButton"
import { ViewAttendeesButton } from "./ViewAttendeesButton"

import { getAttendanceStatus } from "../../../types/attendanceStatus"
import { useTheme } from "../../../utils/theme"
import * as trpc from "../../../utils/trpc"
import type { DeregisterReasonType } from "../../../utils/trpc"
import { getAttendee } from "../../../utils/attendance"
import { differenceInSeconds, isBefore, secondsToMilliseconds } from "date-fns"

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
  const theme = useTheme()

  useEffect(() => {
    setAttendanceStatus(getAttendanceStatus(attendance))
  }, [attendance])

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
    try {
      await trpc.registerForEvent(attendance.id ?? "")
      await fetchAttendance()
    } catch (e) {
      // ignore errors for stub
    }
  }

  const deregisterForAttendance = async (deregisterReason: { type: DeregisterReasonType; details?: string | null }) => {
    try {
      await trpc.deregisterForEvent(attendance.id ?? "", deregisterReason.type, deregisterReason.details ?? undefined)
      await fetchAttendance()
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

  return (
    <ScrollView contentContainerStyle={[styles.container, {backgroundColor: theme.surfaceContainer}]}>
      <Text style={{ color: theme.primary, fontSize: 20, fontWeight: "700" }}>{"Påmelding"}</Text>

      <AttendanceDateInfo attendance={attendance} attendee={attendee} chargeScheduleDate={null} />

      {punishment && hasPunishment && !attendee && <PunishmentBox punishment={punishment} />}

      <MainPoolCard attendance={attendance} user={user} authorizeUrl={undefined} chargeScheduleDate={null} />

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
      />

      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        <EventRules />
        <TouchableOpacity onPress={() => Linking.openURL("https://online.ntnu.no/innstillinger/profil")} style={{ marginLeft: 8 }}>
          <View style={{ flexDirection: "row", gap: 2, alignItems: "center" }}>
            <MaterialIcons name="edit" size={16} color={theme.onBackground} />
            <Text style={{ fontSize: 14, color: theme.onBackground }}>Matallergier</Text>
          </View>
        </TouchableOpacity>
        {attendance.attendancePrice && <PaymentExplanationDialog />}
      </View>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    gap: 20,
  },
})

export default AttendanceCard
