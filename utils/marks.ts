import { TZDate } from "@date-fns/tz"
import { type Interval, addDays, addYears, differenceInDays, getYear, interval, isPast, isWithinInterval } from "date-fns"
import type { MarkGroup, VisiblePersonalMark } from "../types/mark"

// Ported from monoweb's packages/utils/src/holidays.ts so expiry dates match the website and the API.
const JANUARY = 0
const JUNE = 5
const AUGUST = 7
const DECEMBER = 11

function getHolidaysThisYear(): Interval[] {
  const now = new Date()
  const currentYear = getYear(now)
  const nextYear = getYear(addYears(now, 1))

  return [
    interval(new TZDate(currentYear, JUNE, 6), new TZDate(currentYear, AUGUST, 15)),
    interval(new TZDate(currentYear, DECEMBER, 19), new TZDate(nextYear, JANUARY, 6)),
  ]
}

/** Marks are paused over the summer and Christmas holidays. */
export function getPunishmentExpiryDate(startDate: Date, durationDays: number) {
  let endDate = addDays(startDate, durationDays)

  for (const holiday of getHolidaysThisYear()) {
    if (isWithinInterval(startDate, holiday)) {
      endDate = addDays(endDate, differenceInDays(holiday.end, startDate))
    } else if (isWithinInterval(endDate, holiday)) {
      endDate = addDays(endDate, differenceInDays(holiday.end, holiday.start))
    }
  }

  return endDate
}

/** Payment suspensions are given a huge duration since the API has no "until resolved". */
export const isIndefiniteMark = (durationDays: number) => durationDays >= 10_000

export const getMarkExpiry = ({ mark, personalMark }: VisiblePersonalMark) =>
  getPunishmentExpiryDate(new Date(personalMark.createdAt), mark.duration)

export const isMarkActive = (info: VisiblePersonalMark) => !isPast(getMarkExpiry(info))

export const getActiveMarkWeight = (marks: VisiblePersonalMark[]) =>
  marks.filter(isMarkActive).reduce((total, { mark }) => total + mark.weight, 0)

/** Weight thresholds from monoweb's findPunishmentByUserId. */
export const SUSPENSION_WEIGHT = 6

export const getDelayHoursForWeight = (weight: number) => {
  if (weight >= SUSPENSION_WEIGHT) return null
  if (weight >= 3) return 24
  if (weight === 2) return 4
  if (weight === 1) return 1
  return 0
}

export const getGroupDisplayName = (group: MarkGroup) =>
  group.preferredDisplayName === "NAME" && group.name ? group.name : group.abbreviation

export const formatMarkCount = (count: number) => `${count} prikk${count === 1 ? "" : "er"}`
