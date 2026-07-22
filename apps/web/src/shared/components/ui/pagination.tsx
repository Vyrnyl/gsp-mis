'use client';

import { ChevronLeftIcon, ChevronRightIcon } from '@/shared/components/icons';
import { cn } from '@/shared/utils/cn';

export interface PaginationProps {
  /** 1-indexed. */
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  /** Noun for the range summary — "12–24 of 1,240 members". */
  itemLabel?: string;
  className?: string;
}

/** Build a compact page list with ellipses: 1 … 4 5 6 … 20 */
export function buildPageRange(page: number, totalPages: number): Array<number | 'gap'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1]);
  const sorted = [...pages]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);

  const result: Array<number | 'gap'> = [];
  let previous = 0;
  for (const value of sorted) {
    if (previous && value - previous > 1) result.push('gap');
    result.push(value);
    previous = value;
  }
  return result;
}

/**
 * Table pagination — registry §9.
 *
 * Required by ui-rules.md §10: no table in the prototype paginates, yet its own
 * dashboard claims 1,240 members. Every growable table gets this.
 */
export function Pagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  itemLabel = 'items',
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);
  const pages = buildPageRange(page, totalPages);

  const stepClasses =
    'inline-flex size-8 items-center justify-center rounded-control border border-hairline ' +
    'bg-surface text-muted transition hover:border-brand-green hover:text-brand-green ' +
    'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-hairline disabled:hover:text-muted';

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 border-t border-hairline-subtle pt-4',
        className,
      )}
    >
      <p className="text-[0.82rem] text-muted">
        Showing <span className="font-semibold text-ink">{from.toLocaleString()}</span>–
        <span className="font-semibold text-ink">{to.toLocaleString()}</span> of{' '}
        <span className="font-semibold text-ink">{totalItems.toLocaleString()}</span> {itemLabel}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          className={stepClasses}
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeftIcon aria-hidden />
        </button>

        {pages.map((entry, index) =>
          entry === 'gap' ? (
            <span key={`gap-${index}`} className="px-1 text-muted" aria-hidden>
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              onClick={() => onPageChange(entry)}
              aria-label={`Page ${entry}`}
              aria-current={entry === page ? 'page' : undefined}
              className={cn(
                'inline-flex size-8 items-center justify-center rounded-control text-[0.85rem] font-semibold transition',
                entry === page
                  ? 'bg-brand-green text-white'
                  : 'border border-hairline bg-surface text-ink hover:border-brand-green hover:text-brand-green',
              )}
            >
              {entry}
            </button>
          ),
        )}

        <button
          type="button"
          className={stepClasses}
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRightIcon aria-hidden />
        </button>
      </div>
    </nav>
  );
}
