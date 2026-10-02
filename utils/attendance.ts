import { compareAsc } from "date-fns"
import { findActiveMembership, getGrade } from "./user-utils"
import type {
  Attendance,
  AttendanceSummary,
  AttendancePool,
  Attendee,
} from "../types/event"

export type AttendanceStatus = "NotOpened" | "Open" | "Closed"

export const getAttendanceStatus = (
  attendance: Pick<Attendance, "registerStart" | "registerEnd">,
  now = new Date()
): AttendanceStatus => {
  const registerStart = attendance.registerStart ? new Date(attendance.registerStart) : null
  const registerEnd = attendance.registerEnd ? new Date(attendance.registerEnd) : null

  if (registerStart && now < registerStart) return "NotOpened"
  if (registerEnd && now > registerEnd) return "Closed"
  return "Open"
}

export const getRegisteredAttendeeCount = (attendance: Attendance, poolId?: string): number => {
  if (poolId) {
    return attendance.attendees.filter((a) => a.attendancePoolId === poolId && a.registered).length
  }
  return attendance.attendees.reduce((total, attendee) => total + (attendee.registered ? 1 : 0), 0)
}

export const getQueuedAttendeeCount = (attendance: Attendance, poolId?: string): number => {
  if (poolId) {
    return attendance.attendees.filter((a) => a.attendancePoolId === poolId && !a.registered).length
  }
  return attendance.attendees.reduce((total, attendee) => total + (attendee.registered ? 0 : 1), 0)
}

export const getAttendanceCapacity = (attendance: Pick<Attendance, "pools">): number => {
  return attendance.pools.reduce((total, pool) => total + (pool.capacity ?? 0), 0)
}

export const isAttendable = (user: any, pool: AttendancePool) => {
  const membership = findActiveMembership(user)
  if (membership === null) return false

  const grade = getGrade(membership)
  if (grade === null) return false

  if (!pool.yearCriteria || pool.yearCriteria.length === 0) return true

  return pool.yearCriteria.includes(grade)
}

export const getAttendee = (attendance: Attendance | AttendanceSummary | null | undefined, user: any | null | undefined) => {
  if (!attendance || !user) return null
  if ("currentUserAttendee" in attendance) {
    const attendee = attendance.currentUserAttendee
    return attendee?.userId === user.id ? attendee : null
  }
  return attendance.attendees?.find((attendee) => attendee.userId === user.id) ?? null
}

export const getAttendablePool = (attendance: Attendance, user: any | null) => {
  if (!user) return null

  const attendee = getAttendee(attendance, user)
  if (attendee) return attendance.pools.find((pool) => pool.id === attendee.attendancePoolId) ?? null

  return attendance.pools.find((pool) => isAttendable(user, pool)) ?? null
}

export const getNonAttendablePools = (attendance: Attendance, user: any | null) => {
  const attendablePool = getAttendablePool(attendance, user)

  return attendance.pools
    .filter((pool) => pool.id !== attendablePool?.id)
    .sort((a, b) => {
      if (a.mergeDelayHours && b.mergeDelayHours && a.mergeDelayHours !== b.mergeDelayHours) {
        return (a.mergeDelayHours ?? 0) - (b.mergeDelayHours ?? 0)
      }
      return (b.capacity ?? 0) - (a.capacity ?? 0)
    })
}

export const getAttendeeQueuePosition = (attendance: Attendance, user: any | null) => {
  const attendee = getAttendee(attendance, user)
  const pool = getAttendablePool(attendance, user)

  if (!attendee || !pool) return null

  const queuedAttendees = attendance.attendees
    .filter((a) => a.attendancePoolId === pool.id && !a.registered)
    .sort((a, b) => compareAsc(new Date(a.earliestReservationAt ?? 0), new Date(b.earliestReservationAt ?? 0)))

  const index = queuedAttendees.indexOf(attendee)
  if (index === -1) return null
  return index + 1
}

export const hasAttendeePaid = (
  attendance: Pick<Attendance | AttendanceSummary, "attendancePrice">,
  attendee: Attendee | null,
  options?: { excludeReservation?: boolean }
): boolean | null => {
  if (!attendance.attendancePrice) return null
  if (!attendee) return false

  const hasReserved = options?.excludeReservation ? false : Boolean(attendee.paymentReservedAt)
  return Boolean(attendee.paymentChargedAt || hasReserved || (attendee.paymentRefundedAt && !attendee.completionDeadline))
}

/** The deadline of a payment the attendee still has to make, or null once paid or past due. */
export const getPendingPaymentDeadline = (
  attendance: Pick<Attendance | AttendanceSummary, "attendancePrice">,
  attendee: Attendee | null,
  now = new Date()
): Date | null => {
  if (!attendee?.completionDeadline || hasAttendeePaid(attendance, attendee) !== false) return null
  const deadline = new Date(attendee.completionDeadline)
  return deadline > now ? deadline : null
}

/** QUEUED: on the waitlist. RESERVED: has a place, but must still pay before the deadline. REGISTERED: done. */
export type AttendeeState = "QUEUED" | "RESERVED" | "REGISTERED"

export type AttendanceCompletionRequirement = "PAYMENT"

/** What a registered attendee still has to do before the completion deadline (same rules as monoweb). */
export const getMissingCompletionRequirements = (
  attendance: Pick<Attendance | AttendanceSummary, "attendancePrice">,
  attendee: Attendee | null
): AttendanceCompletionRequirement[] => {
  if (!attendance.attendancePrice || attendance.attendancePrice <= 0) return []
  return hasAttendeePaid(attendance, attendee) === true ? [] : ["PAYMENT"]
}

export const getAttendeeState = (
  attendance: Pick<Attendance | AttendanceSummary, "attendancePrice">,
  attendee: Attendee | null
): AttendeeState | null => {
  if (!attendee) return null
  if (!attendee.registered) return "QUEUED"
  return getMissingCompletionRequirements(attendance, attendee).length > 0 ? "RESERVED" : "REGISTERED"
}

export default {}
