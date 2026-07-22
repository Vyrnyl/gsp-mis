import { Card } from '@/shared/components/ui/card';
import { EmptyState } from '@/shared/components/ui/empty-state';
import { PageHeader } from '@/shared/components/layout/page-header';

export interface PlaceholderPageProps {
  title: string;
  description: string;
  /** Build-plan reference for the feature that replaces this page, e.g. "1.3". */
  feature: string;
}

/**
 * Stand-in for a route the shell can reach but no feature has built yet.
 *
 * Phase 0.3 needs a navigable shell to visually verify; these pages exist only so
 * every nav destination resolves. Each is replaced wholesale by its feature's real
 * screen — none of this is a foundation to build on.
 */
export function PlaceholderPage({ title, description, feature }: PlaceholderPageProps) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <Card className="p-0">
        <EmptyState
          title="Not built yet"
          description={`This screen ships with feature ${feature} of the build plan. The shell routes here so navigation can be verified in Phase 0.`}
        />
      </Card>
    </>
  );
}
