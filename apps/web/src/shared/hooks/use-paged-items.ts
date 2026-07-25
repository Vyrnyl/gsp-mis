'use client';

import { useMemo, useState } from 'react';

export interface PagedItems<T> {
  page: number;
  setPage: (page: number) => void;
  pageItems: T[];
  totalItems: number;
  pageSize: number;
}

/**
 * Client-side pagination for tables whose full list is already held in memory
 * (and often reused elsewhere as a picker's option list — councils, badge
 * categories, fee types, etc.). Slices `items` for display without touching how
 * they're fetched, so pickers that need the unsliced array are unaffected.
 *
 * Clamps to the last page automatically when `items` shrinks (e.g. after a
 * delete) instead of showing a blank page.
 */
export function usePagedItems<T>(items: T[], pageSize: number): PagedItems<T> {
  const [page, setPage] = useState(1);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);

  const pageItems = useMemo(
    () => items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [items, currentPage, pageSize],
  );

  return { page: currentPage, setPage, pageItems, totalItems, pageSize };
}
