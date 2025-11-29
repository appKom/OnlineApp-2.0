import React from "react"
import type { Attendance, User } from "../../types/event"

interface Props {
  attendance: Attendance
  user: User | null
}

export const NonAttendablePoolsBox: React.FC<Props> = () => null

export default NonAttendablePoolsBox
