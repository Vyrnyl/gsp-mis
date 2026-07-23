'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef } from 'react';

import { CloseIcon, LogoutIcon } from '@/shared/components/icons';
import { getNavSectionsForRole } from '@/shared/components/layout/nav-items';
import { ROLE_LABELS } from '@/shared/constants/roles';
import { useFocusTrap } from '@/shared/hooks/use-focus-trap';
import { useIsMobileViewport } from '@/shared/hooks/use-media-query';
import { TableAvatar } from '@/shared/components/ui/table';
import { cn } from '@/shared/utils/cn';

import type { AuthUser } from '@/features/auth/types';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser;
  onSignOut: () => void;
  /** True while a real sign-out request is in flight (Loop step 5). */
  isSigningOut?: boolean;
}

/**
 * Sidebar navigation — registry §2.
 *
 * Fixed 220px from `md` up; off-canvas below, revealed by the topbar toggle.
 * Fixes three prototype defects (ui-rules.md §5): the toggle is actually reachable,
 * an interactive backdrop closes the panel, and focus is trapped while it is open.
 * Scroll lock lives in `AppShell`, which owns the open state.
 */
export function Sidebar({ isOpen, onClose, user, onSignOut, isSigningOut }: SidebarProps) {
  const pathname = usePathname();
  const panelRef = useRef<HTMLElement>(null);
  const navSections = getNavSectionsForRole(user.role);

  // Only trap focus while the panel is a modal overlay (mobile). On desktop it is
  // part of the page and must not capture Tab.
  const isMobile = useIsMobileViewport();
  useFocusTrap(panelRef, isOpen && isMobile);

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={onClose}
          className="fixed inset-0 z-[90] animate-fade-in bg-black/40 md:hidden"
        />
      ) : null}

      <nav
        ref={panelRef}
        id="primary-navigation"
        aria-label="Primary"
        className={cn(
          'fixed left-0 top-0 z-[100] flex h-screen w-sidebar flex-col',
          'bg-brand-gradient-sidebar text-white transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0',
        )}
      >
        <div className="flex items-center gap-2.5 border-b border-white/15 px-[18px] py-[22px]">
          <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/25 text-base font-bold"
          >
            GS
          </span>
          <div className="min-w-0">
            <p className="truncate text-[0.95rem] font-bold leading-tight">Girl Scouts PH</p>
            <p className="truncate text-[0.7rem] opacity-70">Management System</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="ml-auto rounded p-1 text-white/80 transition hover:bg-white/15 hover:text-white md:hidden"
          >
            <CloseIcon aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="px-[18px] pb-1 pt-2 text-[0.68rem] font-bold uppercase tracking-[0.1em] opacity-60">
                {section.label}
              </p>
              <ul>
                {section.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          'flex w-full items-center gap-2.5 border-l-[3px] px-[18px] py-[11px] text-[0.9rem] transition',
                          isActive
                            ? 'border-brand-gold2 bg-white/15 font-semibold text-white'
                            : 'border-transparent text-white/80 hover:bg-white/10 hover:text-white',
                        )}
                      >
                        <Icon className="w-5 shrink-0 text-base" aria-hidden />
                        <span className="truncate">{item.label}</span>
                        {item.badgeCount ? (
                          <span className="ml-auto rounded-[10px] bg-brand-gold2 px-[7px] py-px text-[0.72rem] font-bold text-ink">
                            {item.badgeCount}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/15 px-[18px] py-4">
          <div className="mb-2.5 flex items-center gap-2.5">
            <TableAvatar name={user.fullName} className="size-[38px] bg-white/25 text-base text-white" />
            <div className="min-w-0 overflow-hidden">
              <p className="truncate text-[0.88rem] font-semibold">{user.fullName}</p>
              <p className="truncate text-[0.72rem] opacity-70">{ROLE_LABELS[user.role]}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            disabled={isSigningOut}
            className="w-full rounded-control border border-white/20 bg-white/10 py-2.5 text-[0.85rem] text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="inline-flex items-center gap-2">
              <LogoutIcon aria-hidden />
              {isSigningOut ? 'Signing out…' : 'Sign out'}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
