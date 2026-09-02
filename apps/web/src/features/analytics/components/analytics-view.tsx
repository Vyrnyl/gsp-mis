'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { listTroops } from '@/features/organizations/services/organizations.service';
import { Tabs, type SelectOption } from '@/shared/components/ui';

import { ALL_TROOPS, ANALYTICS_TABS, DEFAULT_DATE_RANGE } from '../constants';
import { getAnalyticsOverview } from '../services/analytics.service';
import type { AnalyticsFilters, AnalyticsSnapshot, AnalyticsTabId, ViewState } from '../types';
import { AnalyticsFiltersBar } from './analytics-filters-bar';
import { AttendanceTrendsPanel } from './attendance-trends-panel';
import { BadgeCompletionPanel } from './badge-completion-panel';
import { FinancialTrendsPanel } from './financial-trends-panel';
import { MembershipTrendsPanel } from './membership-trends-panel';
import { OrganizationPerformancePanel } from './organization-performance-panel';
import { ParticipationPanel } from './participation-panel';

/**
 * Loop steps 3–4 (Contract + Wire Read) for feature 3.3. One combined fetch drives
 * every tab (no per-tab pagination or writes — analytics is read-only), so the view
 * owns a single `viewState`/`snapshot` pair shared across all six panels rather than
 * one per tab. Whole page is `analytics:read` (Admin + Executive Council) gated at
 * the route, so unlike Reports there is no per-tab role variance to branch on here —
 * no props are needed.
 *
 * 2026-09-02 revision: page-level date-range + troop filters. They live here rather
 * than in each panel because that same single shared fetch is what they re-trigger.
 */
export function AnalyticsView() {
  const [activeTab, setActiveTab] = useState<AnalyticsTabId>('membership');
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    range: DEFAULT_DATE_RANGE,
    troopId: ALL_TROOPS,
  });
  const [troopOptions, setTroopOptions] = useState<SelectOption[] | null>(null);

  const fetchOverview = useCallback(async () => {
    setViewState('loading');
    try {
      setSnapshot(await getAnalyticsOverview(filters));
      setViewState('ready');
    } catch {
      setViewState('error');
    }
  }, [filters]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Troop list for the filter — `/organizations/troops` is `anyRole`, so both roles
  // that can reach Analytics can populate it. A failure here leaves the filter
  // disabled rather than breaking the page: the analytics data itself is unaffected.
  useEffect(() => {
    listTroops()
      .then((troops) => setTroopOptions(troops.map((troop) => ({ value: troop.id, label: troop.name }))))
      .catch(() => setTroopOptions([]));
  }, []);

  const onRetry = fetchOverview;

  const isOrganizationTab = activeTab === 'organization';
  const isFinancialTab = activeTab === 'financial';

  const troopFilterNote = useMemo(() => {
    if (isOrganizationTab) return 'This tab compares all troops.';
    if (isFinancialTab) return 'Council finances are not troop-specific.';
    return null;
  }, [isOrganizationTab, isFinancialTab]);

  return (
    <div>
      <AnalyticsFiltersBar
        filters={filters}
        onChange={setFilters}
        troopOptions={troopOptions}
        isTroopFilterDisabled={isOrganizationTab || isFinancialTab}
        troopFilterNote={troopFilterNote}
      />

      <div className="mb-4">
        <Tabs items={ANALYTICS_TABS} activeId={activeTab} onChange={(id) => setActiveTab(id as AnalyticsTabId)} ariaLabel="Analytics sections" />
      </div>

      {activeTab === 'membership' ? (
        <MembershipTrendsPanel viewState={viewState} data={snapshot?.membership ?? null} onRetry={onRetry} />
      ) : null}

      {activeTab === 'attendance' ? (
        <AttendanceTrendsPanel viewState={viewState} data={snapshot?.attendance ?? null} onRetry={onRetry} />
      ) : null}

      {activeTab === 'participation' ? (
        <ParticipationPanel viewState={viewState} data={snapshot?.participation ?? null} onRetry={onRetry} />
      ) : null}

      {activeTab === 'badges' ? (
        <BadgeCompletionPanel viewState={viewState} data={snapshot?.badges ?? null} onRetry={onRetry} />
      ) : null}

      {activeTab === 'financial' ? (
        <FinancialTrendsPanel viewState={viewState} data={snapshot?.financial ?? null} onRetry={onRetry} />
      ) : null}

      {activeTab === 'organization' ? (
        <OrganizationPerformancePanel viewState={viewState} data={snapshot?.organization ?? null} onRetry={onRetry} />
      ) : null}
    </div>
  );
}
