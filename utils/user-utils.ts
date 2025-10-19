import { TZDate } from "@date-fns/tz";
import { differenceInYears, isAfter, setMonth, startOfMonth } from "date-fns";

import { AttendancePool } from "types/event";
import { Membership, User } from "types/user";

export class UserUtils {
  static getCurrentUTC(): TZDate {
    return new TZDate(new Date(), "UTC");
  }

  static getAcademicStart(date: TZDate | Date): TZDate {
    // August is the 8th month, so we set the month to 7 (0-indexed)
    return startOfMonth(setMonth(date, 7));
  }

  static findActiveMembership(user: User): Membership | null {
    const now = this.getCurrentUTC();
    return (
      user.memberships.findLast((membership) => isAfter(membership.end, now)) ??
      null
    );
  }

  static getMembershipGrade(membership: Membership): 1 | 2 | 3 | 4 | 5 | null {
    // Take the difference, and add one because if `startYear == currentYear` they are in their first year
    const delta =
      differenceInYears(
        this.getAcademicStart(this.getCurrentUTC()),
        this.getAcademicStart(membership.start)
      ) + 1;

    switch (membership.type) {
      case "KNIGHT":
      case "PHD_STUDENT":
        return 5;
      case "SOCIAL_MEMBER":
        return 1;
      case "BACHELOR_STUDENT": {
        // Bachelor students are clamped at 1-3, regardless of how many years they used to take the degree.
        return Math.max(1, Math.min(3, delta)) as 1 | 2 | 3;
      }
      case "MASTER_STUDENT": {
        // Master students must be clamped at 4-5 because they can only be in their first or second year, but are always
        // considered to have a bachelor's degree from beforehand.
        return Math.max(4, Math.min(5, delta)) as 4 | 5;
      }
      case "OTHER":
        return null;
    }
  }

  static getUserPool(
    user: User,
    pools: AttendancePool[]
  ): AttendancePool | undefined {
    const activeMembership = this.findActiveMembership(user);

    if (!activeMembership) return undefined;

    const userYear = this.getMembershipGrade(activeMembership);

    if (!userYear) return undefined;

    return pools.find((pool) => pool.yearCriteria.includes(userYear));
  }

  static getUserPoolIndex: (
    user: User,
    pools: AttendancePool[]
  ) => number | undefined = (user, pools) => {
    const activeMembership = this.findActiveMembership(user);

    if (!activeMembership) return undefined;

    const userYear = this.getMembershipGrade(activeMembership);

    if (!userYear) return undefined;

    return pools.findIndex((pool) => pool.yearCriteria.includes(userYear));
  };
}
