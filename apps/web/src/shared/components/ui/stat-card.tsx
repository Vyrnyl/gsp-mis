import type { IconType } from '@/shared/components/icons';
import { cn } from '@/shared/utils/cn';

export type StatCardTone = 'green' | 'gold' | 'blue' | 'red';

const TONE_CLASSES: Record<StatCardTone, { border: string; iconBg: string; iconFg: string }> = {
  green: { border: 'border-l-brand-green', iconBg: 'bg-status-success-bg', iconFg: 'text-brand-green' },
  // Icon glyphs are decorative fills (WCAG 1.4.11 non-text contrast), but goldInk is
  // used anyway so the color stays safe if it is ever reused as text (ui-rules.md §9).
  gold: { border: 'border-l-brand-gold', iconBg: 'bg-status-warning-bg', iconFg: 'text-brand-gold-ink' },
  blue: { border: 'border-l-brand-blue', iconBg: 'bg-status-info-bg', iconFg: 'text-brand-blue' },
  red: { border: 'border-l-brand-red', iconBg: 'bg-status-danger-bg', iconFg: 'text-brand-red' },
};

export interface StatCardProps {
  icon: IconType;
  value: string | number;
  label: string;
  tone?: StatCardTone;
  className?: string;
}

/** Stat card — registry §3. Replaces `.stat-card` + `.stat-icon` + `.stat-info`. */
export function StatCard({ icon: Icon, value, label, tone = 'green', className }: StatCardProps) {
  const toneClasses = TONE_CLASSES[tone];

  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-card border-l-[5px] bg-surface p-[22px] shadow-card',
        'transition hover:-translate-y-0.5',
        toneClasses.border,
        className,
      )}
    >
      <span
        className={cn(
          'flex size-[50px] shrink-0 items-center justify-center rounded-xl text-2xl',
          toneClasses.iconBg,
          toneClasses.iconFg,
        )}
      >
        <Icon aria-hidden />
      </span>
      <div>
        <h3 className="text-[1.8rem] font-bold leading-none text-ink">{value}</h3>
        <p className="mt-[3px] text-[0.8rem] text-muted">{label}</p>
      </div>
    </div>
  );
}
