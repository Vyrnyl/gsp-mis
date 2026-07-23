'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  ClockIcon,
  DeleteIcon,
  EditIcon,
  EventIcon,
  EyeIcon,
  LocationIcon,
  MembersIcon,
} from '@/shared/components/icons';
import { Badge, Button, Card } from '@/shared/components/ui';

import type { EventSummary } from '../types';
import { formatEventDate, formatEventTimeRange } from '../utils';
import { EventStatusBadge } from './event-status-badge';

export interface EventCardProps {
  event: EventSummary;
  canManage: boolean;
  isEditLoading?: boolean;
  onEdit: (event: EventSummary) => void;
  onDelete: (event: EventSummary) => void;
}

export function EventCard({ event, canManage, isEditLoading = false, onEdit, onDelete }: EventCardProps) {
  const router = useRouter();
  const timeRange = formatEventTimeRange(event.startTime, event.endTime);

  return (
    <Card className="transition hover:-translate-y-0.5">
      <div className="mb-2.5 flex items-start justify-between gap-3">
        <div>
          <Link
            href={`/events/${event.id}`}
            className="text-[1rem] font-bold text-ink hover:text-brand-green hover:underline"
          >
            {event.title}
          </Link>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.82rem] text-muted">
            <span className="flex items-center gap-1">
              <EventIcon aria-hidden /> {formatEventDate(event.eventDate)}
            </span>
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
        </div>
        <EventStatusBadge status={event.status} />
      </div>

      <div className="mb-3.5 flex flex-wrap gap-1.5">
        {event.category ? <Badge tone="gold">{event.category.name}</Badge> : null}
        <Badge tone="gray">
          <span className="inline-flex items-center gap-1">
            <MembersIcon aria-hidden /> {event.registeredCount} registered
          </span>
        </Badge>
        {event.troopNames.map((name) => (
          <Badge key={name} tone="gray">
            {name}
          </Badge>
        ))}
        {!event.organizer ? <Badge tone="red">No organizer assigned</Badge> : null}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Button
          variant="outline"
          size="sm"
          leadingIcon={<EyeIcon aria-hidden />}
          onClick={() => router.push(`/events/${event.id}`)}
        >
          View Details
        </Button>
        {canManage ? (
          <>
            <Button
              variant="gray"
              size="sm"
              leadingIcon={<EditIcon aria-hidden />}
              isLoading={isEditLoading}
              onClick={() => onEdit(event)}
            >
              Edit
            </Button>
            <Button
              variant="red"
              size="sm"
              aria-label={`Delete ${event.title}`}
              onClick={() => onDelete(event)}
            >
              <DeleteIcon aria-hidden />
            </Button>
          </>
        ) : null}
      </div>
    </Card>
  );
}
