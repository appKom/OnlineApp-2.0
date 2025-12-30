import React from "react"
import type { Attendance, Attendee, User } from "../../types/event"

interface Props {
  attendance: Attendance
  attendee: Attendee | null
  user: User | null
}

export const PaymentCard: React.FC<Props> = () => null

export default PaymentCard
