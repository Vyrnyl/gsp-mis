'use client';

import { useEffect, useState } from 'react';

/**
 * Subscribe to a CSS media query.
 *
 * Returns `false` during SSR and the first client render, then settles to the real
 * match — so layout decisions that depend on it must be safe to start "off".
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    setMatches(mediaQueryList.matches);

    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    mediaQueryList.addEventListener('change', onChange);
    return () => mediaQueryList.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** True below the 768px breakpoint, where the sidebar becomes an off-canvas overlay. */
export function useIsMobileViewport(): boolean {
  return useMediaQuery('(max-width: 767px)');
}
