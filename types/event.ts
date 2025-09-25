import { User } from "./user";

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
  pools: Pool[];
  attendees: Attendee[];
  // TODO: Much more info can be found in here
}

export interface Pool {
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
