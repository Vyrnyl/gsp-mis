'use client';

import { useCallback, useEffect, useState } from 'react';

import type { AuthUser } from '@/features/auth/types';
import { Tabs, useToast } from '@/shared/components/ui';

import { SETTINGS_TABS } from '../constants';
import {
  createUser,
  deleteUser,
  getBackupInfo,
  getSystemSettings,
  listAuditLogs,
  listUsers,
  resetUserPassword,
  runBackup,
  setUserStatus,
  SettingsRequestError,
  updateSystemSettings,
  updateUser,
} from '../services/settings.service';
import type {
  AuditLogEntry,
  BackupInfo,
  CreateUserFormValues,
  PortalUserSummary,
  SettingsTabId,
  SystemSettingsFormValues,
  UserFilter,
  UserFormValues,
  ViewState,
} from '../types';
import { AuditLogPanel } from './audit-log-panel';
import { BackupsPanel } from './backups-panel';
import { SystemSettingsPanel } from './system-settings-panel';
import { UsersPanel } from './users-panel';

const PAGE_SIZE = 8;
const SEARCH_DEBOUNCE_MS = 300;

export interface SettingsViewProps {
  user: AuthUser;
}

/**
 * Feature 3.4 — Settings & System Administration. Contract + Wire Read + Wire Write
 * (Loop steps 3-5) built together, matching every prior Phase 3 feature. Every tab is
 * Administrator-only (`users:manage`/`settings:manage`/`audit-logs:read`, all granted
 * to `admin` alone in `shared/constants/roles.ts`) — the page itself is already gated
 * by the `settings:manage` nav/route permission, so no per-tab role branching is
 * needed inside this view, unlike badges/finance/reports.
 */
export function SettingsView({ user }: SettingsViewProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTabId>('system');

  // System settings
  const [settingsState, setSettingsState] = useState<ViewState>('loading');
  const [settingsValues, setSettingsValues] = useState<SystemSettingsFormValues | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const fetchSettings = useCallback(async () => {
    setSettingsState('loading');
    try {
      const result = await getSystemSettings();
      setSettingsValues(result);
      setSettingsState('ready');
    } catch {
      setSettingsState('error');
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  async function handleSaveSettings(values: SystemSettingsFormValues) {
    setIsSavingSettings(true);
    try {
      const saved = await updateSystemSettings(values);
      setSettingsValues(saved);
      showToast('Settings saved.', 'success');
    } catch (err) {
      showToast(err instanceof SettingsRequestError ? err.message : 'Could not save settings.', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  }

  // Users
  const [usersState, setUsersState] = useState<ViewState>('loading');
  const [users, setUsers] = useState<PortalUserSummary[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [userSearch, setUserSearch] = useState('');
  const [debouncedUserSearch, setDebouncedUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<UserFilter>('all');
  const [userPage, setUserPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedUserSearch(userSearch), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [userSearch]);

  useEffect(() => setUserPage(1), [debouncedUserSearch, userRoleFilter]);

  const fetchUsers = useCallback(async () => {
    setUsersState('loading');
    try {
      const result = await listUsers({
        search: debouncedUserSearch || undefined,
        role: userRoleFilter,
        page: userPage,
        pageSize: PAGE_SIZE,
      });
      const totalPages = Math.max(1, Math.ceil(result.totalItems / PAGE_SIZE));
      if (userPage > totalPages) {
        // Deleting the last row on a page beyond the first shrinks totalPages
        // below the current page — clamp back instead of showing an empty page.
        setUserPage(totalPages);
        return;
      }
      setUsers(result.items);
      setUsersTotal(result.totalItems);
      setUsersState('ready');
    } catch {
      setUsersState('error');
    }
  }, [debouncedUserSearch, userRoleFilter, userPage]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleCreateUser(values: CreateUserFormValues) {
    const created = await createUser(values);
    showToast(`${created.fullName} added.`, 'success');
    await fetchUsers();
  }

  async function handleUpdateUser(id: string, values: UserFormValues) {
    await updateUser(id, values);
    showToast('User updated.', 'success');
    await fetchUsers();
  }

  async function handleToggleStatus(id: string, nextIsActive: boolean) {
    await setUserStatus(id, nextIsActive);
    showToast(nextIsActive ? 'User activated.' : 'User deactivated.', 'success');
    await fetchUsers();
  }

  async function handleResetPassword(id: string): Promise<string> {
    const temporaryPassword = await resetUserPassword(id);
    return temporaryPassword;
  }

  async function handleDeleteUser(id: string) {
    await deleteUser(id);
    showToast('User deleted.', 'success');
    await fetchUsers();
  }

  // Audit log
  const [auditState, setAuditState] = useState<ViewState>('loading');
  const [auditEntries, setAuditEntries] = useState<AuditLogEntry[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditSearch, setAuditSearch] = useState('');
  const [debouncedAuditSearch, setDebouncedAuditSearch] = useState('');
  const [auditEntityFilter, setAuditEntityFilter] = useState('all');
  const [auditPage, setAuditPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedAuditSearch(auditSearch), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [auditSearch]);

  useEffect(() => setAuditPage(1), [debouncedAuditSearch, auditEntityFilter]);

  const fetchAuditLog = useCallback(async () => {
    setAuditState('loading');
    try {
      const result = await listAuditLogs({
        search: debouncedAuditSearch || undefined,
        entityType: auditEntityFilter,
        page: auditPage,
        pageSize: PAGE_SIZE,
      });
      setAuditEntries(result.items);
      setAuditTotal(result.totalItems);
      setAuditState('ready');
    } catch {
      setAuditState('error');
    }
  }, [debouncedAuditSearch, auditEntityFilter, auditPage]);

  useEffect(() => {
    fetchAuditLog();
  }, [fetchAuditLog]);

  // Backups
  const [backupsState, setBackupsState] = useState<ViewState>('loading');
  const [backupInfo, setBackupInfo] = useState<BackupInfo | null>(null);
  const [recentBackups, setRecentBackups] = useState<AuditLogEntry[]>([]);
  const [isRunningBackup, setIsRunningBackup] = useState(false);

  const fetchBackups = useCallback(async () => {
    setBackupsState('loading');
    try {
      const [info, history] = await Promise.all([
        getBackupInfo(),
        listAuditLogs({ entityType: 'system', page: 1, pageSize: 5 }),
      ]);
      setBackupInfo(info);
      setRecentBackups(history.items);
      setBackupsState('ready');
    } catch {
      setBackupsState('error');
    }
  }, []);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  async function handleRunBackup() {
    setIsRunningBackup(true);
    try {
      await runBackup();
      showToast('Backup completed.', 'success');
      await fetchBackups();
      if (auditEntityFilter === 'all' || auditEntityFilter === 'system') await fetchAuditLog();
    } catch (err) {
      showToast(err instanceof SettingsRequestError ? err.message : 'Could not run backup.', 'error');
    } finally {
      setIsRunningBackup(false);
    }
  }

  return (
    <div>
      <Tabs
        items={SETTINGS_TABS}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as SettingsTabId)}
        ariaLabel="Settings sections"
        className="mb-4"
      />

      {activeTab === 'system' ? (
        <SystemSettingsPanel
          viewState={settingsState}
          values={settingsValues ?? { organizationName: '', membershipTermMonths: 12, renewalWindowDays: 30, emailNotificationsEnabled: true }}
          isSaving={isSavingSettings}
          onRetry={fetchSettings}
          onSave={handleSaveSettings}
        />
      ) : null}

      {activeTab === 'users' ? (
        <UsersPanel
          viewState={usersState}
          users={users}
          totalItems={usersTotal}
          page={userPage}
          pageSize={PAGE_SIZE}
          onPageChange={setUserPage}
          search={userSearch}
          onSearchChange={setUserSearch}
          roleFilter={userRoleFilter}
          onRoleFilterChange={setUserRoleFilter}
          currentUserId={user.id}
          onRetry={fetchUsers}
          onCreate={handleCreateUser}
          onUpdate={handleUpdateUser}
          onToggleStatus={handleToggleStatus}
          onResetPassword={handleResetPassword}
          onDelete={handleDeleteUser}
        />
      ) : null}

      {activeTab === 'audit' ? (
        <AuditLogPanel
          viewState={auditState}
          entries={auditEntries}
          totalItems={auditTotal}
          page={auditPage}
          pageSize={PAGE_SIZE}
          onPageChange={setAuditPage}
          search={auditSearch}
          onSearchChange={setAuditSearch}
          entityTypeFilter={auditEntityFilter}
          onEntityTypeFilterChange={setAuditEntityFilter}
          onRetry={fetchAuditLog}
        />
      ) : null}

      {activeTab === 'backups' ? (
        <BackupsPanel
          viewState={backupsState}
          backupInfo={backupInfo}
          recentBackups={recentBackups}
          isRunning={isRunningBackup}
          onRunBackup={handleRunBackup}
          onRetry={fetchBackups}
        />
      ) : null}
    </div>
  );
}
