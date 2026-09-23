import { TZDate } from "@date-fns/tz"
import { isAfter, setMonth, startOfMonth } from "date-fns"

import { AttendancePool } from "types/event"
import { Membership, User } from "types/user"

export const getCurrentUTC = (): TZDate => new TZDate(new Date(), "UTC")

export const getAcademicStart = (date: TZDate | Date): TZDate => {
  // August is the 8th month, so we set the month to 7 (0-indexed)
  return startOfMonth(setMonth(date, 7))
}

export const findActiveMembership = (user: User): Membership | null => {
  const now = getCurrentUTC()
  const activeMemberships = user.memberships
    .filter((membership) => {
      if (isAfter(membership.start, now)) return false
      return membership.end === null || isAfter(membership.end, now)
    })
    .sort((a, b) => {
      if (a.semester === null && b.semester === null) return 0
      if (a.semester === null) return 1
      if (b.semester === null) return -1
      return b.semester - a.semester
    })

  return activeMemberships[0] ?? null
}


/*
Logic copied from 
https://github.com/dotkom/monoweb/blob/8dbcac7519f14aa882d9f84c24e8ce9cac217fa0/packages/utils/src/semester-helpers.ts#L170
*/
export const getGrade = (membership: Membership): number | null => {
  if (membership.semester === null) return null
  return Math.floor(membership.semester / 2) + 1
}

export const getMembershipTypeName = (type: Membership["type"]): string => {
  switch (type) {
    case "BACHELOR_STUDENT":
      return "Bachelor"
    case "MASTER_STUDENT":
      return "Master"
    case "KNIGHT":
      return "Ridder"
    case "SOCIAL_MEMBER":
      return "Sosialt medlem"
  }
}

export const getSpecializationName = (
  specialization: Membership["specialization"],
): string | null => {
  switch (specialization) {
    case "ARTIFICIAL_INTELLIGENCE":
      return "Kunstig intelligens"
    case "DATABASE_AND_SEARCH":
      return "Databaser og søk"
    case "INTERACTION_DESIGN":
      return "Interaksjonsdesign, spill- og læringsteknologi"
    case "SOFTWARE_ENGINEERING":
      return "Programvaresystemer"
    case "PROGRAMMING_AND_SECURITY_ENGINEERING":
      return "Programmering og programvaresikkerhet"
    case "VISUAL_INFORMATICS":
      return "Visuell informatikk"
    case "UNKNOWN":
    case null:
      return null
  }
}

export const getGenderName = (gender: User["gender"]): string => {
  switch (gender) {
    case "MALE":
      return "Mann"
    case "FEMALE":
      return "Kvinne"
    case "NON_BINARY":
      return "Ikke-binær"
    case "OTHER":
      return "Annet"
    case "UNKNOWN":
      return "Ikke oppgitt"
  }
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
