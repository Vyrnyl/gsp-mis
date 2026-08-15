'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';

import { Alert, Button, FormField, Input, Modal, Select, Textarea } from '@/shared/components/ui';

import { EMPTY_MEMBER_FORM_VALUES, GENDER_OPTIONS, MEMBER_TYPE_OPTIONS } from '../constants';
import { MembersRequestError } from '../services/members.service';
import type { MemberFormValues, SchoolOption, ScoutLevelOption, TroopOption } from '../types';

export interface MemberFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialValues?: MemberFormValues;
  troopOptions: TroopOption[];
  scoutLevelOptions: ScoutLevelOption[];
  schoolOptions: SchoolOption[];
  /**
   * Locks the Troop field to a single troop — set for a signed-in Troop Leader (their
   * own led troop, or `null` if they have none yet). The API enforces this
   * server-side regardless; this just keeps the picker from offering a choice that
   * would only come back as a 403.
   */
  restrictToTroopId?: string | null;
  onClose: () => void;
  onSubmit: (values: MemberFormValues) => Promise<void>;
}

type FieldErrors = Partial<Record<keyof MemberFormValues, string>>;

/**
 * One modal handles both registration types (build-plan.md §1.3) — the Scout Level
 * field only appears for `memberType: 'scout'`. Troop/scout-level options come from
 * the real `/api/organizations/*` lookups (fetched once by `MemberDirectory`), not a
 * fixed mock list — the org hierarchy itself is still 1.6's to manage.
 */
export function MemberFormModal({
  isOpen,
  mode,
  initialValues,
  troopOptions,
  scoutLevelOptions,
  schoolOptions,
  restrictToTroopId,
  onClose,
  onSubmit,
}: MemberFormModalProps) {
  const isRestricted = restrictToTroopId !== undefined;
  const [values, setValues] = useState<MemberFormValues>(initialValues ?? EMPTY_MEMBER_FORM_VALUES);
  const [snapshot, setSnapshot] = useState<MemberFormValues>(initialValues ?? EMPTY_MEMBER_FORM_VALUES);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /**
   * Resets only on the closed→open transition, not on every re-render while the modal
   * stays open — `initialValues` is a fresh object from the parent each render, so
   * keying the reset off its identity would wipe out in-progress edits whenever the
   * parent re-renders for an unrelated reason (e.g. a background refetch resolving).
   */
  const wasOpen = useRef(false);
  useEffect(() => {
    if (isOpen && !wasOpen.current) {
      const next = initialValues ?? EMPTY_MEMBER_FORM_VALUES;
      const resetValues =
        mode === 'create' && isRestricted ? { ...next, troopId: restrictToTroopId ?? '' } : next;
      setValues(resetValues);
      setSnapshot(resetValues);
      setSubmitAttempted(false);
      setSubmitError(null);
      setIsSubmitting(false);
    }
    wasOpen.current = isOpen;
  }, [isOpen, initialValues, mode, isRestricted, restrictToTroopId]);

  function set<K extends keyof MemberFormValues>(key: K, value: MemberFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  const isDirty = JSON.stringify(values) !== JSON.stringify(snapshot);
  const isScout = values.memberType === 'scout';
  const availableTroopOptions = isRestricted
    ? troopOptions.filter((troop) => troop.id === restrictToTroopId)
    : troopOptions;
  const troopSelectOptions = availableTroopOptions.map((troop) => ({
    value: troop.id,
    label: `${troop.troopCode} — ${troop.name}`,
  }));
  const scoutLevelSelectOptions = scoutLevelOptions.map((level) => ({ value: level.id, label: level.name }));

  /** Schools are scoped to a council, same as the troop picker — filtered to the selected troop's own council. */
  const selectedTroopCouncilId = troopOptions.find((troop) => troop.id === values.troopId)?.councilId;
  const availableSchoolOptions = selectedTroopCouncilId
    ? schoolOptions.filter((school) => school.councilId === selectedTroopCouncilId)
    : [];
  const schoolSelectOptions = availableSchoolOptions.map((school) => ({ value: school.id, label: school.name }));

  function handleTroopChange(troopId: string) {
    const nextCouncilId = troopOptions.find((troop) => troop.id === troopId)?.councilId;
    const currentSchoolStillValid = schoolOptions.some(
      (school) => school.id === values.schoolId && school.councilId === nextCouncilId,
    );
    setValues((current) => ({
      ...current,
      troopId,
      schoolId: currentSchoolStillValid ? current.schoolId : '',
    }));
  }

  const errors: FieldErrors = submitAttempted
    ? {
        firstName: values.firstName.trim() ? undefined : 'First name is required.',
        lastName: values.lastName.trim() ? undefined : 'Last name is required.',
        birthDate: values.birthDate ? undefined : 'Birthdate is required.',
        troopId: values.troopId ? undefined : 'Troop is required.',
        scoutLevelId: isScout && !values.scoutLevelId ? 'Scout level is required.' : undefined,
      }
    : {};

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);
    setSubmitError(null);

    const hasError = Object.values({
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      birthDate: values.birthDate,
      troopId: values.troopId,
      scoutLevelId: isScout ? values.scoutLevelId : 'n/a',
    }).some((value) => !value);
    if (hasError) return;

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setIsSubmitting(false);
      setSubmitError(err instanceof MembersRequestError ? err.message : 'Something went wrong. Please try again.');
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Register New Member' : 'Edit Member'}
      size="lg"
      dismissible={!isSubmitting}
      footer={
        <>
          <Button variant="gray" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="member-form" isLoading={isSubmitting} disabled={!isDirty || isSubmitting}>
            {mode === 'create' ? 'Register Member' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <form id="member-form" onSubmit={handleSubmit} noValidate>
        {submitError ? <Alert tone="error">{submitError}</Alert> : null}

        <FormField label="Member Type" required>
          <Select
            options={[...MEMBER_TYPE_OPTIONS]}
            value={values.memberType}
            disabled={mode === 'edit'}
            onChange={(event) =>
              set('memberType', event.target.value as MemberFormValues['memberType'])
            }
          />
        </FormField>

        {mode === 'edit' ? (
          <p className="-mt-2 mb-4 text-[0.8rem] text-muted">
            Member type can&apos;t change after registration.
          </p>
        ) : (
          <p className="-mt-2 mb-4 text-[0.8rem] text-muted">
            New registrations start as <strong>Pending Review</strong> until an Administrator or
            Executive Council member approves them.
          </p>
        )}

        <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
          <FormField label="First Name" required error={errors.firstName}>
            <Input value={values.firstName} onChange={(event) => set('firstName', event.target.value)} />
          </FormField>
          <FormField label="Middle Name" hint="Optional">
            <Input value={values.middleName} onChange={(event) => set('middleName', event.target.value)} />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
          <FormField label="Last Name" required error={errors.lastName}>
            <Input value={values.lastName} onChange={(event) => set('lastName', event.target.value)} />
          </FormField>
          <FormField label="Gender">
            <Select
              options={GENDER_OPTIONS}
              value={values.gender}
              onChange={(event) => set('gender', event.target.value as MemberFormValues['gender'])}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
          <FormField label="Birthdate" required error={errors.birthDate}>
            <Input type="date" value={values.birthDate} onChange={(event) => set('birthDate', event.target.value)} />
          </FormField>
          <FormField
            label="Troop"
            required
            error={errors.troopId}
            hint={isRestricted ? 'Locked to your own troop.' : undefined}
          >
            <Select
              options={troopSelectOptions}
              placeholder={isRestricted && !restrictToTroopId ? 'No troop assigned to you yet' : 'Select troop'}
              value={values.troopId}
              disabled={isRestricted}
              onChange={(event) => handleTroopChange(event.target.value)}
            />
          </FormField>
        </div>

        <FormField
          label="School"
          hint={
            values.troopId
              ? 'Optional — filtered to the selected troop’s council'
              : 'Optional — select a troop first'
          }
        >
          <Select
            options={schoolSelectOptions}
            placeholder={values.troopId ? 'No school affiliation' : 'Select a troop first'}
            value={values.schoolId}
            disabled={!values.troopId}
            onChange={(event) => set('schoolId', event.target.value)}
          />
        </FormField>

        {isScout ? (
          <FormField label="Scout Level" required error={errors.scoutLevelId}>
            <Select
              options={scoutLevelSelectOptions}
              placeholder="Select scout level"
              value={values.scoutLevelId}
              onChange={(event) => set('scoutLevelId', event.target.value)}
            />
          </FormField>
        ) : null}

        <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
          <FormField label="Email" hint="Optional">
            <Input type="email" value={values.email} onChange={(event) => set('email', event.target.value)} />
          </FormField>
          <FormField label="Phone Number" hint="Optional">
            <Input value={values.phoneNumber} onChange={(event) => set('phoneNumber', event.target.value)} />
          </FormField>
        </div>

        <FormField label="Home Address" hint="Optional">
          <Input value={values.address} onChange={(event) => set('address', event.target.value)} />
        </FormField>

        <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
          <FormField label="Emergency Contact Name" hint="Optional">
            <Input
              value={values.emergencyContactName}
              onChange={(event) => set('emergencyContactName', event.target.value)}
            />
          </FormField>
          <FormField label="Emergency Contact Phone" hint="Optional">
            <Input
              value={values.emergencyContactPhone}
              onChange={(event) => set('emergencyContactPhone', event.target.value)}
            />
          </FormField>
        </div>

        <FormField label="Notes" hint="Optional — visible to Council and troop leaders">
          <Textarea rows={3} value={values.notes} onChange={(event) => set('notes', event.target.value)} />
        </FormField>
      </form>
    </Modal>
  );
}
