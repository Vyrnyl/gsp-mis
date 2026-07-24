'use client';

import { useId } from 'react';

import { cn } from '@/shared/utils/cn';

import { REPORT_TYPE_ICONS } from '../constants';
import type { ReportTypeDef, ReportTypeId } from '../types';

export interface ReportTypeSelectorProps {
  types: ReportTypeDef[];
  value: ReportTypeId;
  onChange: (id: ReportTypeId) => void;
}

/**
 * Report type picker — new registry entry for 3.2. Native radio inputs (`sr-only`)
 * driving styled cards, same technique as auth's `RoleSelector` — real keyboard
 * (arrow-key) and screen-reader semantics for free, instead of the prototype's
 * `onclick`-`<div>` cards (house rule #5, 2026-07-22 sign-off). Available types are
 * pre-filtered by role/permission by the caller.
 */
export function ReportTypeSelector({ types, value, onChange }: ReportTypeSelectorProps) {
  const name = useId();

  return (
    <fieldset className="mb-5 border-0 p-0">
      <legend className="sr-only">Report type</legend>
      <div className="grid grid-cols-1 gap-3.5 xs:grid-cols-2 lg2:grid-cols-3">
        {types.map((type) => {
          const Icon = REPORT_TYPE_ICONS[type.id];
          const inputId = `${name}-${type.id}`;
          const isChecked = value === type.id;

          return (
            <div key={type.id}>
              <input
                type="radio"
                id={inputId}
                name={name}
                value={type.id}
                checked={isChecked}
                onChange={() => onChange(type.id)}
                className="peer sr-only"
              />
              <label
                htmlFor={inputId}
                className={cn(
                  'block cursor-pointer rounded-card border-2 bg-surface p-5 shadow-card transition',
                  'hover:-translate-y-0.5',
                  isChecked ? 'border-brand-green' : 'border-transparent',
                  'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-green',
                )}
              >
                <span
                  className={cn(
                    'mb-3 flex size-11 items-center justify-center rounded-xl text-xl',
                    isChecked ? 'bg-brand-green text-white' : 'bg-brand-green3 text-brand-green',
                  )}
                >
                  <Icon aria-hidden />
                </span>
                <p className="font-bold text-ink">{type.label}</p>
                <p className="mt-1 text-[0.82rem] leading-relaxed text-muted">{type.description}</p>
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
