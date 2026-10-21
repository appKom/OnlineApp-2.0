import React, { useEffect, useState, useRef, useSyncExternalStore } from "react"
import { View, StyleSheet } from "react-native"
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
import * as trpc from "../../../utils/trpc"
import type { DeregisterReasonType } from "../../../utils/trpc"
import { getAttendee, getAttendeeState, hasAttendeePaid } from "../../../utils/attendance"
import { updateEventReminders } from "../../../utils/reminders"
import { useBookmarks } from "../../../utils/bookmarks"
import { differenceInSeconds, isBefore, secondsToMilliseconds } from "date-fns"
import { TURNSTILE_SITE_KEY } from "../../../utils/turnstile"
import { FieldLabel, Panel, PanelDivider, PanelHeader, usePanelChromeColors } from "../../Panel"
import { LiveBannerControls } from "../../LiveBannerControls"
import { getLiveEventPhase, liveEventLinks, type LiveEvent } from "../../../utils/live-event-model"
import { getLiveEventSession, stopLiveEvent, subscribeLiveEvent, updateLiveEventRegistration } from "../../../utils/live-event-activity"
import { EVENT_START_LEAD_MS } from "../../../utils/event-timing"

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
  const [showTurnstile, setShowTurnstile] = useState(true)
  const [isVerified, setIsVerified] = useState(false)
  const [pendingTurnstileToken, setPendingTurnstileToken] = useState<string | null>(null)
  const chrome = usePanelChromeColors()

  // Pull-to-refresh on the event page hands us a fresh attendance.
  useEffect(() => {
    setAttendance(initialAttendance)
  }, [initialAttendance])

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
  const liveRegistrationStatus = getAttendeeState(attendance, attendee)
  const liveStartsAt = new Date(event.start).getTime()
  const liveEndsAt = new Date(event.end).getTime()
  const liveDoorsOpenAt = liveStartsAt - 15 * 60_000
  const liveBannerStartsAt = liveStartsAt - EVENT_START_LEAD_MS
  const liveSession = useSyncExternalStore(subscribeLiveEvent, getLiveEventSession, () => null)
  const [liveNow, setLiveNow] = useState(Date.now())
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const update = () => {
      const now = Date.now()
      setLiveNow(now)
      const next = [liveBannerStartsAt, liveDoorsOpenAt, liveStartsAt, liveEndsAt].find((time) => time > now)
      if (next) timer = setTimeout(update, Math.min(next - now, 2_147_483_647))
    }
    update()
    return () => clearTimeout(timer)
  }, [liveBannerStartsAt, liveDoorsOpenAt, liveStartsAt, liveEndsAt])
  useEffect(() => {
    if (!user || liveSession?.event.eventId !== event.id || liveSession.event.ownerId !== user.id) return
    if (!attendee) {
      void stopLiveEvent().catch((error) => console.warn("Live-banner:", error))
    } else if (liveRegistrationStatus) {
      void updateLiveEventRegistration(event.id, user.id, liveRegistrationStatus).catch((error) => console.warn("Live-banner:", error))
    }
  }, [event.id, user?.id, attendee?.id, liveRegistrationStatus, liveSession?.activityId])
  const liveEvent: LiveEvent = {
    eventId: event.id,
    title: event.title,
    location: event.locationTitle || "Sted ikke oppgitt",
    doorsOpenAt: liveDoorsOpenAt,
    startsAt: liveStartsAt,
    endsAt: liveEndsAt,
    ...liveEventLinks(event.id),
    ownerId: user?.id ?? null,
    registrationStatus: liveRegistrationStatus ?? undefined,
  }
  const livePhase = getLiveEventPhase(liveEvent, liveNow)
  const { isBookmarked } = useBookmarks()
  const bookmarked = isBookmarked(event.id)

  // Reminders follow sign-up state (registration opening while not signed up, start time once you have a spot).
  useEffect(() => {
    void updateEventReminders({ event, attendance }, user, bookmarked)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attendee?.id, attendee?.registered, bookmarked, user?.id, liveSession?.activityId, liveSession?.phase])

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
      const attendanceEventDateTimes = [attendee?.completionDeadline ? new Date(attendee.completionDeadline) : null]
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
      const bundle = await trpc.getEvent(event.id)
      if (bundle?.attendance) {
        setAttendance(bundle.attendance)
        // Signing up is a good moment to ask for notification permission for the start reminder.
        void updateEventReminders(bundle, user, bookmarked, { askPermission: true })
      }
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
  // Missing the payment deadline after the deregistration deadline suspends you but keeps your spot.
  const suspendedForThisEvent = Boolean(
    punishment?.suspended && attendee && hasAttendeePaid(attendance, attendee) === false
  )
  // A delay only matters before you sign up; a suspension matters either way.
  const showPunishment = hasPunishment && (!attendee || Boolean(punishment?.suspended))

  const statusTag = {
    NotOpened: { label: "Ikke åpnet", color: chrome.textMuted },
    Open: { label: "Åpen", color: chrome.success },
    Closed: { label: "Stengt", color: chrome.textMuted },
  }[attendanceStatus]

  const hasSelections = Boolean(attendee?.registered && (attendance.selections?.length ?? 0) > 0)

  return (
    <Panel>
      <View style={styles.section}>
        <PanelHeader title="Påmelding" tag={statusTag.label} tagColor={statusTag.color} />
      </View>

      <PanelDivider />
      <AttendanceDateInfo attendance={attendance} attendee={attendee} chargeScheduleDate={null} />
      <PanelDivider />

      <View style={styles.section}>
        {punishment && showPunishment && (
          <PunishmentBox
            punishment={punishment}
            reason={
              suspendedForThisEvent
                ? "Betalingen for dette arrangementet kom ikke inn i tide. Kontakt arrangøren for å betale, så fjernes suspensjonen."
                : undefined
            }
          />
        )}

        <MainPoolCard attendance={attendance} user={user} authorizeUrl={undefined} chargeScheduleDate={null} />
        <NonAttendablePoolsBox attendance={attendance} user={user} />

        {hasSelections && attendee && (
          <View style={styles.group}>
            <FieldLabel>Valg</FieldLabel>
            <SelectionsForm attendance={attendance} attendee={attendee} onSubmit={handleSelectionChange} disabled={attendanceStatus === "Closed"} />
          </View>
        )}
      </View>

      <PanelDivider />

      <View style={styles.section}>
        <View style={styles.buttonRow}>
          {attendee && <TicketButton attendee={attendee} />}
          <ViewAttendeesButton attendance={attendance} user={user} />
        </View>

        {user && attendee && livePhase !== "ended" && (
          <LiveBannerControls event={liveEvent} ticketValue={attendee.id} />
        )}

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
          visible={showTurnstile && Boolean(user)}
          onToken={handleTurnstileToken}
          siteKey={TURNSTILE_SITE_KEY}
        />
      </View>
    </Panel>
  )
}

const styles = StyleSheet.create({
  section: { padding: 15, gap: 12 },
  group: { gap: 8 },
  buttonRow: { flexDirection: "row", gap: 8 },
})

export default AttendanceCard
