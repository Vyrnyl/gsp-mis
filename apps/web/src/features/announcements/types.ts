export interface AnnouncementAuthor {
  id: string;
  fullName: string;
}

/** Mirrors the `AnnouncementPost` Prisma model. `postedBy` is nullable (`onDelete: SetNull`). */
export interface AnnouncementPost {
  id: string;
  title: string;
  content: string;
  postedBy: AnnouncementAuthor | null;
  postedAt: string; // ISO datetime
  expiresAt: string | null; // ISO datetime
}

export interface AnnouncementFormValues {
  title: string;
  content: string;
  /** `''` when no expiry is set — native `<input type="date">` value. */
  expiresAt: string;
}
