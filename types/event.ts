import { Membership, User } from "./user";

export interface EventAttendanceBundle {
  event: Event;
  attendance?: Attendance;
}

export interface Event {
  status?: string;
  type?: string;
  id: string;
  title: string;
  start?: string;
  end?: string;
  description?: string;
  subtitle?: string;
  imageUrl?: string;
  locationAddress?: string;
  locationLink?: string;
  attendanceId?: string;
  createdAt?: string;
  updatedAt?: string;
  parentId?: string;
  metadataImportId?: number;
  companies?: any[]; // No idea about the format here
  hostingGroups: HostingGroup[];
}

interface HostingGroup {
  type?: string;
  slug?: string;
  abbreviation?: string;
  name?: string;
  description?: string;
  about?: string;
  imageUrl?: string;
  email?: string;
  contactUrl?: string;
  createdAt?: string;
  deactivatedAt?: string;
  roles?: Role[];
}

interface Role {
  type?: string;
  id?: string;
  groupId?: string;
  name: string;
}

export interface Attendance {
  id?: string;
  registerStart?: string;
  registerEnd?: string;
  deregisterDeadline?: string;
  selections?: []; // No idea what the model here looks like
  createdAt?: string;
  updatedAt?: string;
  attendancePrice?: number;
  pools: AttendancePool[];
  attendees: Attendee[];
  // TODO: Much more info can be found in here
}

export interface AttendancePool {
  id: string;
  title: string;
  attendanceId: string;
  createdAt: Date;
  updatedAt: Date;
  mergeDelayHours: number | null;
  yearCriteria: number[];
  capacity: number;
}

export interface Attendee {
  id: string;
  attendanceId: string;
  userId: string;
  userGrade: number | null;
  attendancePoolId: string;
  selections: any[]; // No idea what the model here looks like
  reserved: boolean;
  earliestReservationAt: string | null;
  attendedAt: string | null;
  createdAt: string;
  updatedAt: string;
  paymentDeadline: string | null;
  paymentLink: string | null;
  paymentId: string | null;
  paymentReservedAt: string | null;
  paymentChargeDeadline: string | null;
  paymentChargedAt: string | null;
  paymentRefundedAt: string | null;
  paymentRefundedById: string | null;
  user: User;
}

export interface PoolAttendees {
  in: Attendee[];
  waitlist: Attendee[];
}

type RegistrationRejectionCause =
  | "SUSPENDED"
  | "TOO_EARLY"
  | "TOO_LATE"
  | "ALREADY_REGISTERED"
  | "MISSING_PARENT_REGISTRATION"
  | "MISSING_PARENT_RESERVATION"
  | "MISSING_MEMBERSHIP"
  | "NO_MATCHING_POOL";

type RegistrationBypassCause =
  | "IGNORE_PARENT"
  | "IGNORE_REGISTRATION_START"
  | "IGNORE_REGISTRATION_END"
  | "OVERRIDDEN_POOL";

export type RegistrationAvailabilityFailure = {
  cause: RegistrationRejectionCause;
  success: false;
};

export type RegistrationAvailabilitySuccess = {
  reservationActiveAt: string; // type TZDate
  event: Event;
  attendance: Attendance;
  user: User;
  membership: Membership;
  /** The AttendancePool the user will be placed into based on the EventRegistrationOptions passed */
  pool: AttendancePool;
  bypassedChecks: RegistrationBypassCause[];
  options: any; // EventRegistrationOptions (but we don't really care about the specifics and I imagine this will change)
  success: true;
};

export type RegistrationAvailabilityResult =
  | RegistrationAvailabilitySuccess
  | RegistrationAvailabilityFailure;
