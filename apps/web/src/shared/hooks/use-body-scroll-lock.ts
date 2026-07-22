'use client';

import { useEffect } from 'react';

/**
 * Locks page scroll while an overlay is open.
 *
 * The prototype has no scroll lock — the page scrolls behind the open mobile
 * sidebar (ui-rules.md §5 defect 3). Modals and the off-canvas sidebar both use this.
 */
export function useBodyScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked) return;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [isLocked]);
}
