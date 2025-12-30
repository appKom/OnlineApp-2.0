import { EventAttendanceBundle, Attendee } from "types/event";
import { PoolAttendees } from "types/event"; // Move this interface to types

export const isRegistrationEvent = (
  event: EventAttendanceBundle | null
): boolean => {
  return !!(event?.attendance && event.attendance.pools?.length > 0);
};

export const formatNorwegianDate = (date: Date): string => {
  const formatter = new Intl.DateTimeFormat("nb-NO", {
    timeZone: "Europe/Oslo",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return formatter.format(date);
};

export const getRegistrationStatus = (
  attendance: EventAttendanceBundle["attendance"]
): string => {
  // If attendance or its boundaries are missing, treat as closed
  if (!attendance || !attendance.registerStart || !attendance.registerEnd) return "Stengt";

  const now = new Date();
  const registerStart = attendance.registerStart;
  const registerEnd = attendance.registerEnd;

  if (now >= registerStart && now <= registerEnd) {
    return "Åpen";
  }
  return "Stengt";
};

export const formatRegistrationPeriod = (
  attendance: EventAttendanceBundle["attendance"],
): string | null => {
  if (!attendance || !attendance.registerStart || !attendance.registerEnd) return null;
  const start = attendance.registerStart;
  const end = attendance.registerEnd;
  return `${start} - ${end}`;
};

export const sortAttendeesByPool = (
  event: EventAttendanceBundle | null,
  userPoolIndex: number | null
): PoolAttendees[] => {
  if (!event?.attendance || !isRegistrationEvent(event)) {
    return [];
  }

  const poolAttendees: PoolAttendees[] = Array.from(
    { length: event.attendance.pools.length },
    () => ({ in: [], waitlist: [] })
  );

  event.attendance.attendees.forEach((attendee) => {
    if (userPoolIndex === null || userPoolIndex === undefined) return;

    const isWaitlist = !attendee.reserved;

    if (userPoolIndex !== -1) {
      if (isWaitlist) {
        poolAttendees[userPoolIndex].waitlist.push(attendee);
      } else {
        poolAttendees[userPoolIndex].in.push(attendee);
      }
    }
  });

  return poolAttendees;
};
