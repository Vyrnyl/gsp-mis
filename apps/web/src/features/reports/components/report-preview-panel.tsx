import { DownloadIcon, ReportIcon } from '@/shared/components/icons';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Pagination,
  StatCard,
  StatCardSkeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableSkeleton,
  TableWrapper,
} from '@/shared/components/ui';
import { usePagedItems } from '@/shared/hooks/use-paged-items';

import type { ReportFormat, ReportPreview, ViewState } from '../types';

const PAGE_SIZE = 10;

export interface ReportPreviewPanelProps {
  viewState: ViewState;
  preview: ReportPreview | null;
  reportLabel: string;
  canExport: boolean;
  isExporting: ReportFormat | null;
  onRetry: () => void;
  onExport: (format: ReportFormat) => void;
}

/** Generic across all 6 report types — columns/rows/stats are already shaped server-side (or by the mock),
 * so one renderer covers Membership/Attendance/Badge/Financial/Activity/Executive without per-type markup. */
export function ReportPreviewPanel({
  viewState,
  preview,
  reportLabel,
  canExport,
  isExporting,
  onRetry,
  onExport,
}: ReportPreviewPanelProps) {
  const { page, setPage, pageItems, totalItems, pageSize } = usePagedItems(preview?.rows ?? [], PAGE_SIZE);

  if (viewState === 'idle') {
    return (
      <Card>
        <EmptyState
          icon={ReportIcon}
          title="No preview yet"
          description={`Choose a date range and generate a preview of the ${reportLabel.toLowerCase()}.`}
        />
      </Card>
    );
  }

  if (viewState === 'error') {
    return (
      <Card>
        <ErrorState onRetry={onRetry} description="We could not generate this report. Check your connection and try again." />
      </Card>
    );
  }

  if (viewState === 'loading' || !preview) {
    return (
      <Card>
        <div className="mb-5 grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>
        <TableSkeleton rows={5} columns={4} />
      </Card>
    );
  }

  if (preview.rows.length === 0) {
    return (
      <Card>
        <EmptyState title="No data in this range" description="Try widening the date range or choosing a different troop." />
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[1.05rem] font-bold text-ink">{reportLabel}</h3>
          <p className="mt-0.5 text-[0.82rem] text-muted">{preview.rangeLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canExport ? (
            <>
              <Button
                variant="outline"
                size="sm"
                leadingIcon={<DownloadIcon aria-hidden />}
                isLoading={isExporting === 'pdf'}
                disabled={isExporting !== null && isExporting !== 'pdf'}
                onClick={() => onExport('pdf')}
              >
                Export PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                leadingIcon={<DownloadIcon aria-hidden />}
                isLoading={isExporting === 'excel'}
                disabled={isExporting !== null && isExporting !== 'excel'}
                onClick={() => onExport('excel')}
              >
                Export Excel
              </Button>
            </>
          ) : (
            <p className="text-[0.8rem] text-muted">Ask an administrator or council member to export this report.</p>
          )}
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-4">
        {preview.stats.map((stat) => (
          <StatCard key={stat.label} icon={ReportIcon} value={stat.value} label={stat.label} />
        ))}
      </div>

      <TableWrapper>
        <Table caption={`${reportLabel} preview`}>
          <TableHead>
            <TableRow>
              {preview.columns.map((column) => (
                <TableHeaderCell key={column}>{column}</TableHeaderCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {pageItems.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <TableCell key={cellIndex}>
                    <span className="whitespace-nowrap">{cell}</span>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrapper>

      {preview.rows.length > pageSize ? (
        <Pagination page={page} pageSize={pageSize} totalItems={totalItems} onPageChange={setPage} itemLabel="rows" />
      ) : null}
    </Card>
  );
}
