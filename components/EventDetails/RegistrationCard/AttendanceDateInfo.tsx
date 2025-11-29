import React from "react"
import type { Attendance, Attendee } from "../../../types/event"

interface Props {
  attendance: Attendance
  attendee: Attendee | null
  chargeScheduleDate?: Date | null
}

export const AttendanceDateInfo: React.FC<Props> = () => {
  return null
}

export default AttendanceDateInfo
