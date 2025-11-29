import React from "react"
import type { Attendance, Attendee, User } from "../../types/event"

interface Props {
  attendance: Attendance
  user: User | null
  attendeeListOpen: boolean
  setAttendeeListOpen: (open: boolean) => void
}

export const ViewAttendeesButton: React.FC<Props> = () => null

export default ViewAttendeesButton
