import React from "react"
import type { Attendance, Attendee, Event, User, Punishment } from "../../types/event"

interface Props {
  registerForAttendance: () => void
  unregisterForAttendance: (reason: any) => void
  attendance: Attendance
  parentAttendance?: Attendance | null
  punishment?: Punishment | null
  user: User | null
  event: Event
  isLoading?: boolean
  chargeScheduleDate?: Date | null
}

export const RegistrationButton: React.FC<Props> = () => null

export default RegistrationButton
