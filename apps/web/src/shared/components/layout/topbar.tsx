'use client';

import { NotificationBell } from '@/features/notifications/components/notification-bell';
import { MenuIcon } from '@/shared/components/icons';

export interface TopbarProps {
  title: string;
  onOpenSidebar: () => void;
  isSidebarOpen: boolean;
}

/**
 * Sticky topbar — registry §2.
 *
 * The menu toggle is visible below `md` and hidden above it. In the prototype the
 * same button carries an inline `display:none` that nothing overrides, so the
 * off-canvas sidebar can never be reopened (ui-rules.md §5 defect 1).
 */
export function Topbar({ title, onOpenSidebar, isSidebarOpen }: TopbarProps) {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-[#e5e5e5] bg-surface px-4 py-3 shadow-topbar md:px-7 md:py-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Open navigation menu"
          aria-expanded={isSidebarOpen}
          aria-controls="primary-navigation"
          className="rounded-control p-2 text-ink transition hover:bg-hairline-subtle md:hidden"
        >
          <MenuIcon className="text-xl" aria-hidden />
        </button>
        <h1 className="truncate text-[1.15rem] font-bold text-ink">{title}</h1>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <NotificationBell />
      </div>
    </header>
  );
}
