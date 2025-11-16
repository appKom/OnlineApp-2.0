import { EventAttendanceBundle, Attendee } from "types/event";
import { PoolAttendees } from "types/event"; // Move this interface to types

export const isRegistrationEvent = (
  event: EventAttendanceBundle | null
): boolean => {
  return !!(event?.attendance && event.attendance.pools?.length > 0);
};

export const formatNorwegianDate = (dateString: string): string => {
  const date = new Date(dateString);
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
  const registerStart = new Date(attendance.registerStart as string);
  const registerEnd = new Date(attendance.registerEnd as string);

  if (now >= registerStart && now <= registerEnd) {
    return "Åpen";
  }
  return "Stengt";
};

export const formatRegistrationPeriod = (
  attendance: EventAttendanceBundle["attendance"],
  formatDate: (date: string) => string
): string | null => {
  if (!attendance || !attendance.registerStart || !attendance.registerEnd) return null;
  const start = formatDate(attendance.registerStart as string);
  const end = formatDate(attendance.registerEnd as string);
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
