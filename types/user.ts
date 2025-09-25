export interface User {
  id: string;
  profileSlug: string;
  name: string | null;
  email: string | null;
  imageUrl: string | null;
  biography: string | null;
  phone: string | null;
  gender: string | null;
  dietaryRestrictions: string | null;
  ntnuUsername: string | null;
  flags: string[];
  createdAt: Date;
  updatedAt: Date;
  privacyPermissionsId: string | null;
  notificationPermissionsId: string | null;
  memberships: Membership[];
}

export type Membership = {
  type:
    | "BACHELOR_STUDENT"
    | "MASTER_STUDENT"
    | "PHD_STUDENT"
    | "KNIGHT"
    | "SOCIAL_MEMBER"
    | "OTHER";
  id: string;
  specialization:
    | "ARTIFICIAL_INTELLIGENCE"
    | "DATABASE_AND_SEARCH"
    | "INTERACTION_DESIGN"
    | "SOFTWARE_ENGINEERING"
    | "UNKNOWN"
    | null;
  userId: string;
  start: Date;
  end: Date;
};
