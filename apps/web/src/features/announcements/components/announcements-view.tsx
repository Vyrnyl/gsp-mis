'use client';

import { useCallback, useEffect, useState } from 'react';

import type { AuthUser } from '@/features/auth/types';
import { AddIcon, AnnouncementIcon } from '@/shared/components/icons';
import {
  Button,
  Card,
  CardHeader,
  CardSkeleton,
  EmptyState,
  ErrorState,
  Pagination,
  useToast,
} from '@/shared/components/ui';

import { createAnnouncement, listAnnouncements } from '../services/announcements.service';
import type { AnnouncementFormValues, AnnouncementPost } from '../types';
import { AnnouncementCard } from './announcement-card';
import { AnnouncementFormModal } from './announcement-form-modal';

const PAGE_SIZE = 6;

type ViewState = 'loading' | 'error' | 'ready';

export interface AnnouncementsViewProps {
  user: AuthUser;
}

/**
 * `/announcements` — Feature 2.5. `canPost` matches the seeded `announcements:write`
 * grant (Admin + Executive Council only) — project-overview.md frames Troop Leader's
 * role as receive-only ("Receive announcements", "View council notices"), so no RBAC
 * correction was needed here (same outcome as 2.2's pre-build check).
 */
export function AnnouncementsView({ user }: AnnouncementsViewProps) {
  const canPost = user.role === 'admin' || user.role === 'executive_council';
  const { showToast } = useToast();

  const [viewState, setViewState] = useState<ViewState>('loading');
  const [announcements, setAnnouncements] = useState<AnnouncementPost[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    setViewState('loading');
    try {
      const result = await listAnnouncements({ page, pageSize: PAGE_SIZE });
      setAnnouncements(result.announcements);
      setTotalItems(result.totalItems);
      setViewState('ready');
    } catch {
      setViewState('error');
    }
  }, [page]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  async function handleCreate(values: AnnouncementFormValues) {
    await createAnnouncement(values);
    setIsFormOpen(false);
    showToast('Announcement posted.', 'success');
    if (page !== 1) setPage(1);
    else fetchAnnouncements();
  }

  return (
    <div>
      <Card>
        <CardHeader
          subtitle={viewState === 'ready' ? `${totalItems.toLocaleString()} posted` : undefined}
          actions={
            canPost ? (
              <Button leadingIcon={<AddIcon aria-hidden />} onClick={() => setIsFormOpen(true)}>
                New Announcement
              </Button>
            ) : undefined
          }
        />

        {viewState === 'loading' ? (
          <div className="space-y-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : null}

        {viewState === 'error' ? (
          <ErrorState
            onRetry={fetchAnnouncements}
            description="We could not load announcements. Check your connection and try again."
          />
        ) : null}

        {viewState === 'ready' && announcements.length === 0 ? (
          <EmptyState
            icon={AnnouncementIcon}
            title="No announcements yet"
            description={
              canPost
                ? 'Post the first announcement to keep every troop in the loop.'
                : 'Check back soon — council notices will appear here.'
            }
            action={
              canPost ? (
                <Button leadingIcon={<AddIcon aria-hidden />} onClick={() => setIsFormOpen(true)}>
                  New Announcement
                </Button>
              ) : undefined
            }
          />
        ) : null}

        {viewState === 'ready' && announcements.length > 0 ? (
          <>
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <AnnouncementCard key={announcement.id} announcement={announcement} />
              ))}
            </div>

            <Pagination
              className="mt-4"
              page={page}
              pageSize={PAGE_SIZE}
              totalItems={totalItems}
              onPageChange={setPage}
              itemLabel="announcements"
            />
          </>
        ) : null}
      </Card>

      {canPost ? (
        <AnnouncementFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleCreate}
        />
      ) : null}
    </div>
  );
}
