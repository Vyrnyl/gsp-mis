export interface AnnouncementAuthorDto {
  id: string;
  fullName: string;
}

/** Mirrors the `AnnouncementPost` Prisma model. `postedBy` is nullable (`onDelete: SetNull`). */
export interface AnnouncementDto {
  id: string;
  title: string;
  content: string;
  postedBy: AnnouncementAuthorDto | null;
  postedAt: string;
  expiresAt: string | null;
}

export interface ListAnnouncementsResponseBody {
  announcements: AnnouncementDto[];
}

export interface AnnouncementResponseBody {
  announcement: AnnouncementDto;
}
