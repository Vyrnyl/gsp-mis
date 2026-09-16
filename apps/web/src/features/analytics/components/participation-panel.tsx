import { EventIcon, MembersIcon } from '@/shared/components/icons';
import {
  Alert,
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

import { PARTICIPATION_STAT_PRESENTATION } from '../constants';
import type { ParticipationAnalytics, ViewState } from '../types';
import { BreakdownChart } from './breakdown-chart';
import { ParticipationChart } from './participation-chart';

export interface ParticipationPanelProps {
  viewState: ViewState;
  data: ParticipationAnalytics | null;
  onRetry: () => void;
}

/** Zero attendance *records* is missing data, not 0% turnout — two very different
 * claims, and the R3 false positives came from conflating them. */
function attendanceCell(rate: number, records: number) {
  return records > 0 ? `${rate}%` : <span className="text-muted">No data</span>;
}

/**
 * 2026-09-16 R4 revision — before it, this tab showed three totals and a
 * registrations-per-event list: it could say how many people registered, but never
 * which *kinds* of activity draw them or which schools actually turn up.
 *
 * It now breaks the same participation down by activity type and by school, adds the
 * active-vs-inactive split, and carries the Community Engagement card that R3 missed
 * entirely.
 */
export function ParticipationPanel({ viewState, data, onRetry }: ParticipationPanelProps) {
  if (viewState === 'error') {
    return (
      <Card>
        <ErrorState onRetry={onRetry} description="We could not load participation analytics. Check your connection and try again." />
      </Card>
    );
  }

  if (viewState === 'loading' || !data) {
    return (
      <div>
        <div className="mb-5 grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
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
          <TableSkeleton rows={4} columns={5} />
        </Card>
        <Card>
          <TableSkeleton rows={3} columns={5} />
        </Card>
      </div>
    );
  }

  const { community } = data;
  const communitySources = [...community.badgeCategories, ...community.activityCategories];

  return (
    <div>
      <div className="mb-5 grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
        {data.stats.map((stat) => {
          const presentation = PARTICIPATION_STAT_PRESENTATION[stat.id] ?? PARTICIPATION_STAT_PRESENTATION['totalRegistrations']!;
          return <StatCard key={stat.id} icon={presentation.icon} tone={presentation.tone} value={stat.value} label={stat.label} />;
        })}
      </div>

      <Card className="mb-3.5">
        <CardHeader title="Event Participation" subtitle="Registrations per event, most recent first" />
        {data.byEvent.length > 0 ? (
          <ParticipationChart data={data.byEvent} />
        ) : (
          <EmptyState icon={EventIcon} title="No event registrations yet" description="Once members register for events, participation will appear here." />
        )}
      </Card>

      <Card className="mb-3.5">
        <CardHeader
          title="Participation by Activity Type"
          subtitle="Which kinds of activity draw members — and which need support"
        />
        {data.byActivityType.length > 0 ? (
          <>
            <BreakdownChart
              labels={data.byActivityType.map((row) => row.label)}
              values={data.byActivityType.map((row) => row.registrations)}
              valueLabel="registrations"
            />
            <TableWrapper className="mt-4">
              <Table caption="Participation by activity type">
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Activity Type</TableHeaderCell>
                    <TableHeaderCell>Events</TableHeaderCell>
                    <TableHeaderCell>Held</TableHeaderCell>
                    <TableHeaderCell>Registrations</TableHeaderCell>
                    <TableHeaderCell>Attendance Rate</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.byActivityType.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <span className="whitespace-nowrap">{row.label}</span>
                      </TableCell>
                      <TableCell>{row.eventCount}</TableCell>
                      {/* An upcoming event is not a turnout failure — showing the held
                          count next to the rate is what keeps "0%" from reading as
                          "nobody came" when the event simply hasn't happened. */}
                      <TableCell>{row.heldEvents}</TableCell>
                      <TableCell>{row.registrations}</TableCell>
                      <TableCell>{attendanceCell(row.attendanceRate, row.heldEvents)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrapper>
          </>
        ) : (
          <EmptyState icon={EventIcon} title="No activities to break down" description="No event matches the current selection." />
        )}
      </Card>

      <Card className="mb-3.5">
        <CardHeader
          title="Participation by School"
          subtitle="Active vs. inactive members — schools ranked by the share who took part"
        />
        {data.bySchool.length > 0 ? (
          <>
            <BreakdownChart
              labels={data.bySchool.map((row) => row.label)}
              values={data.bySchool.map((row) => row.participationRate)}
              valueLabel="% participating"
            />
            <TableWrapper className="mt-4">
              <Table caption="Participation by school">
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>School</TableHeaderCell>
                    <TableHeaderCell>Members</TableHeaderCell>
                    <TableHeaderCell>Active</TableHeaderCell>
                    <TableHeaderCell>Inactive</TableHeaderCell>
                    <TableHeaderCell>Participation</TableHeaderCell>
                    <TableHeaderCell>Registrations</TableHeaderCell>
                    <TableHeaderCell>Attendance Rate</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.bySchool.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <span className="whitespace-nowrap">{row.label}</span>
                      </TableCell>
                      <TableCell>{row.memberCount}</TableCell>
                      <TableCell>{row.activeMembers}</TableCell>
                      <TableCell>{row.memberCount - row.activeMembers}</TableCell>
                      <TableCell>{row.participationRate}%</TableCell>
                      <TableCell>{row.registrations}</TableCell>
                      <TableCell>{attendanceCell(row.attendanceRate, row.attendanceRecords)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrapper>
          </>
        ) : (
          <EmptyState icon={MembersIcon} title="No schools to break down" description="No member matches the current selection." />
        )}
      </Card>

      <Card>
        <CardHeader
          title="Community Engagement"
          subtitle="Community-tagged badges earned and outreach events, compared across schools"
        />
        {/* The schema has no "is community" flag, so these are matched by category
            name. Saying so on screen means an empty card reads as "no such categories"
            rather than "nobody volunteers" — a claim this data cannot support. */}
        {communitySources.length > 0 ? (
          <>
            <Alert tone="info" className="mb-4">
              Counted from the {communitySources.map((name) => `"${name}"`).join(' and ')}{' '}
              {communitySources.length === 1 ? 'category' : 'categories'}. A member counts as engaged if they earned a
              community badge or registered for an outreach event.
            </Alert>

            <div className="mb-4 grid grid-cols-1 gap-3.5 md:grid-cols-3">
              <StatCard icon={MembersIcon} tone="green" value={community.communityBadgesEarned} label="Community Badges Earned" />
              <StatCard icon={EventIcon} tone="blue" value={community.communityEvents} label="Outreach Events" />
              <StatCard icon={EventIcon} tone="gold" value={community.communityRegistrations} label="Outreach Registrations" />
            </div>

            {community.bySchool.length > 0 ? (
              <TableWrapper>
                <Table caption="Community engagement by school">
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>School</TableHeaderCell>
                      <TableHeaderCell>Members</TableHeaderCell>
                      <TableHeaderCell>Engaged</TableHeaderCell>
                      <TableHeaderCell>Engagement</TableHeaderCell>
                      <TableHeaderCell>Community Badges</TableHeaderCell>
                      <TableHeaderCell>Outreach Registrations</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {community.bySchool.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <span className="whitespace-nowrap">{row.label}</span>
                        </TableCell>
                        <TableCell>{row.memberCount}</TableCell>
                        <TableCell>{row.engagedMembers}</TableCell>
                        <TableCell>{row.engagementRate}%</TableCell>
                        <TableCell>{row.communityBadgesEarned}</TableCell>
                        <TableCell>{row.communityRegistrations}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableWrapper>
            ) : (
              <EmptyState icon={MembersIcon} title="No schools to compare" description="No member matches the current selection." />
            )}
          </>
        ) : (
          <EmptyState
            icon={MembersIcon}
            title="No community categories configured"
            description='Community engagement is counted from badge and activity categories named "Community Service" and "Community Outreach". Add them in Organization Management to track it here.'
          />
        )}
      </Card>
    </div>
  );
}
