// Mirrors monoweb's apps/rpc/src/modules/mark/mark.ts (only the fields the app reads).

export type MarkType = "MANUAL" | "LATE_ATTENDANCE" | "MISSED_ATTENDANCE" | "MISSING_FEEDBACK" | "MISSING_PAYMENT"

export interface MarkGroup {
  slug: string
  abbreviation: string
  name: string | null
  preferredDisplayName?: "ABBREVIATION" | "NAME"
  email: string | null
  contactUrl: string | null
}

export interface Mark {
  id: string
  title: string
  details: string | null
  /** Days the mark stays active. */
  duration: number
  /** Number of marks ("prikker") this counts as. */
  weight: number
  type: MarkType
  createdAt: Date
  updatedAt: Date
  groups: MarkGroup[]
}

export interface PersonalMark {
  createdAt: Date
  markId: string
  userId: string
}

/** What `personalMark.getVisibleInformation` returns per mark: who gave it is hidden from the user. */
export interface VisiblePersonalMark {
  mark: Mark
  personalMark: PersonalMark
}
