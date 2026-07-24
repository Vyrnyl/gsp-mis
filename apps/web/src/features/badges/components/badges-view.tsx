'use client';

import { useCallback, useEffect, useState } from 'react';

import type { AuthUser } from '@/features/auth/types';
import { listBadgeCategories } from '@/features/organizations/services/organizations.service';
import { AddIcon, ApprovalIcon, BadgeIcon, ClockIcon, SuccessIcon } from '@/shared/components/icons';
import { Button, StatCard, Tabs, useToast } from '@/shared/components/ui';

import { BADGE_TABS } from '../constants';
import {
  createAchievement,
  createBadge,
  deleteBadge,
  listAchievements,
  listBadges,
  listMemberOptions,
  listMemberProgress,
  recordMemberBadge,
  updateBadge,
  verifyMemberBadge,
} from '../services/badges.service';
import type {
  AchievementFormValues,
  AchievementRecordSummary,
  BadgeCatalogItem,
  BadgeCategoryOption,
  BadgeFormValues,
  BadgeTabId,
  MemberOption,
  MemberProgressSummary,
  RecordBadgeFormValues,
  ViewState,
} from '../types';
import { AchievementHistoryPanel } from './achievement-history-panel';
import { BadgeCatalogPanel } from './badge-catalog-panel';
import { MemberProgressPanel } from './member-progress-panel';
import { RecordBadgeModal } from './record-badge-modal';

export interface BadgesViewProps {
  user: AuthUser;
}

/**
 * Loop steps 3–5 (Contract + Wire Read + Wire Write) for Feature 2.4.
 *
 * Role split (confirmed before building, see progress.md 2.4): catalog CRUD and
 * verification are Administrator-only (project-overview.md's Admin-only "Create
 * badge requirements / Update badge information / Delete badges / Verify
 * achievements"); recording earned badges and achievements is Administrator +
 * Troop Leader ("Badge Tracking" — Record earned badges / Update achievements);
 * Executive Council is read-only everywhere. Read scope (Member Progress,
 * Achievement History, the member picker) is derived server-side from
 * `Troop.leaderId` for Troop Leader — never a client parameter.
 */
export function BadgesView({ user }: BadgesViewProps) {
  const { showToast } = useToast();
  const canManageCatalog = user.role === 'admin';
  const canRecord = user.role === 'admin' || user.role === 'troop_leader';
  const canVerify = user.role === 'admin';

  const [viewState, setViewState] = useState<ViewState>('loading');
  const [activeTab, setActiveTab] = useState<BadgeTabId>('catalog');

  const [badges, setBadges] = useState<BadgeCatalogItem[]>([]);
  const [memberProgress, setMemberProgress] = useState<MemberProgressSummary[]>([]);
  const [achievements, setAchievements] = useState<AchievementRecordSummary[]>([]);
  const [memberOptions, setMemberOptions] = useState<MemberOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<BadgeCategoryOption[]>([]);

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setViewState('loading');
    try {
      const [badgesResult, progressResult, achievementsResult, categoriesResult, memberOptionsResult] =
        await Promise.all([
          listBadges(),
          listMemberProgress(),
          listAchievements(),
          listBadgeCategories(),
          canRecord ? listMemberOptions() : Promise.resolve([]),
        ]);
      setBadges(badgesResult);
      setMemberProgress(progressResult);
      setAchievements(achievementsResult);
      setCategoryOptions(categoriesResult.map((category) => ({ id: category.id, name: category.name })));
      setMemberOptions(memberOptionsResult);
      setViewState('ready');
    } catch {
      setViewState('error');
    }
    // `canRecord` is derived from the session role and never changes within a mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const inProgressCount = memberProgress
    .flatMap((member) => member.badges)
    .filter((record) => record.status === 'in_progress').length;
  const earnedCount = memberProgress
    .flatMap((member) => member.badges)
    .filter((record) => record.status === 'earned').length;
  const verifiedCount = memberProgress
    .flatMap((member) => member.badges)
    .filter((record) => record.status === 'verified').length;

  async function handleCreateBadge(values: BadgeFormValues) {
    await createBadge(values);
    showToast('Badge added to the catalog.', 'success');
    await fetchAll();
  }

  async function handleUpdateBadge(badgeId: string, values: BadgeFormValues) {
    await updateBadge(badgeId, values);
    showToast('Badge updated.', 'success');
    await fetchAll();
  }

  async function handleDeleteBadge(badgeId: string) {
    await deleteBadge(badgeId);
    showToast('Badge deleted.', 'success');
    await fetchAll();
  }

  async function handleRecordBadge(values: RecordBadgeFormValues) {
    await recordMemberBadge(values);
    setIsRecordModalOpen(false);
    showToast('Badge progress recorded.', 'success');
    await fetchAll();
  }

  async function handleVerify(memberBadgeId: string) {
    setVerifyingId(memberBadgeId);
    try {
      await verifyMemberBadge(memberBadgeId);
      showToast('Badge verified.', 'success');
      await fetchAll();
    } finally {
      setVerifyingId(null);
    }
  }

  async function handleCreateAchievement(values: AchievementFormValues) {
    await createAchievement(values);
    showToast('Achievement recorded.', 'success');
    await fetchAll();
  }

  return (
    <div>
      <div className="mb-5 grid grid-cols-1 gap-3.5 xs:grid-cols-2 lg2:grid-cols-4">
        <StatCard icon={BadgeIcon} value={badges.length} label="Badge Catalog" tone="green" />
        <StatCard icon={ClockIcon} value={inProgressCount} label="In Progress" tone="blue" />
        <StatCard icon={SuccessIcon} value={earnedCount} label="Earned" tone="gold" />
        <StatCard icon={ApprovalIcon} value={verifiedCount} label="Verified" tone="red" />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs items={BADGE_TABS} activeId={activeTab} onChange={(id) => setActiveTab(id as BadgeTabId)} ariaLabel="Badge sections" />
        {canRecord ? (
          <Button
            className="shrink-0"
            leadingIcon={<AddIcon aria-hidden />}
            onClick={() => setIsRecordModalOpen(true)}
          >
            Record Badge
          </Button>
        ) : null}
      </div>

      {activeTab === 'catalog' ? (
        <BadgeCatalogPanel
          viewState={viewState}
          badges={badges}
          categoryOptions={categoryOptions}
          canManage={canManageCatalog}
          onRetry={fetchAll}
          onCreate={handleCreateBadge}
          onUpdate={handleUpdateBadge}
          onDelete={handleDeleteBadge}
        />
      ) : null}

      {activeTab === 'progress' ? (
        <MemberProgressPanel
          viewState={viewState}
          members={memberProgress}
          canVerify={canVerify}
          onRetry={fetchAll}
          onVerify={handleVerify}
          verifyingId={verifyingId}
        />
      ) : null}

      {activeTab === 'achievements' ? (
        <AchievementHistoryPanel
          viewState={viewState}
          achievements={achievements}
          memberOptions={memberOptions}
          canRecord={canRecord}
          onRetry={fetchAll}
          onCreate={handleCreateAchievement}
        />
      ) : null}

      {canRecord ? (
        <RecordBadgeModal
          isOpen={isRecordModalOpen}
          memberOptions={memberOptions}
          badgeOptions={badges}
          onClose={() => setIsRecordModalOpen(false)}
          onSubmit={handleRecordBadge}
        />
      ) : null}
    </div>
  );
}
