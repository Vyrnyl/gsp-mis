import type { CSSProperties, ReactNode } from 'react';

import { cn } from '@/shared/utils/cn';

export interface SkeletonProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * Skeleton primitive — registry §9.
 *
 * Loading states are required on every screen by the Definition of Done; the
 * prototype has none. Skeletons are preferred over spinners for content areas
 * (ui-rules.md §10). All skeleton blocks below are `aria-hidden` and sit inside a
 * container that announces "Loading…" once.
 */
export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <span
      aria-hidden
      style={style}
      className={cn(
        'relative block overflow-hidden rounded bg-track',
        'after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer',
        'after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent',
        className,
      )}
    />
  );
}

/** Wraps a skeleton block so screen readers hear one status, not a wall of boxes. */
export function SkeletonRegion({
  label = 'Loading…',
  children,
  className,
}: {
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div role="status" aria-live="polite" aria-busy className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** Table loading state — mirrors the shape of a populated `Table`. */
export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <SkeletonRegion label="Loading table data…">
      <div className="overflow-hidden rounded-card border border-hairline-subtle">
        <div
          className="flex gap-4 border-b border-hairline-subtle bg-header-bg px-3.5 py-3"
          aria-hidden
        >
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} className="h-3 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="flex items-center gap-4 border-b border-hairline-faint px-3.5 py-4 last:border-b-0"
            aria-hidden
          >
            {Array.from({ length: columns }).map((_, columnIndex) => (
              <Skeleton
                key={columnIndex}
                className={cn('h-3.5 flex-1', columnIndex === 0 && 'max-w-[38%]')}
              />
            ))}
          </div>
        ))}
      </div>
    </SkeletonRegion>
  );
}

/** Card loading state — use inside a `Card` while its content loads. */
export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <SkeletonRegion label="Loading card…">
      <Skeleton className="h-4 w-2/5" />
      <div className="mt-4 space-y-2.5">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton key={index} className={cn('h-3', index === lines - 1 && 'w-3/5')} />
        ))}
      </div>
    </SkeletonRegion>
  );
}

/** Chart loading state — a plot area plus legend placeholder. */
export function ChartSkeleton({ height = 160 }: { height?: number }) {
  return (
    <SkeletonRegion label="Loading chart…">
      <Skeleton className="w-full rounded-card" style={{ height }} />
      <div className="mt-4 flex flex-wrap gap-4" aria-hidden>
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-center gap-2">
            <Skeleton className="size-2.5 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    </SkeletonRegion>
  );
}
