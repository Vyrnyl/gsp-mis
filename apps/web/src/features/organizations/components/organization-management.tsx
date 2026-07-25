'use client';

import { useCallback, useEffect, useState } from 'react';

import { ActivityIcon, BadgeIcon, ScoutLevelIcon } from '@/shared/components/icons';
import { TabPanel, Tabs } from '@/shared/components/ui';

import { ORGANIZATION_TABS } from '../constants';
import * as organizationsService from '../services/organizations.service';
import type { CategoryItem, Council, OrganizationTabId, Troop, TroopLeaderOption, ViewState } from '../types';
import { CategoryPanel } from './category-panel';
import { CouncilsPanel } from './councils-panel';
import { TroopsPanel } from './troops-panel';

export interface OrganizationManagementProps {
  canManage: boolean;
}

/** Fetches once on mount and exposes a `refetch` for post-mutation refresh (settled decision #3: refetch, not optimistic updates). */
function useResourceList<T>(fetcher: () => Promise<T[]>) {
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [items, setItems] = useState<T[]>([]);

  const refetch = useCallback(async () => {
    setViewState('loading');
    try {
      setItems(await fetcher());
      setViewState('ready');
    } catch {
      setViewState('error');
    }
  }, [fetcher]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { viewState, items, refetch } as const;
}

export function OrganizationManagement({ canManage }: OrganizationManagementProps) {
  const [activeTab, setActiveTab] = useState<OrganizationTabId>('councils');

  const councils = useResourceList<Council>(organizationsService.listCouncils);
  const troops = useResourceList<Troop>(organizationsService.listTroops);
  const troopLeaders = useResourceList<TroopLeaderOption>(organizationsService.listTroopLeaders);
  const scoutLevels = useResourceList<CategoryItem>(organizationsService.listScoutLevels);
  const badgeCategories = useResourceList<CategoryItem>(organizationsService.listBadgeCategories);
  const activityCategories = useResourceList<CategoryItem>(organizationsService.listActivityCategories);

  return (
    <div>
      <Tabs
        items={ORGANIZATION_TABS}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as OrganizationTabId)}
        ariaLabel="Organization sections"
      />

      {activeTab === 'councils' ? (
        <TabPanel id="councils">
          <CouncilsPanel
            viewState={councils.viewState}
            councils={councils.items}
            canManage={canManage}
            onRetry={councils.refetch}
            onCreate={async (values) => {
              await organizationsService.createCouncil(values);
              await councils.refetch();
            }}
            onUpdate={async (id, values) => {
              await organizationsService.updateCouncil(id, values);
              await councils.refetch();
            }}
            onDelete={async (id) => {
              await organizationsService.deleteCouncil(id);
              await councils.refetch();
            }}
          />
        </TabPanel>
      ) : null}

      {activeTab === 'troops' ? (
        <TabPanel id="troops">
          <TroopsPanel
            viewState={troops.viewState}
            troops={troops.items}
            councils={councils.items}
            leaderOptions={troopLeaders.items}
            canManage={canManage}
            onRetry={troops.refetch}
            onCreate={async (values) => {
              await organizationsService.createTroop(values);
              await troops.refetch();
              await councils.refetch();
            }}
            onUpdate={async (id, values) => {
              await organizationsService.updateTroop(id, values);
              await troops.refetch();
              await councils.refetch();
            }}
            onDelete={async (id) => {
              await organizationsService.deleteTroop(id);
              await troops.refetch();
              await councils.refetch();
            }}
          />
        </TabPanel>
      ) : null}

      {activeTab === 'scout-levels' ? (
        <TabPanel id="scout-levels">
          <CategoryPanel
            viewState={scoutLevels.viewState}
            title="Scout Levels"
            itemNoun="Scout Level"
            itemNounPlural="Scout Levels"
            icon={ScoutLevelIcon}
            items={scoutLevels.items}
            showOrder
            usageLabel="Members"
            canManage={canManage}
            onRetry={scoutLevels.refetch}
            onCreate={async (values) => {
              await organizationsService.createScoutLevel(values);
              await scoutLevels.refetch();
            }}
            onUpdate={async (id, values) => {
              await organizationsService.updateScoutLevel(id, values);
              await scoutLevels.refetch();
            }}
            onDelete={async (id) => {
              await organizationsService.deleteScoutLevel(id);
              await scoutLevels.refetch();
            }}
          />
        </TabPanel>
      ) : null}

      {activeTab === 'badge-categories' ? (
        <TabPanel id="badge-categories">
          <CategoryPanel
            viewState={badgeCategories.viewState}
            title="Badge Categories"
            itemNoun="Badge Category"
            itemNounPlural="Badge Categories"
            icon={BadgeIcon}
            items={badgeCategories.items}
            showOrder={false}
            showIcon
            usageLabel="Badges"
            canManage={canManage}
            onRetry={badgeCategories.refetch}
            onCreate={async (values) => {
              await organizationsService.createBadgeCategory(values);
              await badgeCategories.refetch();
            }}
            onUpdate={async (id, values) => {
              await organizationsService.updateBadgeCategory(id, values);
              await badgeCategories.refetch();
            }}
            onDelete={async (id) => {
              await organizationsService.deleteBadgeCategory(id);
              await badgeCategories.refetch();
            }}
          />
        </TabPanel>
      ) : null}

      {activeTab === 'activity-categories' ? (
        <TabPanel id="activity-categories">
          <CategoryPanel
            viewState={activityCategories.viewState}
            title="Activity Categories"
            itemNoun="Activity Category"
            itemNounPlural="Activity Categories"
            icon={ActivityIcon}
            items={activityCategories.items}
            showOrder={false}
            usageLabel="Events"
            canManage={canManage}
            onRetry={activityCategories.refetch}
            onCreate={async (values) => {
              await organizationsService.createActivityCategory(values);
              await activityCategories.refetch();
            }}
            onUpdate={async (id, values) => {
              await organizationsService.updateActivityCategory(id, values);
              await activityCategories.refetch();
            }}
            onDelete={async (id) => {
              await organizationsService.deleteActivityCategory(id);
              await activityCategories.refetch();
            }}
          />
        </TabPanel>
      ) : null}
    </div>
  );
}
