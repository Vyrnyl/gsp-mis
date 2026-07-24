'use client';

import { useCallback, useEffect, useState } from 'react';

import { NotificationIcon } from '@/shared/components/icons';
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  Pagination,
  TableSkeleton,
} from '@/shared/components/ui';
import { cn } from '@/shared/utils/cn';

import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notifications.service';
import type { NotificationItem } from '../types';
import { NotificationRow } from './notification-row';

const PAGE_SIZE = 10;

type ViewState = 'loading' | 'error' | 'ready';

/**
 * `/notifications` — Feature 2.5, reached only via the topbar bell's "View All
 * Notifications" link (no sidebar nav entry, same convention as a typical
 * notification-history page).
 */
export function NotificationsView() {
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);

  const fetchNotifications = useCallback(async () => {
    setViewState('loading');
    try {
      const result = await listNotifications({ page, pageSize: PAGE_SIZE });
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
      setTotalItems(result.totalItems);
      setViewState('ready');
    } catch {
      setViewState('error');
    }
  }, [page]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    fetchNotifications();
  }

  async function handleRowClick(id: string) {
    await markNotificationRead(id);
    fetchNotifications();
  }

  return (
    <Card>
      <CardHeader
        title="Notifications"
        subtitle={viewState === 'ready' ? `${unreadCount} unread of ${totalItems}` : undefined}
        actions={
          unreadCount > 0 && viewState === 'ready' ? (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              Mark all read
            </Button>
          ) : undefined
        }
      />

      {viewState === 'loading' ? <TableSkeleton rows={6} columns={1} /> : null}

      {viewState === 'error' ? (
        <ErrorState
          onRetry={fetchNotifications}
          description="We could not load your notifications. Check your connection and try again."
        />
      ) : null}

      {viewState === 'ready' && notifications.length === 0 ? (
        <EmptyState
          icon={NotificationIcon}
          title="You're all caught up"
          description="Notifications about your registrations, badges, and council announcements will appear here."
        />
      ) : null}

      {viewState === 'ready' && notifications.length > 0 ? (
        <>
          <div>
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleRowClick(notification.id)}
                disabled={notification.isRead}
                className={cn(
                  'w-full rounded-lg px-2 text-left transition',
                  notification.isRead && 'cursor-default hover:bg-hairline-subtle',
                )}
              >
                <NotificationRow notification={notification} />
              </button>
            ))}
          </div>

          <Pagination
            className="mt-4"
            page={page}
            pageSize={PAGE_SIZE}
            totalItems={totalItems}
            onPageChange={setPage}
            itemLabel="notifications"
          />
        </>
      ) : null}
    </Card>
  );
}
