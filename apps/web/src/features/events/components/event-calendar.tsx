'use client';

import { useMemo, useState } from 'react';

import { ChevronLeftIcon, ChevronRightIcon, ClockIcon, LocationIcon } from '@/shared/components/icons';
import { EmptyState } from '@/shared/components/ui';
import { cn } from '@/shared/utils/cn';

import type { EventSummary } from '../types';
import { formatEventTimeRange } from '../utils';
import { EventStatusBadge } from './event-status-badge';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface EventCalendarProps {
  events: EventSummary[];
  onSelectEvent: (event: EventSummary) => void;
}

/**
 * Month grid — registry §4 Calendar, first real implementation (the prototype's
 * `.cal-grid`/`.cal-day` CSS was never wired to any markup, ui-registry.md §4).
 * Day cells are real `<button>`s, not the prototype's clickable `<div>`s.
 */
export function EventCalendar({ events, onSelectEvent }: EventCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const [monthCursor, setMonthCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string>(() => toIsoDate(today));

  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventSummary[]>();
    for (const event of events) {
      const list = map.get(event.eventDate) ?? [];
      list.push(event);
      map.set(event.eventDate, list);
    }
    return map;
  }, [events]);

  const cells = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const result: Array<{ date: Date; iso: string } | null> = [];
    for (let i = 0; i < firstWeekday; i += 1) result.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      result.push({ date, iso: toIsoDate(date) });
    }
    while (result.length % 7 !== 0) result.push(null);
    return result;
  }, [monthCursor]);

  const todayIso = toIsoDate(today);
  const selectedEvents = eventsByDate.get(selectedDate) ?? [];
  const monthLabel = monthCursor.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });

  function changeMonth(delta: number) {
    setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-[1rem] font-bold text-ink">{monthLabel}</h3>
        <div className="flex gap-1">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => changeMonth(-1)}
            className="inline-flex size-8 items-center justify-center rounded-control border border-hairline text-muted transition hover:border-brand-green hover:text-brand-green"
          >
            <ChevronLeftIcon aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => changeMonth(1)}
            className="inline-flex size-8 items-center justify-center rounded-control border border-hairline text-muted transition hover:border-brand-green hover:text-brand-green"
          >
            <ChevronRightIcon aria-hidden />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DAY_NAMES.map((name) => (
          <div key={name} className="p-1 text-center text-[0.72rem] font-semibold text-muted">
            {name}
          </div>
        ))}

        {cells.map((cell, index) => {
          if (!cell) return <div key={`empty-${index}`} aria-hidden />;

          const dayEvents = eventsByDate.get(cell.iso) ?? [];
          const isToday = cell.iso === todayIso;
          const isSelected = cell.iso === selectedDate;

          return (
            <button
              key={cell.iso}
              type="button"
              onClick={() => setSelectedDate(cell.iso)}
              aria-pressed={isSelected}
              aria-label={`${cell.date.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })}${
                dayEvents.length ? `, ${dayEvents.length} event${dayEvents.length === 1 ? '' : 's'}` : ', no events'
              }`}
              className={cn(
                'rounded-lg p-1.5 text-[0.82rem] transition hover:bg-brand-green3',
                isToday && 'bg-brand-green font-bold text-white hover:bg-brand-green',
                !isToday && isSelected && 'ring-2 ring-brand-green ring-inset',
                !isToday && dayEvents.length > 0 && 'font-bold text-brand-green',
              )}
            >
              {cell.date.getDate()}
              {dayEvents.length > 0 ? (
                <span
                  aria-hidden
                  className={cn(
                    'mx-auto mt-0.5 block size-1.5 rounded-full',
                    isToday ? 'bg-white' : 'bg-brand-green',
                  )}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-5 border-t border-hairline-subtle pt-4">
        <h4 className="mb-3 text-[0.9rem] font-bold text-ink">
          {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-PH', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </h4>

        {selectedEvents.length === 0 ? (
          <EmptyState title="No events scheduled" description="Nothing is on the calendar for this day." />
        ) : (
          <ul className="space-y-2.5">
            {selectedEvents.map((event) => {
              const timeRange = formatEventTimeRange(event.startTime, event.endTime);
              return (
                <li key={event.id}>
                  <button
                    type="button"
                    onClick={() => onSelectEvent(event)}
                    className="w-full rounded-card border border-hairline-subtle p-3.5 text-left transition hover:border-brand-green"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-semibold text-ink">{event.title}</span>
                      <EventStatusBadge status={event.status} />
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8rem] text-muted">
                      {timeRange ? (
                        <span className="flex items-center gap-1">
                          <ClockIcon aria-hidden /> {timeRange}
                        </span>
                      ) : null}
                      {event.location ? (
                        <span className="flex items-center gap-1">
                          <LocationIcon aria-hidden /> {event.location}
                        </span>
                      ) : null}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
