import React from "react"
import type { Attendance, Attendee } from "types/event"
import { User } from "types/user"

interface Props {
  attendance: Attendance
  attendee: Attendee | null
  user: User | null
}

export const PaymentCard: React.FC<Props> = () => null

export default PaymentCard
