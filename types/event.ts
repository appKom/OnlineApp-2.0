import { Membership, User } from "./user";

export interface EventAttendanceBundle {
  event: Event;
  attendance?: Attendance;
  parentEvent?: Event | null;
  parentAttendance?: Attendance | null;
}

export interface Event {
  status?: string;
  type?: string;
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  subtitle?: string;
  imageUrl?: string;
  locationTitle?: string;
  locationAddress?: string;
  locationLink?: string;
  attendanceId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
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
  createdAt?: Date;
  deactivatedAt?: Date | null;
  roles?: Role[];
}

interface Role {
  type?: string;
  id?: string;
  groupId?: string;
  name: string;
}

export interface Attendance {
  id: string;
  registerStart: Date;
  registerEnd: Date;
  deregisterDeadline: Date;
  selections: AttendanceSelection[];
  createdAt: Date;
  updatedAt: Date;
  attendancePrice?: number;
  pools: AttendancePool[];
  attendees: Attendee[];
}

export interface AttendanceSelection {
  id: string;
  name: string;
  options: AttendanceSelectionOption[];
}

export interface AttendanceSelectionOption {
  id: string;
  name: string;
}

export interface AttendanceSelectionResponse {
  selectionId: string;
  selectionName: string;
  optionId: string;
  optionName: string;
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
  selections: AttendanceSelectionResponse[];
  reserved: boolean;
  earliestReservationAt: Date;
  attendedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  paymentDeadline: Date | null;
  paymentLink: string | null;
  paymentId: string | null;
  paymentReservedAt: Date | null;
  paymentChargeDeadline: Date | null;
  paymentChargedAt: Date | null;
  paymentRefundedAt: Date | null;
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


export interface EventFilterParams {
  byStartDate?: {
    min?: string | null;
    max?: string | null;
  };
  byEndDate?: {
    min?: string | null;
    max?: string | null;
  };
}
