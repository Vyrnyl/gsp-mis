'use client';

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  type ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

import { palette } from '@/shared/design/tokens';

import { FINANCIAL_TREND_COLORS } from '../constants';
import type { MonthlyFinancePoint } from '../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const CHART_OPTIONS: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { color: palette.muted, font: { size: 11 }, boxWidth: 12 } },
    tooltip: { backgroundColor: palette.ink, padding: 8, cornerRadius: 6 },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: palette.muted, font: { size: 11 } } },
    y: {
      beginAtZero: true,
      ticks: { color: palette.muted, font: { size: 11 } },
      grid: { color: palette.borderFaint },
    },
  },
};

export interface FinancialTrendChartProps {
  data: MonthlyFinancePoint[];
}

/**
 * Financial Trends bar chart — registry §4. Same two-dataset port as finance's
 * `FinanceTrendChart`; a separate component here since each feature owns its own
 * chart set (same precedent as `MembershipTrendChart` vs. the dashboard's growth chart).
 */
export function FinancialTrendChart({ data }: FinancialTrendChartProps) {
  const summary = data.map((point) => `${point.label} income ${point.income}, expense ${point.expense}`).join('; ');

  return (
    <div style={{ height: 220 }} role="img" aria-label={`Monthly income vs. expense: ${summary}`}>
      <Bar
        aria-hidden
        data={{
          labels: data.map((point) => point.label),
          datasets: [
            {
              label: 'Income',
              data: data.map((point) => point.income),
              backgroundColor: FINANCIAL_TREND_COLORS.income,
              hoverBackgroundColor: palette.green,
              borderRadius: 6,
              maxBarThickness: 28,
            },
            {
              label: 'Expense',
              data: data.map((point) => point.expense),
              backgroundColor: FINANCIAL_TREND_COLORS.expense,
              hoverBackgroundColor: palette.red,
              borderRadius: 6,
              maxBarThickness: 28,
            },
          ],
        }}
        options={CHART_OPTIONS}
      />
    </div>
  );
}
