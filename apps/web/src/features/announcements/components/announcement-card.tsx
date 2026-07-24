import { Badge, Card } from '@/shared/components/ui';
import { cn } from '@/shared/utils/cn';
import { formatRelativeTime } from '@/shared/utils/format-relative-time';

import type { AnnouncementPost } from '../types';

function toDisplayDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

export interface AnnouncementCardProps {
  announcement: AnnouncementPost;
}

export function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  const isExpired = announcement.expiresAt ? new Date(announcement.expiresAt) < new Date() : false;

  return (
    <Card className={cn(isExpired && 'opacity-60')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[1.02rem] font-bold text-ink">{announcement.title}</h3>
          <p className="mt-0.5 text-[0.8rem] text-muted">
            Posted by {announcement.postedBy?.fullName ?? 'GSP Administration'} ·{' '}
            {formatRelativeTime(announcement.postedAt)}
          </p>
        </div>
        {isExpired ? (
          <Badge tone="gray">Expired</Badge>
        ) : announcement.expiresAt ? (
          <Badge tone="gold">Expires {toDisplayDate(announcement.expiresAt)}</Badge>
        ) : null}
      </div>
      <p className="mt-3 whitespace-pre-line text-[0.92rem] leading-relaxed text-ink-soft">
        {announcement.content}
      </p>
    </Card>
  );
}
