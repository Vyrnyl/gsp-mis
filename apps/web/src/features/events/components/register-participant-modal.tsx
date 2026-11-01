'use client';

import { useMemo, useState } from 'react';

import { AddIcon, MembersIcon } from '@/shared/components/icons';
import {
  Button,
  EmptyState,
  Modal,
  SearchInput,
  Skeleton,
  SkeletonRegion,
  TableAvatar,
} from '@/shared/components/ui';

import type { RegistrableMember } from '@/features/attendance/types';

export interface RegisterParticipantModalProps {
  isOpen: boolean;
  /** Members are still being fetched — `candidates` means nothing until this clears. */
  isLoading: boolean;
  /** Members not already actively registered for this event — the modal doesn't
   * re-check registration status itself, it only renders what it's given. */
  candidates: RegistrableMember[];
  registeringId: string | null;
  onClose: () => void;
  onRegister: (member: RegistrableMember) => void;
}

export function RegisterParticipantModal({
  isOpen,
  isLoading,
  candidates,
  registeringId,
  onClose,
  onRegister,
}: RegisterParticipantModalProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return candidates;
    return candidates.filter((member) => member.fullName.toLowerCase().includes(term));
  }, [candidates, search]);

  function handleClose() {
    setSearch('');
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Register a Participant">
      <SearchInput
        label="Search members"
        placeholder="Search by name…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        onClear={() => setSearch('')}
        className="mb-4"
      />

      {isLoading ? (
        <SkeletonRegion label="Loading members…" className="space-y-1">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="flex items-center justify-between gap-3 px-2 py-2">
              <div className="flex items-center gap-2.5">
                <Skeleton className="size-9 shrink-0 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
              </div>
              <Skeleton className="h-8 w-24 shrink-0" />
            </div>
          ))}
        </SkeletonRegion>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={MembersIcon}
          title={
            candidates.length === 0
              ? 'Everyone is already registered'
              : 'No members match your search'
          }
          description={
            candidates.length === 0
              ? 'Every active member is already on this event’s roster.'
              : 'Try a different name.'
          }
        />
      ) : (
        <ul className="max-h-80 space-y-1 overflow-y-auto">
          {filtered.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between gap-3 rounded-field px-2 py-2 hover:bg-subtle"
            >
              <div className="flex items-center gap-2.5">
                <TableAvatar name={member.fullName} />
                <div>
                  <p className="text-[0.9rem] font-semibold text-ink">{member.fullName}</p>
                  <p className="text-[0.78rem] text-muted">{member.troopName ?? 'No troop'}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                leadingIcon={<AddIcon aria-hidden />}
                isLoading={registeringId === member.id}
                onClick={() => onRegister(member)}
              >
                Register
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
