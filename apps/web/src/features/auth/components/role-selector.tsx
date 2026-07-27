'use client';

import { useId } from 'react';

import { AdminIcon, CouncilIcon, TroopLeaderIcon, type IconType } from '@/shared/components/icons';
import { cn } from '@/shared/utils/cn';

import type { AuthRoleId } from '../types';

export interface RoleOption {
  id: AuthRoleId;
  label: string;
  icon: IconType;
}

/** Order matches CLAUDE.md's canonical role list: Administrator, Executive Council, Troop Leader. */
export const ROLE_OPTIONS: RoleOption[] = [
  { id: 'admin', label: 'Administrator', icon: AdminIcon },
  { id: 'executive_council', label: 'Executive Council', icon: CouncilIcon },
  { id: 'troop_leader', label: 'Troop Leader', icon: TroopLeaderIcon },
];

/**
 * Signup's subset — Administrator is omitted because self-signup for that role was
 * removed (2026-07-27); `signupSchema` rejects it server-side, so offering the option
 * would only produce a 400. Login keeps the full `ROLE_OPTIONS`: existing
 * Administrators still sign in normally, and that selector is presentational anyway
 * (`loginSchema` is email + password only — the role comes from the database).
 */
export const SIGNUP_ROLE_OPTIONS: RoleOption[] = ROLE_OPTIONS.filter((option) => option.id !== 'admin');

export interface RoleSelectorProps {
  legend: string;
  value: AuthRoleId;
  onChange: (id: AuthRoleId) => void;
  /** Defaults to all three roles; signup passes `SIGNUP_ROLE_OPTIONS`. */
  options?: RoleOption[];
  className?: string;
}

/**
 * Replaces `.role-selector` / `.role-btn`. Native radio inputs (visually hidden,
 * not zero-sized) drive the segmented-control look, so the group gets real
 * keyboard and screen-reader semantics for free instead of the prototype's
 * `onclick`-only `<div>`s.
 */
export function RoleSelector({ legend, value, onChange, options = ROLE_OPTIONS, className }: RoleSelectorProps) {
  const name = useId();

  return (
    <fieldset className={cn('mb-5 flex gap-2 border-0 p-0', className)}>
      <legend className="sr-only">{legend}</legend>
      {options.map((option) => {
        const inputId = `${name}-${option.id}`;
        const Icon = option.icon;

        return (
          <div key={option.id} className="flex-1">
            <input
              type="radio"
              id={inputId}
              name={name}
              value={option.id}
              checked={value === option.id}
              onChange={() => onChange(option.id)}
              className="peer sr-only"
            />
            <label
              htmlFor={inputId}
              className={cn(
                'flex cursor-pointer flex-col items-center gap-1 rounded-[10px] border-2 border-hairline',
                'px-1.5 py-2.5 text-center text-[0.8rem] font-semibold text-muted transition',
                'peer-checked:border-brand-green peer-checked:bg-brand-green3 peer-checked:text-brand-green',
                'peer-focus-visible:ring-2 peer-focus-visible:ring-brand-green2 peer-focus-visible:ring-offset-2',
              )}
            >
              <Icon className="text-[1.3rem]" aria-hidden />
              {option.label}
            </label>
          </div>
        );
      })}
    </fieldset>
  );
}
