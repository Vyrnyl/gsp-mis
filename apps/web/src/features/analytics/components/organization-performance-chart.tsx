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

import { TROOP_CHART_COLORS } from '../constants';
import type { TroopPerformance } from '../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const CHART_OPTIONS: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    // Explicitly disabled — see `MembershipTrendChart` for why (shared ChartJS
    // `Legend` registry, not per-chart).
    legend: { display: false },
    tooltip: { backgroundColor: palette.ink, padding: 8, cornerRadius: 6 },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: palette.muted, font: { size: 11 } } },
    y: {
      beginAtZero: true,
      ticks: { color: palette.muted, font: { size: 11 }, stepSize: 1 },
      grid: { color: palette.borderFaint },
    },
  },
};

export interface OrganizationPerformanceChartProps {
  data: TroopPerformance[];
}

/** Organization Performance bar chart — registry §4. Member count per troop; the
 * accompanying table (in `organization-performance-panel.tsx`) carries attendance
 * rate and badges earned, since those are percentage/count metrics on a different
 * scale than raw member counts and would be unreadable on one shared axis. */
export function OrganizationPerformanceChart({ data }: OrganizationPerformanceChartProps) {
  const summary = data.map((point) => `${point.troopName} ${point.memberCount}`).join(', ');

  return (
    <div style={{ height: 220 }} role="img" aria-label={`Member count by troop: ${summary}`}>
      <Bar
        aria-hidden
        data={{
          labels: data.map((point) => point.troopName),
          datasets: [
            {
              data: data.map((point) => point.memberCount),
              backgroundColor: data.map((_, index) => TROOP_CHART_COLORS[index % TROOP_CHART_COLORS.length]),
              borderRadius: 6,
              maxBarThickness: 48,
            },
          ],
        }}
        options={CHART_OPTIONS}
      />
    </div>
  );
}
