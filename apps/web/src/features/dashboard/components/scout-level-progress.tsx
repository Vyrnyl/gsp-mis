import { ProgressBar } from '@/shared/components/ui';

import type { ScoutLevelShare } from '../types';

export interface ScoutLevelProgressProps {
  breakdown: ScoutLevelShare[];
}

/** KPI/progress widget — registry §3. Membership composition by scout level. */
export function ScoutLevelProgress({ breakdown }: ScoutLevelProgressProps) {
  return (
    <div className="space-y-4">
      {breakdown.map((level) => (
        <div key={level.id}>
          <div className="mb-1 flex justify-between text-sm font-semibold text-ink-soft">
            <span>{level.levelName}</span>
            <span>{level.percent}%</span>
          </div>
          <ProgressBar value={level.percent} label={`${level.levelName} — ${level.percent}%`} />
        </div>
      ))}
    </div>
  );
}
