'use client';

import { useCallback, useEffect, useState } from 'react';

import type { AuthUser } from '@/features/auth/types';

import { getDashboard, type DashboardResponse } from '../services/dashboard.service';
import type { AdminDashboardData, CouncilDashboardData, DashboardViewState, TroopDashboardData } from '../types';

import { AdminDashboard } from './admin-dashboard';
import { CouncilDashboard } from './council-dashboard';
import { TroopLeaderDashboard } from './troop-leader-dashboard';

const EMPTY_ADMIN: AdminDashboardData = { stats: [], growth: [], statusBreakdown: [], recentActivity: [], troops: [] };
const EMPTY_COUNCIL: CouncilDashboardData = { stats: [], troops: [], scoutLevelBreakdown: [] };
const EMPTY_TROOP: TroopDashboardData = { troopName: '', troopCode: '', stats: [], roster: [], scoutLevelBreakdown: [] };

export interface DashboardViewProps {
  user: AuthUser;
}

/**
 * Wire Read (Loop step 4, Feature 1.5). Fetches `GET /api/dashboard` once on mount —
 * the role is whatever the session/JWT says server-side (settled decision #4), never
 * chosen here. `data` starts as an empty placeholder of the right shape so each role
 * component never has to handle `null` — while `state` is `loading`/`error` it never
 * reads `data` anyway (mirrors `MemberDirectory`'s `loading | error | ready` convention).
 */
export function DashboardView({ user }: DashboardViewProps) {
  const [state, setState] = useState<DashboardViewState>('loading');
  const [data, setData] = useState<DashboardResponse | null>(null);

  const fetchDashboard = useCallback(async () => {
    setState('loading');
    try {
      const result = await getDashboard();
      setData(result);
      setState('ready');
    } catch {
      setState('error');
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (user.role === 'admin') {
    return (
      <AdminDashboard
        state={state}
        data={data?.role === 'admin' ? data : EMPTY_ADMIN}
        onRetry={fetchDashboard}
      />
    );
  }

  if (user.role === 'executive_council') {
    return (
      <CouncilDashboard
        state={state}
        data={data?.role === 'executive_council' ? data : EMPTY_COUNCIL}
        onRetry={fetchDashboard}
      />
    );
  }

  return (
    <TroopLeaderDashboard
      state={state}
      data={data?.role === 'troop_leader' ? data : EMPTY_TROOP}
      onRetry={fetchDashboard}
    />
  );
}
