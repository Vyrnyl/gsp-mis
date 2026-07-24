'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import { NotificationIcon } from '@/shared/components/icons';
import { CardSkeleton, ErrorState } from '@/shared/components/ui';

import { markAllNotificationsRead, markNotificationRead, listNotifications } from '../services/notifications.service';
import type { NotificationItem } from '../types';
import { NotificationRow } from './notification-row';

type ViewState = 'loading' | 'error' | 'ready';

/**
 * Topbar notification bell + dropdown panel — Feature 2.5, registry §7. Fetches the
 * 5 most recent notifications (and the unread count) once on mount so the unread
 * dot is accurate before the panel is ever opened; refetches after every mark-read
 * action (settled decision #3 — refetch, not optimistic update).
 *
 * Fixed 320px, right-anchored (ui-registry.md's Responsive Behavior table) — capped
 * at `calc(100vw-2rem)` so it never overflows a 360px viewport.
 */
export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    setViewState('loading');
    try {
      const result = await listNotifications({ pageSize: 5 });
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
      setViewState('ready');
    } catch {
      setViewState('error');
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!isOpen) return;

    function onPointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    fetchNotifications();
  }

  async function handleRowClick(id: string) {
    await markNotificationRead(id);
    fetchNotifications();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="relative rounded-control p-2 text-muted transition hover:bg-hairline-subtle hover:text-ink"
      >
        <NotificationIcon className="text-xl" aria-hidden />
        {unreadCount > 0 ? (
          <span
            aria-hidden
            className="absolute right-1.5 top-1.5 size-2 rounded-full bg-brand-red ring-2 ring-surface"
          />
        ) : null}
      </button>

      {isOpen ? (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full z-[300] mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-modal bg-surface shadow-overlay"
        >
          <div className="flex items-center justify-between gap-3 border-b border-hairline-subtle px-4 py-3">
            <h2 className="text-[0.95rem] font-bold text-ink">Notifications</h2>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[0.8rem] font-semibold text-brand-green hover:underline"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="max-h-[360px] overflow-y-auto px-4">
            {viewState === 'loading' ? (
              <div className="py-3">
                <CardSkeleton lines={2} />
              </div>
            ) : null}

            {viewState === 'error' ? (
              <ErrorState
                className="py-6"
                title="Could not load notifications"
                description="Check your connection and try again."
                onRetry={fetchNotifications}
              />
            ) : null}

            {viewState === 'ready' && notifications.length === 0 ? (
              <p className="py-8 text-center text-[0.85rem] text-muted">You&rsquo;re all caught up.</p>
            ) : null}

            {viewState === 'ready' && notifications.length > 0
              ? notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleRowClick(notification.id)}
                    disabled={notification.isRead}
                    className="block w-full text-left"
                  >
                    <NotificationRow notification={notification} className="-mx-1 rounded-lg px-1" />
                  </button>
                ))
              : null}
          </div>

          <Link
            href="/notifications"
            onClick={() => setIsOpen(false)}
            className="block border-t border-hairline-subtle px-4 py-3 text-center text-[0.85rem] font-semibold text-brand-green transition hover:bg-hairline-subtle"
          >
            View All Notifications
          </Link>
        </div>
      ) : null}
    </div>
  );
}
