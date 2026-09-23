export interface UserGroup {
  slug: string;
  abbreviation: string;
  name: string | null;
  preferredDisplayName: "ABBREVIATION" | "NAME";
  shortDescription: string | null;
  description: string;
  imageUrl: string | null;
  type:
    | "COMMITTEE"
    | "NODE_COMMITTEE"
    | "ASSOCIATED"
    | "INTEREST_GROUP"
    | "EMAIL_ONLY";
}
