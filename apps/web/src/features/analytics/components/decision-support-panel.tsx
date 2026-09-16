import { AnalyticsIcon, InfoIcon, SuccessIcon } from '@/shared/components/icons';
import {
  Alert,
  Badge,
  Card,
  CardHeader,
  CardSkeleton,
  EmptyState,
  ErrorState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableSkeleton,
  TableWrapper,
} from '@/shared/components/ui';
import { formatCurrency } from '@/shared/utils/format-currency';

import { INSIGHT_SEVERITY_PRESENTATION } from '../constants';
import type { DecisionSupport, ViewState } from '../types';

export interface DecisionSupportPanelProps {
  viewState: ViewState;
  data: DecisionSupport | null;
  onRetry: () => void;
}

/**
 * The Decision-Making surface (2026-09-16 revision). Unlike the six aggregate tabs,
 * which answer "what are the numbers?", this one answers "what needs a decision?" —
 * ranked findings, most severe first, each stating the figure it rests on so a reader
 * can check the claim before acting on it.
 *
 * Two deliberate honesty guards are visible here: groups too small to rank are listed
 * explicitly under "Not ranked" rather than omitted (so "insufficient data" never
 * reads as "healthy"), and the budget section states plainly that expenses carry no
 * school/activity association in the schema, rather than implying a breakdown that
 * cannot be derived.
 */
export function DecisionSupportPanel({ viewState, data, onRetry }: DecisionSupportPanelProps) {
  if (viewState === 'error') {
    return (
      <Card>
        <ErrorState onRetry={onRetry} description="We could not load decision insights. Check your connection and try again." />
      </Card>
    );
  }

  if (viewState === 'loading' || !data) {
    return (
      <div>
        <Card className="mb-3.5">
          <CardSkeleton />
        </Card>
        <Card>
          <TableSkeleton rows={4} columns={3} />
        </Card>
      </div>
    );
  }

  const hasIncome = data.incomeBySchool.length > 0;
  const hasExpenses = data.expenseByCategory.length > 0;

  return (
    <div>
      <Card className="mb-3.5">
        <CardHeader
          title="What needs attention"
          subtitle="Ranked from the current filter selection — each finding shows the figure behind it"
        />

        {data.insights.length > 0 ? (
          <div className="flex flex-col gap-3">
            {data.insights.map((insight) => {
              const presentation = INSIGHT_SEVERITY_PRESENTATION[insight.severity];
              return (
                <Alert key={insight.id} tone={presentation.tone}>
                  <div className="flex flex-col gap-1.5">
                    <p className="font-semibold">{insight.title}</p>
                    <p>{insight.detail}</p>
                    <p className="text-ink-soft">
                      <span className="font-semibold">Suggested action: </span>
                      {insight.recommendation}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <Badge tone={presentation.badgeTone}>{presentation.label}</Badge>
                      <Badge tone="gray">{insight.metric}</Badge>
                    </div>
                  </div>
                </Alert>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={SuccessIcon}
            title="No issues flagged"
            description="Nothing in the current selection crosses the thresholds for low participation, weak achievement or poor turnout."
          />
        )}
      </Card>

      {data.suppressed.length > 0 ? (
        <Card className="mb-3.5">
          <CardHeader
            title="Not ranked"
            subtitle="Too few members to judge fairly — listed so they are not mistaken for healthy groups"
          />
          <div className="flex flex-wrap gap-2">
            {data.suppressed.map((group) => (
              <Badge key={group.label} tone="gray">
                {group.label} — {group.memberCount} member{group.memberCount === 1 ? '' : 's'}
              </Badge>
            ))}
          </div>
        </Card>
      ) : null}

      <Card>
        <CardHeader title="Where the money comes from and goes" subtitle="Income attributed by school; spending by category" />

        <Alert tone="info">
          <span className="font-semibold">Expenses cannot be attributed to a school or activity.</span> Expense records carry no school,
          troop or event association, so spending is shown council-wide by category only. Income is attributable through the paying member.
        </Alert>

        <div className="mt-4 grid grid-cols-1 gap-3.5 lg2:grid-cols-2">
          <div>
            <h4 className="mb-2 text-[0.92rem] font-semibold text-ink">Income by School</h4>
            {hasIncome ? (
              <TableWrapper>
                <Table caption="Income by school">
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>School</TableHeaderCell>
                      <TableHeaderCell>Amount</TableHeaderCell>
                      <TableHeaderCell>Share</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.incomeBySchool.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.label}</TableCell>
                        <TableCell>{formatCurrency(row.amount)}</TableCell>
                        <TableCell>{row.share}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableWrapper>
            ) : (
              <EmptyState icon={InfoIcon} title="No income recorded" description="No payments fall within the selected range." />
            )}
          </div>

          <div>
            <h4 className="mb-2 text-[0.92rem] font-semibold text-ink">Spending by Category</h4>
            {hasExpenses ? (
              <TableWrapper>
                <Table caption="Spending by category">
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Category</TableHeaderCell>
                      <TableHeaderCell>Amount</TableHeaderCell>
                      <TableHeaderCell>Share</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.expenseByCategory.map((row) => (
                      <TableRow key={row.label}>
                        <TableCell>{row.label}</TableCell>
                        <TableCell>{formatCurrency(row.amount)}</TableCell>
                        <TableCell>{row.share}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableWrapper>
            ) : (
              <EmptyState icon={AnalyticsIcon} title="No spending recorded" description="No expenses fall within the selected range." />
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
