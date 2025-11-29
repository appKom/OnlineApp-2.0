import React from "react"
import type { Attendance, User } from "../../types/event"

interface Props {
  attendance: Attendance
  user: User | null
  authorizeUrl?: string
  chargeScheduleDate?: Date | null
}

export const MainPoolCard: React.FC<Props> = () => null

export default MainPoolCard
