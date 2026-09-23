export interface User {
  id: string;
  username: string;
  name: string | null;
  email: string | null;
  imageUrl: string | null;
  biography: string | null;
  phone: string | null;
  gender: "MALE" | "FEMALE" | "NON_BINARY" | "OTHER" | "UNKNOWN";
  dietaryRestrictions: string | null;
  ntnuUsername: string | null;
  flags: UserFlag[];
  createdAt: Date;
  updatedAt: Date;
  privacyPermissionsId: string | null;
  notificationPermissionsId: string | null;
  memberships: Membership[];
}

export type Membership = {
  type: "BACHELOR_STUDENT" | "MASTER_STUDENT" | "KNIGHT" | "SOCIAL_MEMBER";
  id: string;
  specialization:
    | "ARTIFICIAL_INTELLIGENCE"
    | "DATABASE_AND_SEARCH"
    | "INTERACTION_DESIGN"
    | "SOFTWARE_ENGINEERING"
    | "PROGRAMMING_AND_SECURITY_ENGINEERING"
    | "VISUAL_INFORMATICS"
    | "UNKNOWN"
    | null;
  userId: string;
  start: Date;
  end: Date | null;
  semester: number | null;
};

export type UserFlag = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  awardedAt: Date;
  awardedReason: string | null;
};
