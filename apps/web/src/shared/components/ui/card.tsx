import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/shared/utils/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/** Card surface — registry §3. Replaces `.card`. */
export function Card({ className, children, ...props }: CardProps) {
  return (
    <div className={cn('rounded-card bg-surface p-6 shadow-card', className)} {...props}>
      {children}
    </div>
  );
}

export interface CardHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Right-aligned actions (buttons, filters). Wraps below the title when narrow. */
  actions?: ReactNode;
  /** Heading level for the title — keeps document heading order sane (ui-rules.md §9). */
  as?: 'h2' | 'h3' | 'h4';
}

/** Card header — replaces `.card-header` / `.card-title` / `.card-subtitle`. */
export function CardHeader({
  title,
  subtitle,
  actions,
  as: Heading = 'h3',
  className,
  ...props
}: CardHeaderProps) {
  return (
    <div
      className={cn('mb-[18px] flex flex-wrap items-center justify-between gap-3', className)}
      {...props}
    >
      <div>
        <Heading className="text-[1.05rem] font-bold text-ink">{title}</Heading>
        {subtitle ? <p className="mt-0.5 text-[0.82rem] text-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
