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

import type { TrendPoint } from '../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const CHART_OPTIONS: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    // Explicitly disabled — see `MembershipTrendChart` for why (shared ChartJS
    // `Legend` registry, not per-chart).
    legend: { display: false },
    tooltip: {
      backgroundColor: palette.ink,
      padding: 8,
      cornerRadius: 6,
      callbacks: { label: (ctx) => `${ctx.formattedValue}%` },
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: palette.muted, font: { size: 11 } } },
    y: {
      beginAtZero: true,
      max: 100,
      ticks: { color: palette.muted, font: { size: 11 }, callback: (value) => `${value}%` },
      grid: { color: palette.borderFaint },
    },
  },
};

export interface AttendanceTrendChartProps {
  data: TrendPoint[];
}

/** Attendance Trends bar chart — registry §4. One series (average attendance rate %
 * per month), y-axis fixed to a 0–100 percentage scale. */
export function AttendanceTrendChart({ data }: AttendanceTrendChartProps) {
  const summary = data.map((point) => `${point.label} ${point.value}%`).join(', ');

  return (
    <div style={{ height: 220 }} role="img" aria-label={`Average attendance rate by month: ${summary}`}>
      <Bar
        aria-hidden
        data={{
          labels: data.map((point) => point.label),
          datasets: [
            {
              data: data.map((point) => point.value),
              backgroundColor: palette.blue,
              hoverBackgroundColor: palette.blueHover,
              borderRadius: 6,
              maxBarThickness: 40,
            },
          ],
        }}
        options={CHART_OPTIONS}
      />
    </div>
  );
}
