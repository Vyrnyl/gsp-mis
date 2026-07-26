import { notifyUsers } from '../../shared/utils/notify';
import { buildPaginationMeta, type PaginationMeta } from '../../shared/utils/api-response';
import { announcementsRepository, type AnnouncementWithRelations } from './announcements.repository';
import type { CreateAnnouncementInput, ListAnnouncementsQuery } from './announcements.schema';
import type { AnnouncementDto } from './announcements.types';

function toDto(row: AnnouncementWithRelations): AnnouncementDto {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    postedBy: row.postedBy ? { id: row.postedBy.id, fullName: row.postedBy.fullName } : null,
    postedAt: row.postedAt.toISOString(),
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
  };
}

export const announcementsService = {
  async list(query: ListAnnouncementsQuery): Promise<{ announcements: AnnouncementDto[]; meta: PaginationMeta }> {
    const { rows, total } = await announcementsRepository.list(query);
    return {
      announcements: rows.map(toDto),
      meta: buildPaginationMeta(query.page, query.pageSize, total),
    };
  },

  /** Notifies every other user — the fan-out named in build-plan.md §2.5's Mock → wire line. */
  async create(input: CreateAnnouncementInput, postedById: string): Promise<AnnouncementDto> {
    const created = await announcementsRepository.create(input, postedById);

    const users = await announcementsRepository.listAllUserIds();
    const recipientIds = users.map((user) => user.id).filter((id) => id !== postedById);
    // The notification carries the announcement's own title/content directly —
    // /notifications has no click-through to the source post, so this is the only
    // place a recipient can read what it actually says.
    await notifyUsers(recipientIds, created.title, created.content);

    return toDto(created);
  },
};
