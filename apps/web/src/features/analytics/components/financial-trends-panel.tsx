import { Card, CardHeader, ChartSkeleton, ErrorState, StatCard, StatCardSkeleton } from '@/shared/components/ui';
import { formatCurrency } from '@/shared/utils/format-currency';

import { FINANCIAL_STAT_PRESENTATION } from '../constants';
import type { FinancialAnalytics, ViewState } from '../types';
import { FinancialTrendChart } from './financial-trend-chart';

export interface FinancialTrendsPanelProps {
  viewState: ViewState;
  data: FinancialAnalytics | null;
  onRetry: () => void;
}

export function FinancialTrendsPanel({ viewState, data, onRetry }: FinancialTrendsPanelProps) {
  if (viewState === 'error') {
    return (
      <Card>
        <ErrorState onRetry={onRetry} description="We could not load financial analytics. Check your connection and try again." />
      </Card>
    );
  }

  if (viewState === 'loading' || !data) {
    return (
      <div>
        <div className="mb-5 grid grid-cols-1 gap-3.5 md:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>
        <Card>
          <ChartSkeleton />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 grid grid-cols-1 gap-3.5 md:grid-cols-3">
        {data.stats.map((stat) => {
          const presentation = FINANCIAL_STAT_PRESENTATION[stat.id] ?? FINANCIAL_STAT_PRESENTATION['income']!;
          return <StatCard key={stat.id} icon={presentation.icon} tone={presentation.tone} value={formatCurrency(Number(stat.value))} label={stat.label} />;
        })}
      </div>

      <Card>
        <CardHeader title="Financial Trends" subtitle="Income vs. expense, last 6 months" />
        {data.trend.some((point) => point.income > 0 || point.expense > 0) ? (
          <FinancialTrendChart data={data.trend} />
        ) : (
          <p className="py-8 text-center text-[0.85rem] text-muted">No transactions recorded in this period.</p>
        )}
      </Card>
    </div>
  );
}
