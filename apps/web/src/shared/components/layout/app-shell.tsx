'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import { resolvePageTitle } from '@/shared/components/layout/nav-items';
import { Sidebar } from '@/shared/components/layout/sidebar';
import { Topbar } from '@/shared/components/layout/topbar';
import { useBodyScrollLock } from '@/shared/hooks/use-body-scroll-lock';
import { useIsMobileViewport } from '@/shared/hooks/use-media-query';

/**
 * Two-column application shell — registry §2.
 *
 * Owns the off-canvas sidebar state so the toggle, the backdrop, the Escape key and
 * the scroll lock all agree. Landmarks are real elements (`nav` / `header` / `main`)
 * rather than the prototype's divs (ui-rules.md §9).
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isMobile = useIsMobileViewport();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useBodyScrollLock(isSidebarOpen && isMobile);

  // Close on navigation and whenever the viewport grows past the breakpoint, so the
  // panel never stays "open" as a desktop layout.
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobile) setIsSidebarOpen(false);
  }, [isMobile]);

  useEffect(() => {
    if (!isSidebarOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsSidebarOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isSidebarOpen]);

  return (
    <div className="min-h-screen">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex min-h-screen flex-col md:ml-sidebar">
        <Topbar
          title={resolvePageTitle(pathname)}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          isSidebarOpen={isSidebarOpen}
        />
        <main id="main-content" tabIndex={-1} className="flex-1 p-4 md:p-7">
          {children}
        </main>
      </div>
    </div>
  );
}
