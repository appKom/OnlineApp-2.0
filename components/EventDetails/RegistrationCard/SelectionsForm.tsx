import React from "react"
import type { Attendance, Attendee, AttendanceSelectionResponse } from "../../types/event"

interface Props {
  attendance: Attendance
  attendee: Attendee
  onSubmit: (selections: AttendanceSelectionResponse[]) => void
  disabled?: boolean
}

export const SelectionsForm: React.FC<Props> = () => null

export default SelectionsForm
