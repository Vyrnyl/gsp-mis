import { cn } from '@/shared/utils/cn';

export interface ProgressBarProps {
  /** 0–100. Values outside that range are clamped. */
  value: number;
  /** Accessible label — what this bar measures (e.g. "Senior Girl Scouts — 62%"). */
  label: string;
  className?: string;
}

/** Progress bar — registry §3. Replaces `.progress-bar` / `.progress-fill`. */
export function ProgressBar({ value, label, className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-2 overflow-hidden rounded bg-track', className)}
    >
      <div
        className="h-full rounded bg-brand-gradient-progress transition-[width] duration-300"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
