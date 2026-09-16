import { AnalyticsIcon, InfoIcon, SuccessIcon, type IconType } from '@/shared/components/icons';
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
import type { DecisionSupport, MoneySlice, ViewState } from '../types';

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
 * An honesty guard is visible here: groups too small to rank are listed explicitly
 * under "Not ranked" rather than omitted, so "insufficient data" never reads as
 * "healthy".
 *
 * The money section shipped income-only on 2026-09-16 because `Expense` had no school
 * or event FK. The attribution migration later that day made both sides derivable, so
 * it now carries spending by school and by activity plus a direct income-vs-spending
 * comparison. Costs belonging to no single school stay visible as "Council-wide"
 * rather than being dropped or attributed by guesswork.
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

      {data.promotionReadiness.some((row) => row.overAge > 0) ? (
        <Card className="mb-3.5">
          <CardHeader
            title="Promotion readiness"
            subtitle="Members whose age has moved past their current level — a point-in-time check, not a history"
          />
          <TableWrapper>
            <Table caption="Promotion readiness by level">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Level</TableHeaderCell>
                  <TableHeaderCell>Members</TableHeaderCell>
                  <TableHeaderCell>Over Age</TableHeaderCell>
                  <TableHeaderCell>Should Move To</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.promotionReadiness
                  .filter((row) => row.overAge > 0)
                  .map((row) => (
                    <TableRow key={row.levelId}>
                      <TableCell>
                        <span className="whitespace-nowrap">{row.levelName}</span>
                      </TableCell>
                      <TableCell>{row.memberCount}</TableCell>
                      <TableCell>
                        <Badge tone="gold">{row.overAge}</Badge>
                      </TableCell>
                      <TableCell>{row.nextLevelName ?? <span className="text-muted">Highest level</span>}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableWrapper>
        </Card>
      ) : null}

      <Card>
        <CardHeader
          title="Where the money comes from and goes"
          subtitle="Income and spending attributed by school, category and activity"
        />

        <div className="grid grid-cols-1 gap-3.5 lg2:grid-cols-2">
          <MoneyTable
            heading="Income by School"
            caption="Income by school"
            firstColumn="School"
            rows={data.incomeBySchool}
            emptyIcon={InfoIcon}
            emptyTitle="No income recorded"
          />
          <MoneyTable
            heading="Spending by Category"
            caption="Spending by category"
            firstColumn="Category"
            rows={data.expenseByCategory}
            emptyIcon={AnalyticsIcon}
            emptyTitle="No spending recorded"
          />
          <MoneyTable
            heading="Spending by School"
            caption="Spending by school"
            firstColumn="School"
            rows={data.expenseBySchool}
            emptyIcon={AnalyticsIcon}
            emptyTitle="No spending recorded"
          />
          <MoneyTable
            heading="Spending by Activity"
            caption="Spending by activity"
            firstColumn="Activity"
            rows={data.expenseByEvent}
            emptyIcon={AnalyticsIcon}
            emptyTitle="No spending recorded"
          />
        </div>

        {data.schoolFinance.length > 0 ? (
          <div className="mt-4">
            <h4 className="mb-2 text-[0.92rem] font-semibold text-ink">Income vs. Spending by School</h4>
            <TableWrapper>
              <Table caption="Income versus spending by school">
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>School</TableHeaderCell>
                    <TableHeaderCell>Income</TableHeaderCell>
                    <TableHeaderCell>Spending</TableHeaderCell>
                    <TableHeaderCell>Net</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.schoolFinance.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <span className="whitespace-nowrap">{row.label}</span>
                      </TableCell>
                      <TableCell>{formatCurrency(row.income)}</TableCell>
                      <TableCell>{formatCurrency(row.expense)}</TableCell>
                      <TableCell>
                        <span className={row.net < 0 ? 'font-semibold text-brand-red' : 'font-semibold text-brand-green'}>
                          {formatCurrency(row.net)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrapper>
            <p className="mt-2 text-[0.82rem] text-muted">
              Council-wide costs that belong to no single school are excluded from this comparison and appear under
              &ldquo;Council-wide&rdquo; above.
            </p>
          </div>
        ) : null}

        {!hasIncome && !hasExpenses ? (
          <EmptyState
            icon={AnalyticsIcon}
            title="No financial activity in range"
            description="No payments or expenses fall within the selected date range."
          />
        ) : null}
      </Card>
    </div>
  );
}

/** One money breakdown table. Four of these sit side by side, differing only in their
 * heading and rows, so they share a component rather than being copied four times. */
function MoneyTable({
  heading,
  caption,
  firstColumn,
  rows,
  emptyIcon,
  emptyTitle,
}: {
  heading: string;
  caption: string;
  firstColumn: string;
  rows: MoneySlice[];
  emptyIcon: IconType;
  emptyTitle: string;
}) {
  return (
    <div>
      <h4 className="mb-2 text-[0.92rem] font-semibold text-ink">{heading}</h4>
      {rows.length > 0 ? (
        <TableWrapper>
          <Table caption={caption}>
            <TableHead>
              <TableRow>
                <TableHeaderCell>{firstColumn}</TableHeaderCell>
                <TableHeaderCell>Amount</TableHeaderCell>
                <TableHeaderCell>Share</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
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
        <EmptyState icon={emptyIcon} title={emptyTitle} description="Nothing falls within the selected range." />
      )}
    </div>
  );
}
