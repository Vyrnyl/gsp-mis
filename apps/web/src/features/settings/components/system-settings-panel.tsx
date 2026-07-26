'use client';

import { useEffect, useState } from 'react';

import { Button, Card, CardHeader, CardSkeleton, ErrorState, FormField, Input } from '@/shared/components/ui';

import type { SystemSettingsFormValues, ViewState } from '../types';

export interface SystemSettingsPanelProps {
  viewState: ViewState;
  values: SystemSettingsFormValues;
  isSaving: boolean;
  onRetry: () => void;
  onSave: (values: SystemSettingsFormValues) => Promise<void>;
}

/**
 * One row per real `system_settings` key (build-plan.md §3.4) — General/Membership/
 * Notifications groups, replacing the prototype's `.settings-section`/`.settings-row`
 * with `Card`/`FormField`/`ToggleSwitch` so the section gets the same label↔control
 * wiring and focus ring every other form in the app has.
 */
export function SystemSettingsPanel({ viewState, values, isSaving, onRetry, onSave }: SystemSettingsPanelProps) {
  const [draft, setDraft] = useState<SystemSettingsFormValues>(values);

  useEffect(() => {
    setDraft(values);
  }, [values]);

  function set<K extends keyof SystemSettingsFormValues>(key: K, value: SystemSettingsFormValues[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  const isDirty = JSON.stringify(draft) !== JSON.stringify(values);

  if (viewState === 'error') {
    return <ErrorState onRetry={onRetry} description="We could not load system settings. Check your connection and try again." />;
  }

  if (viewState === 'loading') {
    return (
      <div className="space-y-5">
        <Card>
          <CardSkeleton lines={2} />
        </Card>
        <Card>
          <CardSkeleton lines={3} />
        </Card>
        <Card>
          <CardSkeleton lines={1} />
        </Card>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave(draft);
      }}
      className="space-y-5"
    >
      <Card>
        <CardHeader title="General" subtitle="Portal identity shown in headers and generated reports" />
        <FormField label="Organization Name" required>
          <Input
            value={draft.organizationName}
            onChange={(event) => set('organizationName', event.target.value)}
            required
          />
        </FormField>
      </Card>

      <Card>
        <CardHeader title="Membership" subtitle="Applies to every new and renewing membership term" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Membership Term (months)" required>
            <Input
              type="number"
              min={1}
              value={draft.membershipTermMonths}
              onChange={(event) => set('membershipTermMonths', Number(event.target.value))}
              required
            />
          </FormField>
          <FormField label="Renewal Window (days)" hint="How early a member may renew before their term ends" required>
            <Input
              type="number"
              min={0}
              value={draft.renewalWindowDays}
              onChange={(event) => set('renewalWindowDays', Number(event.target.value))}
              required
            />
          </FormField>
        </div>
      </Card>

      {/* Notifications card (Email Notifications toggle) hidden for now (2026-07-26) —
          the setting isn't wired to any real send path yet (announcements only write
          in-app Notification rows). `draft`/`values` still carry `emailNotificationsEnabled`
          unchanged, so restoring this card is the only step needed to bring it back. */}

      <div className="flex justify-end gap-2.5">
        <Button type="button" variant="gray" disabled={!isDirty || isSaving} onClick={() => setDraft(values)}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSaving} disabled={!isDirty}>
          Save Changes
        </Button>
      </div>
    </form>
  );
}
