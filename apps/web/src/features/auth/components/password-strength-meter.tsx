'use client';

import { useMemo } from 'react';

import { cn } from '@/shared/utils/cn';

const LEVELS: Array<{ label: string; color: string }> = [
  { label: '', color: '#eeeeee' },
  { label: 'Weak', color: '#e74c3c' },
  { label: 'Fair', color: '#e67e22' },
  { label: 'Good', color: '#f1c40f' },
  { label: 'Strong', color: '#27ae60' },
];

/** Same four-check heuristic as the prototype's `checkStrength` — length, case, digit, symbol. */
export function scorePassword(value: string): number {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[A-Z]/.test(value)) score += 1;
  if (/[0-9]/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  return score;
}

export interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

/** Replaces `.strength-bar` / `.strength-fill`. Purely visual feedback, not a validation gate. */
export function PasswordStrengthMeter({ password, className }: PasswordStrengthMeterProps) {
  const score = useMemo(() => scorePassword(password), [password]);
  const level = LEVELS[score] ?? LEVELS[4]!;

  return (
    <div className={cn('mt-1.5', className)}>
      <div className="h-1 rounded-full bg-track">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score * 25}%`, backgroundColor: level.color }}
        />
      </div>
      <p
        className="mt-1 min-h-[1.2em] text-[0.8rem]"
        style={{ color: level.color }}
        aria-live="polite"
      >
        {password ? level.label : ''}
      </p>
    </div>
  );
}
