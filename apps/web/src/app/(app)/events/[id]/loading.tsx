import { Card, CardSkeleton } from '@/shared/components/ui';

/** Shown as soon as an event is opened, while the page loads its session on the server. */
export default function EventDetailLoading() {
  return (
    <Card>
      <CardSkeleton lines={5} />
    </Card>
  );
}
