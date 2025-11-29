import type { Attendance } from "../../types/event"

export type AttendanceStatus = "NotOpened" | "Open" | "Closed"

export const getAttendanceStatus = (
  registerStartAndEnd: Pick<Attendance, "registerStart" | "registerEnd">,
  now = new Date()
): AttendanceStatus => {
  // minimal implementation to satisfy imports; real logic lives in monoweb
  const { registerStart, registerEnd } = registerStartAndEnd
  if (registerStart && now < new Date(registerStart)) return "NotOpened"
  if (registerEnd && now > new Date(registerEnd)) return "Closed"
  return "Open"
}

export default getAttendanceStatus
