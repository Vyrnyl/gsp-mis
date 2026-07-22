import type { ReactNode } from 'react';

import { cn } from '@/shared/utils/cn';

export interface PageHeaderProps {
  title: string;
  description?: string;
  /** Right-aligned actions. Wrap below the title on narrow viewports. */
  actions?: ReactNode;
  className?: string;
}

/**
 * Page title block — registry §2. Replaces `.page-header` / `.page-header-row`.
 *
 * The `h1` lives in the topbar, so the page title is an `h2` and screens keep a
 * single, ordered heading outline (ui-rules.md §9).
 */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-6 flex flex-wrap items-start justify-between gap-3', className)}>
      <div>
        <h2 className="text-2xl font-bold text-ink">{title}</h2>
        {description ? <p className="mt-1 text-[0.9rem] text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
