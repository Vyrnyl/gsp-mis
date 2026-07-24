'use client';

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip,
  type ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

import { palette } from '@/shared/design/tokens';

import type { BadgeCompletionSlice } from '../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const CHART_OPTIONS: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  plugins: {
    // Explicitly disabled — see `MembershipTrendChart` for why (shared ChartJS
    // `Legend` registry, not per-chart).
    legend: { display: false },
    tooltip: {
      backgroundColor: palette.ink,
      padding: 8,
      cornerRadius: 6,
      callbacks: { label: (ctx) => `${ctx.formattedValue}% of members` },
    },
  },
  scales: {
    x: {
      beginAtZero: true,
      max: 100,
      ticks: { color: palette.muted, font: { size: 11 }, callback: (value) => `${value}%` },
      grid: { color: palette.borderFaint },
    },
    y: { grid: { display: false }, ticks: { color: palette.muted, font: { size: 11 } } },
  },
};

export interface BadgeCompletionChartProps {
  data: BadgeCompletionSlice[];
}

/** Badge Completion bar chart — registry §4. Horizontal bar, % of all members who
 * have earned/verified each catalog badge (`earned`/`verified` count over total
 * member count, computed server-side). */
export function BadgeCompletionChart({ data }: BadgeCompletionChartProps) {
  const summary = data.map((point) => `${point.badgeName} ${point.completionRate}%`).join(', ');

  return (
    <div style={{ height: Math.max(180, data.length * 42) }} role="img" aria-label={`Badge completion rate: ${summary}`}>
      <Bar
        aria-hidden
        data={{
          labels: data.map((point) => point.badgeName),
          datasets: [
            {
              data: data.map((point) => point.completionRate),
              backgroundColor: palette.gold2,
              hoverBackgroundColor: palette.gold,
              borderRadius: 6,
              maxBarThickness: 26,
            },
          ],
        }}
        options={CHART_OPTIONS}
      />
    </div>
  );
}
