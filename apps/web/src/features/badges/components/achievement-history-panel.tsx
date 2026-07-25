'use client';

import { useState } from 'react';

import { AddIcon, ActivityIcon } from '@/shared/components/icons';
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  Pagination,
  Table,
  TableAvatar,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableSkeleton,
  TableWrapper,
} from '@/shared/components/ui';
import { usePagedItems } from '@/shared/hooks/use-paged-items';

import type { AchievementFormValues, AchievementRecordSummary, MemberOption, ViewState } from '../types';
import { AchievementFormModal } from './achievement-form-modal';

const PAGE_SIZE = 8;

export interface AchievementHistoryPanelProps {
  viewState: ViewState;
  achievements: AchievementRecordSummary[];
  memberOptions: MemberOption[];
  canRecord: boolean;
  onRetry: () => void;
  onCreate: (values: AchievementFormValues) => Promise<void>;
}

function toDisplayDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Achievement history — free-form `AchievementRecord` entries, distinct from catalog badges. */
export function AchievementHistoryPanel({
  viewState,
  achievements,
  memberOptions,
  canRecord,
  onRetry,
  onCreate,
}: AchievementHistoryPanelProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { page, setPage, pageItems, totalItems, pageSize } = usePagedItems(achievements, PAGE_SIZE);

  async function handleSubmit(values: AchievementFormValues) {
    await onCreate(values);
    setIsFormOpen(false);
  }

  return (
    <Card>
      <CardHeader
        title="Achievement History"
        subtitle={viewState === 'ready' ? `${achievements.length.toLocaleString()} recorded` : undefined}
        actions={
          canRecord ? (
            <Button leadingIcon={<AddIcon aria-hidden />} onClick={() => setIsFormOpen(true)}>
              Record Achievement
            </Button>
          ) : undefined
        }
      />

      {viewState === 'loading' ? <TableSkeleton rows={4} columns={4} /> : null}

      {viewState === 'error' ? (
        <ErrorState onRetry={onRetry} description="We could not load achievement history. Check your connection and try again." />
      ) : null}

      {viewState === 'ready' && achievements.length === 0 ? (
        <EmptyState
          icon={ActivityIcon}
          title="No achievements recorded yet"
          description={
            canRecord
              ? 'Record a member’s milestone or recognition to build their achievement history.'
              : 'Achievements recorded by troop leaders will appear here.'
          }
          action={
            canRecord ? (
              <Button leadingIcon={<AddIcon aria-hidden />} onClick={() => setIsFormOpen(true)}>
                Record Achievement
              </Button>
            ) : undefined
          }
        />
      ) : null}

      {viewState === 'ready' && achievements.length > 0 ? (
        <TableWrapper>
          <Table caption="Member achievement history">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Member</TableHeaderCell>
                <TableHeaderCell>Achievement</TableHeaderCell>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Recorded By</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pageItems.map((achievement) => (
                <TableRow key={achievement.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <TableAvatar name={achievement.memberName} />
                      <div>
                        <p className="whitespace-nowrap">{achievement.memberName}</p>
                        <p className="whitespace-nowrap text-[0.78rem] text-muted">{achievement.troopName ?? '—'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold text-ink">{achievement.achievementName}</p>
                    {achievement.description ? (
                      <p className="mt-0.5 max-w-xs text-[0.78rem] text-muted">{achievement.description}</p>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <span className="whitespace-nowrap">{toDisplayDate(achievement.achievedAt)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="whitespace-nowrap">{achievement.recordedByName ?? '—'}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableWrapper>
      ) : null}

      {viewState === 'ready' && achievements.length > pageSize ? (
        <Pagination page={page} pageSize={pageSize} totalItems={totalItems} onPageChange={setPage} itemLabel="achievements" />
      ) : null}

      {canRecord ? (
        <AchievementFormModal
          isOpen={isFormOpen}
          memberOptions={memberOptions}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleSubmit}
        />
      ) : null}
    </Card>
  );
}
