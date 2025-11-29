// Lightweight Punishment type adapted from monoweb's schemas.
// Kept as a plain TS type to avoid adding runtime zod dependencies.

export type Punishment = {
  suspended: boolean
  /** Delay in hours */
  delay: number
}

export const DEFAULT_MARK_DURATION = 14 as const

export default Punishment
