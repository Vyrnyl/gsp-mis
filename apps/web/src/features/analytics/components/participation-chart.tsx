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

import type { EventParticipation } from '../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const CHART_OPTIONS: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  plugins: {
    // Explicitly disabled — see `MembershipTrendChart` for why (shared ChartJS
    // `Legend` registry, not per-chart).
    legend: { display: false },
    tooltip: { backgroundColor: palette.ink, padding: 8, cornerRadius: 6 },
  },
  scales: {
    x: {
      beginAtZero: true,
      ticks: { color: palette.muted, font: { size: 11 }, stepSize: 1 },
      grid: { color: palette.borderFaint },
    },
    y: { grid: { display: false }, ticks: { color: palette.muted, font: { size: 11 } } },
  },
};

export interface ParticipationChartProps {
  data: EventParticipation[];
}

/** Event Participation bar chart — registry §4. Horizontal bar (registrants per
 * event) since event titles read better as row labels than crowded x-axis ticks. */
export function ParticipationChart({ data }: ParticipationChartProps) {
  const summary = data.map((point) => `${point.eventTitle} ${point.registrations}`).join(', ');

  return (
    <div style={{ height: Math.max(180, data.length * 42) }} role="img" aria-label={`Registrations by event: ${summary}`}>
      <Bar
        aria-hidden
        data={{
          labels: data.map((point) => point.eventTitle),
          datasets: [
            {
              data: data.map((point) => point.registrations),
              backgroundColor: palette.green2,
              hoverBackgroundColor: palette.green,
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
