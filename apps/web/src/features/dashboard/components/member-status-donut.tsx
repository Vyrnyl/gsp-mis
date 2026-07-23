'use client';

import { ArcElement, Chart as ChartJS, Tooltip, type ChartOptions } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

import { palette } from '@/shared/design/tokens';

import { STATUS_CHART_COLORS } from '../constants';
import type { StatusSlice } from '../types';

ChartJS.register(ArcElement, Tooltip);

const CHART_OPTIONS: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
  plugins: {
    tooltip: { backgroundColor: palette.ink, padding: 8, cornerRadius: 6 },
  },
};

export interface MemberStatusDonutProps {
  data: StatusSlice[];
}

/**
 * Donut chart — registry §4. Ports the prototype's CSS `conic-gradient` `.donut` to
 * `react-chartjs-2` (settled decision #2), keeping the same legend-beside-chart
 * layout. Segments are member status rather than the prototype's scout-level split,
 * so every slice stays wireable from data 1.3/1.4 already produce.
 */
export function MemberStatusDonut({ data }: MemberStatusDonutProps) {
  const total = data.reduce((sum, slice) => sum + slice.count, 0);

  return (
    <div className="flex flex-wrap items-center gap-5">
      <div style={{ width: 120, height: 120 }} className="relative shrink-0">
        <Doughnut
          role="img"
          aria-label={`Members by status: ${data.map((s) => `${s.label} ${s.count}`).join(', ')}`}
          data={{
            labels: data.map((slice) => slice.label),
            datasets: [
              {
                data: data.map((slice) => slice.count),
                backgroundColor: data.map((slice) => STATUS_CHART_COLORS[slice.status]),
                borderWidth: 2,
                borderColor: palette.surface,
              },
            ],
          }}
          options={CHART_OPTIONS}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[0.8rem] font-bold text-ink">
          {total.toLocaleString()}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {data.map((slice) => (
          <div key={slice.status} className="flex items-center gap-2 text-[0.82rem] text-ink-soft">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: STATUS_CHART_COLORS[slice.status] }}
            />
            {slice.label} — {total > 0 ? Math.round((slice.count / total) * 100) : 0}%
          </div>
        ))}
      </div>
    </div>
  );
}
