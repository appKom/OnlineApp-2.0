import { TZDate } from "@date-fns/tz"
import { differenceInYears, isAfter, setMonth, startOfMonth } from "date-fns"

import { AttendancePool } from "types/event"
import { Membership, User } from "types/user"

export const getCurrentUTC = (): TZDate => new TZDate(new Date(), "UTC")

export const getAcademicStart = (date: TZDate | Date): TZDate => {
  // August is the 8th month, so we set the month to 7 (0-indexed)
  return startOfMonth(setMonth(date, 7))
}

export const findActiveMembership = (user: User): Membership | null => {
  const now = getCurrentUTC()
  return user.memberships.findLast((membership) => isAfter(membership.end, now)) ?? null
}


/*
Logic copied from 
https://github.com/dotkom/monoweb/blob/8dbcac7519f14aa882d9f84c24e8ce9cac217fa0/packages/utils/src/semester-helpers.ts#L170
*/
export const getGrade = (membership: Membership): number => {
  return Math.floor(membership.semester / 2) + 1
}

export const getUserPool = (user: User, pools: AttendancePool[]): AttendancePool | undefined => {
  const activeMembership = findActiveMembership(user)
  if (!activeMembership) return undefined

  const userYear = getGrade(activeMembership)
  if (!userYear) return undefined

  return pools.find((pool) => pool.yearCriteria.includes(userYear))
}

export const getUserPoolIndex = (user: User, pools: AttendancePool[]): number | undefined => {
  const activeMembership = findActiveMembership(user)
  if (!activeMembership) return undefined

  const userYear = getGrade(activeMembership)
  if (!userYear) return undefined

  return pools.findIndex((pool) => pool.yearCriteria.includes(userYear))
}
