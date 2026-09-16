import { BadgeIcon, MembersIcon } from '@/shared/components/icons';
import {
  Card,
  CardHeader,
  ChartSkeleton,
  EmptyState,
  ErrorState,
  StatCard,
  StatCardSkeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableSkeleton,
  TableWrapper,
} from '@/shared/components/ui';

import { BADGE_STAT_PRESENTATION } from '../constants';
import type { BadgeAnalytics, ViewState } from '../types';
import { BadgeCompletionChart } from './badge-completion-chart';
import { BreakdownChart } from './breakdown-chart';
import { DimensionBreakdownCard } from './dimension-breakdown-card';

export interface BadgeCompletionPanelProps {
  viewState: ViewState;
  data: BadgeAnalytics | null;
  onRetry: () => void;
}

/**
 * 2026-09-16 R4 revision, step 5 — before it, this tab was three totals plus a
 * per-badge completion chart. That chart answers "which individual badges are
 * popular?", but the brief asks which *areas* are strongest and weakest, and an area
 * is a property of `BadgeCategory` rather than of any one badge: a council could have
 * Leadership thriving and Arts & Culture untouched and this tab would show neither.
 *
 * It now breaks the same badge data down by area and by scout level, and names the
 * members carrying it.
 *
 * The area breakdown gets its own table rather than reusing `DimensionBreakdownCard`:
 * that card's shape carries an Attendance Rate column, which is meaningless for a
 * badge area (a badge is not an event) and would render as a column of "No data" on
 * every row. The by-level card does reuse it, since a level has real attendance.
 */
export function BadgeCompletionPanel({ viewState, data, onRetry }: BadgeCompletionPanelProps) {
  if (viewState === 'error') {
    return (
      <Card>
        <ErrorState onRetry={onRetry} description="We could not load badge analytics. Check your connection and try again." />
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
        <Card className="mb-3.5">
          <ChartSkeleton />
        </Card>
        <Card className="mb-3.5">
          <ChartSkeleton />
        </Card>
        <Card className="mb-3.5">
          <ChartSkeleton />
        </Card>
        <Card>
          <TableSkeleton rows={5} columns={5} />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 grid grid-cols-1 gap-3.5 md:grid-cols-3">
        {data.stats.map((stat) => {
          const presentation = BADGE_STAT_PRESENTATION[stat.id] ?? BADGE_STAT_PRESENTATION['totalAwarded']!;
          return <StatCard key={stat.id} icon={presentation.icon} tone={presentation.tone} value={stat.value} label={stat.label} />;
        })}
      </div>

      <Card className="mb-3.5">
        <CardHeader title="Badge Completion" subtitle="% of members who have earned or verified each badge" />
        {data.completionByBadge.length > 0 ? (
          <BadgeCompletionChart data={data.completionByBadge} />
        ) : (
          <EmptyState icon={BadgeIcon} title="No badges in the catalog yet" description="Once badges are added and recorded, completion rates will appear here." />
        )}
      </Card>

      <Card className="mb-3.5">
        <CardHeader
          title="Achievement by Badge Area"
          subtitle="Which areas the council is strongest and weakest in"
        />
        {data.byArea.length > 0 ? (
          <>
            <BreakdownChart
              labels={data.byArea.map((row) => row.label)}
              values={data.byArea.map((row) => row.badgesEarned)}
              valueLabel="badges earned"
            />
            <TableWrapper className="mt-4">
              <Table caption="Achievement by badge area">
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Badge Area</TableHeaderCell>
                    <TableHeaderCell>Badges Earned</TableHeaderCell>
                    <TableHeaderCell>Members Earning</TableHeaderCell>
                    <TableHeaderCell>Badges / Earner</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.byArea.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <span className="whitespace-nowrap">{row.label}</span>
                      </TableCell>
                      <TableCell>{row.badgesEarned}</TableCell>
                      {/* Members who earned at least one badge in this area — not the
                          area's "membership", which does not exist. An area with 0
                          here is one nobody has started, which is exactly the signal
                          "weakest area" is meant to surface. */}
                      <TableCell>{row.memberCount}</TableCell>
                      <TableCell>{row.badgesPerMember}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrapper>
          </>
        ) : (
          <EmptyState
            icon={BadgeIcon}
            title="No badge areas to compare"
            description="No badge matches the current selection. Badge areas are set per badge in Organization Management."
          />
        )}
      </Card>

      <DimensionBreakdownCard
        title="Achievement by Scout Level"
        subtitle="Badges earned per level — where the programme is delivering and where it thins out"
        dimensionLabel="Scout Level"
        rows={data.byLevel}
        metric="badgesEarned"
        // Levels read as a curriculum progression (Twinkler → Cadet); re-ranking them
        // by size would hide where the pipeline drops off, which is the point.
        preserveOrder
        // This is the Badges tab: lead with badges rather than the default members +
        // attendance columns, which otherwise push the figure the reader came for off
        // the right edge on a narrow screen.
        leadWithMetric
        emptyTitle="No scout levels to compare"
        emptyDescription="No member matches the current selection."
      />

      <Card>
        <CardHeader title="Top Badge Earners" subtitle="Members with the most badges earned or verified" />
        {data.topEarners.length > 0 ? (
          <TableWrapper>
            <Table caption="Top badge earners">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Member</TableHeaderCell>
                  <TableHeaderCell>School</TableHeaderCell>
                  <TableHeaderCell>Scout Level</TableHeaderCell>
                  <TableHeaderCell>Badges Earned</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.topEarners.map((earner) => (
                  <TableRow key={earner.memberId}>
                    <TableCell>
                      <span className="whitespace-nowrap">{earner.memberName}</span>
                    </TableCell>
                    <TableCell>{earner.school}</TableCell>
                    <TableCell>{earner.scoutLevel}</TableCell>
                    <TableCell>{earner.badgesEarned}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableWrapper>
        ) : (
          <EmptyState
            icon={MembersIcon}
            title="No badges earned yet"
            description="Once members earn or verify badges, the top earners will be listed here."
          />
        )}
      </Card>
    </div>
  );
}
