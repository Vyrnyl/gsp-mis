'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { listExpenseCategories } from '@/features/finance/services/finance.service';
import { MEMBER_STATUS_LABELS } from '@/features/members/constants';
import {
  listActivityCategories,
  listBadgeCategories,
  listSchools,
  listScoutLevels,
  listTroops,
} from '@/features/organizations/services/organizations.service';
import { Tabs, type SelectOption } from '@/shared/components/ui';

import {
  ALL_TROOPS,
  ANALYTICS_TABS,
  DEFAULT_DATE_RANGE,
  EMPTY_DIMENSION_FILTERS,
  TAB_DIMENSION_FILTERS,
} from '../constants';
import { getAnalyticsOverview } from '../services/analytics.service';
import type { AnalyticsFilters, AnalyticsSnapshot, AnalyticsTabId, ViewState } from '../types';
import { AnalyticsFiltersBar } from './analytics-filters-bar';
import { TabFiltersBar, type DimensionOptions } from './tab-filters-bar';
import { AttendanceTrendsPanel } from './attendance-trends-panel';
import { BadgeCompletionPanel } from './badge-completion-panel';
import { BreakdownPanel } from './breakdown-panel';
import { DecisionSupportPanel } from './decision-support-panel';
import { FinancialTrendsPanel } from './financial-trends-panel';
import { MembershipTrendsPanel } from './membership-trends-panel';
import { OrganizationPerformancePanel } from './organization-performance-panel';
import { ParticipationPanel } from './participation-panel';

/**
 * Loop steps 3–4 (Contract + Wire Read) for feature 3.3. One combined fetch drives
 * every tab (no per-tab pagination or writes — analytics is read-only), so the view
 * owns a single `viewState`/`snapshot` pair shared across all panels rather than
 * one per tab. Whole page is `analytics:read` (Admin + Executive Council) gated at
 * the route, so unlike Reports there is no per-tab role variance to branch on here —
 * no props are needed.
 *
 * 2026-09-02 revision: page-level date-range + troop filters. They live here rather
 * than in each panel because that same single shared fetch is what they re-trigger.
 *
 * 2026-09-16 revision: Decisions and Breakdown tabs. Decisions is the default landing
 * tab — it answers "what needs a decision?", and the aggregate tabs are the evidence
 * behind it, so leading with the summary rather than with raw membership counts.
 */
export function AnalyticsView() {
  const [activeTab, setActiveTab] = useState<AnalyticsTabId>('decisions');
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    range: DEFAULT_DATE_RANGE,
    troopId: ALL_TROOPS,
    ...EMPTY_DIMENSION_FILTERS,
  });
  const [troopOptions, setTroopOptions] = useState<SelectOption[] | null>(null);
  const [dimensionOptions, setDimensionOptions] = useState<DimensionOptions>({
    schoolId: null,
    scoutLevelId: null,
    activityCategoryId: null,
    badgeCategoryId: null,
    expenseCategoryId: null,
    // Membership status is a fixed vocabulary, not a fetched list — available
    // immediately, so it never renders in the loading-disabled state.
    status: Object.entries(MEMBER_STATUS_LABELS).map(([value, label]) => ({ value, label })),
  });

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

  // Dimension option lists for the per-tab filters (2026-09-16 R4 revision). All four
  // `/organizations/*` lists plus finance's expense categories are read-only and
  // `anyRole`, so both roles that can reach Analytics can populate them.
  //
  // Settled independently per list rather than in one `Promise.all`: a failure in one
  // leaves only that filter empty instead of disabling all five, and the analytics
  // data itself is unaffected either way.
  useEffect(() => {
    const load = (
      key: keyof DimensionOptions,
      fetcher: () => Promise<{ id: string; name: string }[]>,
    ) => {
      fetcher()
        .then((items) =>
          setDimensionOptions((current) => ({
            ...current,
            [key]: items.map((item) => ({ value: item.id, label: item.name })),
          })),
        )
        .catch(() => setDimensionOptions((current) => ({ ...current, [key]: [] })));
    };

    load('schoolId', listSchools);
    load('scoutLevelId', listScoutLevels);
    load('activityCategoryId', listActivityCategories);
    load('badgeCategoryId', listBadgeCategories);
    load('expenseCategoryId', listExpenseCategories);
  }, []);

  const onRetry = fetchOverview;

  const isOrganizationTab = activeTab === 'organization';
  const isFinancialTab = activeTab === 'financial';

  const troopFilterNote = useMemo(() => {
    if (isOrganizationTab) return 'This tab compares all troops.';
    if (isFinancialTab) return 'Council finances are not troop-specific.';
    return null;
  }, [isOrganizationTab, isFinancialTab]);

  /**
   * Stated where a tab's filters apply unevenly to the cards beneath them, rather than
   * left for a reader to infer from a figure that did not move.
   *
   * On Financial the asymmetry is real and in the schema. School narrows *both* sides
   * (`Payment` reaches a school through the member who paid, and `Expense` has carried
   * its own `schoolId` since the 2026-09-16 attribution migration), but activity type
   * and expense category exist only on the spending side — a payment is not made
   * "for" an activity. Filtering by either therefore shrinks expenses while income
   * stays whole, and the Net figure beneath turns into a surplus that does not exist:
   * live data shows ₱2,150 income against ₱0 expenses under one category filter.
   * Saying so is the difference between a caveat and a wrong number.
   */
  const tabFilterNote = useMemo(() => {
    if (!isFinancialTab) return null;
    return 'The activity and expense-category filters narrow spending only — income is not recorded against either, so Net will overstate the balance while one is applied. The school filter narrows both sides.';
  }, [isFinancialTab]);

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

      {/* Per-tab dimension filters (2026-09-16 R4 revision). Rendered from one shared
          component so every tab's bar behaves identically; `TAB_DIMENSION_FILTERS`
          decides which dimensions a given tab exposes, and a tab with none (Decisions,
          Organization) renders no bar at all. */}
      <TabFiltersBar
        dimensions={TAB_DIMENSION_FILTERS[activeTab] ?? []}
        filters={filters}
        onChange={(dimensions) => setFilters((current) => ({ ...current, ...dimensions }))}
        options={dimensionOptions}
        note={tabFilterNote}
      />

      {activeTab === 'decisions' ? (
        <DecisionSupportPanel viewState={viewState} data={snapshot?.decisionSupport ?? null} onRetry={onRetry} />
      ) : null}

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

      {activeTab === 'breakdown' ? (
        <BreakdownPanel viewState={viewState} data={snapshot?.breakdown ?? null} onRetry={onRetry} />
      ) : null}
    </div>
  );
}
