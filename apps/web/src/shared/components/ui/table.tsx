import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';

import { cn } from '@/shared/utils/cn';

/**
 * Table primitives — registry §3. Replaces `.table-wrapper` / `table` / `th` / `td`.
 *
 * `TableWrapper` keeps the prototype's `overflow-x: auto` — tables scroll rather
 * than reflow, and the wrapper must never be removed (ui-rules.md §5). Improvements
 * over the prototype: a required accessible name via `caption`, real
 * `<th scope="col">`, and a keyboard-reachable scroll container.
 */
export function TableWrapper({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('-m-1 overflow-x-auto p-1', className)}
      tabIndex={0}
      role="region"
      {...props}
    >
      {children}
    </div>
  );
}

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  /** Accessible name for the table. Rendered visually hidden by default. */
  caption: string;
  showCaption?: boolean;
  children: ReactNode;
}

export function Table({ caption, showCaption = false, className, children, ...props }: TableProps) {
  return (
    <table className={cn('w-full border-collapse text-[0.88rem]', className)} {...props}>
      <caption className={cn(showCaption ? 'pb-3 text-left text-[0.82rem] text-muted' : 'sr-only')}>
        {caption}
      </caption>
      {children}
    </table>
  );
}

export function TableHead({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={className} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={className} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ className, children, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn('transition [&>td]:hover:bg-row-hover', className)} {...props}>
      {children}
    </tr>
  );
}

export function TableHeaderCell({
  className,
  children,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn(
        'border-b-2 border-hairline-subtle bg-header-bg px-3.5 py-[11px] text-left',
        'text-[0.8rem] font-semibold uppercase tracking-[0.03em] text-ink-subtle',
        className,
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({
  className,
  children,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn('border-b border-hairline-faint px-3.5 py-3 align-middle', className)}
      {...props}
    >
      {children}
    </td>
  );
}

/** Circular initials avatar used in table rows — replaces `.table-avatar`. */
export function TableAvatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <span
      aria-hidden
      className={cn(
        'flex size-[34px] shrink-0 items-center justify-center rounded-full',
        'bg-brand-green3 text-[0.82rem] font-bold text-brand-green',
        className,
      )}
    >
      {initials}
    </span>
  );
}
