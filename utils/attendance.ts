import { compareAsc } from "date-fns"
import { findActiveMembership, getMembershipGrade } from "./user-utils"
import type {
  Attendance,
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

export const getReservedAttendeeCount = (attendance: Attendance, poolId?: string): number => {
  if (poolId) {
    return attendance.attendees.filter((a) => a.attendancePoolId === poolId && a.reserved).length
  }
  return attendance.attendees.reduce((total, attendee) => total + (attendee.reserved ? 1 : 0), 0)
}

export const getUnreservedAttendeeCount = (attendance: Attendance, poolId?: string): number => {
  if (poolId) {
    return attendance.attendees.filter((a) => a.attendancePoolId === poolId && !a.reserved).length
  }
  return attendance.attendees.reduce((total, attendee) => total + (attendee.reserved ? 0 : 1), 0)
}

export const getAttendanceCapacity = (attendance: Attendance): number => {
  return attendance.pools.reduce((total, pool) => total + (pool.capacity ?? 0), 0)
}

export const isAttendable = (user: any, pool: AttendancePool) => {
  const membership = findActiveMembership(user)
  if (membership === null) return false

  const grade = getMembershipGrade(membership)
  if (grade === null) return false

  if (!pool.yearCriteria || pool.yearCriteria.length === 0) return true

  return pool.yearCriteria.includes(grade)
}

export const getAttendee = (attendance: Attendance | null | undefined, user: any | null | undefined) => {
  if (!attendance || !user) return null
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

  const unreservedAttendees = attendance.attendees
    .filter((a) => a.attendancePoolId === pool.id && !a.reserved)
    .sort((a, b) => compareAsc(new Date(a.earliestReservationAt ?? 0), new Date(b.earliestReservationAt ?? 0)))

  const index = unreservedAttendees.indexOf(attendee)
  if (index === -1) return null
  return index + 1
}

export const hasAttendeePaid = (
  attendance: Attendance,
  attendee: Attendee | null,
  options?: { excludeReservation?: boolean }
): boolean | null => {
  if (!attendance.attendancePrice) return null
  if (!attendee) return false

  const hasReserved = options?.excludeReservation ? false : Boolean(attendee.paymentReservedAt)
  return Boolean(attendee.paymentChargedAt || hasReserved || (attendee.paymentRefundedAt && !attendee.paymentDeadline))
}

export default {}
