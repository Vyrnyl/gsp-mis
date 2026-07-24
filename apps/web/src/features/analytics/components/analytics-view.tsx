'use client';

import { useCallback, useEffect, useState } from 'react';

import { Tabs } from '@/shared/components/ui';

import { ANALYTICS_TABS } from '../constants';
import { getAnalyticsOverview } from '../services/analytics.service';
import type { AnalyticsSnapshot, AnalyticsTabId, ViewState } from '../types';
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
 */
export function AnalyticsView() {
  const [activeTab, setActiveTab] = useState<AnalyticsTabId>('membership');
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null);

  const fetchOverview = useCallback(async () => {
    setViewState('loading');
    try {
      setSnapshot(await getAnalyticsOverview());
      setViewState('ready');
    } catch {
      setViewState('error');
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const onRetry = fetchOverview;

  return (
    <div>
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
