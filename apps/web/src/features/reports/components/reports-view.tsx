'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { AuthRoleId } from '@/features/auth/types';
import { listTroops } from '@/features/organizations/services/organizations.service';
import { ConfirmDialog, useToast, type SelectOption } from '@/shared/components/ui';

import { getAvailableReportTypes } from '../constants';
import {
  downloadReport,
  exportReport,
  getReportPreview,
  listReportHistory,
  ReportsRequestError,
  resetReportHistory,
} from '../services/reports.service';
import type { ExportFormat, GeneratedReport, HistoryViewState, ReportFilters, ReportPreview, ReportTypeId, ViewState } from '../types';
import { ReportFiltersBar } from './report-filters-bar';
import { ReportHistoryPanel } from './report-history-panel';
import { ReportPreviewPanel } from './report-preview-panel';
import { ReportTypeSelector } from './report-type-selector';

const HISTORY_PAGE_SIZE = 5;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
function startOfYearIso(): string {
  return `${new Date().getFullYear()}-01-01`;
}

export interface ReportsViewProps {
  role: AuthRoleId;
  canExport: boolean;
}

export function ReportsView({ role, canExport }: ReportsViewProps) {
  const { showToast } = useToast();
  const availableTypes = useMemo(() => getAvailableReportTypes(role), [role]);
  const showTroopFilter = role !== 'troop_leader';

  const [activeType, setActiveType] = useState<ReportTypeId>(availableTypes[0]!.id);
  const [filters, setFilters] = useState<ReportFilters>({ dateFrom: startOfYearIso(), dateTo: todayIso(), troopId: 'all' });
  const [troopOptions, setTroopOptions] = useState<SelectOption[] | null>(null);

  const [previewState, setPreviewState] = useState<ViewState>('idle');
  const [preview, setPreview] = useState<ReportPreview | null>(null);
  const [isExporting, setIsExporting] = useState<ExportFormat | null>(null);

  const [historyState, setHistoryState] = useState<HistoryViewState>('loading');
  const [history, setHistory] = useState<GeneratedReport[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);

  // Clearing the history is Administrator-only; the API enforces it independently,
  // so this only decides whether the control is offered.
  const canReset = role === 'admin';
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const activeTypeDef = availableTypes.find((type) => type.id === activeType) ?? availableTypes[0]!;

  const fetchHistory = useCallback(async () => {
    setHistoryState('loading');
    try {
      const result = await listReportHistory({ page: historyPage, pageSize: HISTORY_PAGE_SIZE });
      setHistory(result.reports);
      setHistoryTotal(result.totalItems);
      setHistoryState('ready');
    } catch {
      setHistoryState('error');
    }
  }, [historyPage]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    if (!showTroopFilter) return;
    listTroops()
      .then((troops) => {
        setTroopOptions([
          { value: 'all', label: 'All Troops' },
          ...troops.map((troop) => ({ value: troop.id, label: troop.name })),
        ]);
      })
      .catch(() => showToast('Could not load the troop filter list.', 'error'));
    // Loaded once — the filter only needs to be fresh when the page mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTroopFilter]);

  function handleSelectType(id: ReportTypeId) {
    setActiveType(id);
    setPreview(null);
    setPreviewState('idle');
  }

  async function handleGenerate() {
    setPreviewState('loading');
    try {
      const result = await getReportPreview(activeType, filters);
      setPreview(result);
      setPreviewState('ready');
    } catch {
      setPreviewState('error');
    }
  }

  async function handleExport(format: ExportFormat) {
    setIsExporting(format);
    try {
      await exportReport(activeType, filters, format);
      showToast('Report exported as PDF.', 'success');
      await fetchHistory();
    } catch (error) {
      const message = error instanceof ReportsRequestError ? error.message : 'Could not export this report.';
      showToast(message, 'error');
    } finally {
      setIsExporting(null);
    }
  }

  async function handleReset() {
    setIsResetting(true);
    try {
      const { deleted } = await resetReportHistory();
      setIsResetDialogOpen(false);
      showToast(`Deleted ${deleted.toLocaleString()} report${deleted === 1 ? '' : 's'}.`, 'success');

      // The page the user was on no longer exists, so go back to the first.
      // On page 1 that state change is a no-op and would not refetch, so ask
      // explicitly; `fetchHistory` is keyed to page 1 here either way.
      if (historyPage === 1) {
        await fetchHistory();
      } else {
        setHistoryPage(1);
      }
    } catch (error) {
      const message = error instanceof ReportsRequestError ? error.message : 'Could not reset the report history.';
      showToast(message, 'error');
    } finally {
      setIsResetting(false);
    }
  }

  async function handleDownload(report: GeneratedReport) {
    try {
      await downloadReport(report);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not download this report.', 'error');
    }
  }

  return (
    <div>
      <ReportTypeSelector types={availableTypes} value={activeType} onChange={handleSelectType} />

      <ReportFiltersBar
        filters={filters}
        onChange={setFilters}
        onGenerate={handleGenerate}
        isGenerating={previewState === 'loading'}
        troopOptions={showTroopFilter ? troopOptions : null}
      />

      <ReportPreviewPanel
        viewState={previewState}
        preview={preview}
        reportLabel={activeTypeDef.label}
        canExport={canExport}
        isExporting={isExporting}
        onRetry={handleGenerate}
        onExport={handleExport}
      />

      <ReportHistoryPanel
        viewState={historyState}
        reports={history}
        page={historyPage}
        pageSize={HISTORY_PAGE_SIZE}
        totalItems={historyTotal}
        onPageChange={setHistoryPage}
        onRetry={fetchHistory}
        onDownload={handleDownload}
        canReset={canReset}
        isResetting={isResetting}
        onReset={canReset ? () => setIsResetDialogOpen(true) : undefined}
      />

      <ConfirmDialog
        isOpen={isResetDialogOpen}
        title="Reset report history"
        description={
          <>
            This deletes all {historyTotal.toLocaleString()} generated report
            {historyTotal === 1 ? '' : 's'} for every user, not just your own. It cannot be undone.
            <br />
            <br />
            Any report can be generated again from the same filters — only the record that it was
            previously run is lost.
          </>
        }
        confirmLabel="Delete all"
        tone="danger"
        isConfirming={isResetting}
        onConfirm={handleReset}
        onCancel={() => setIsResetDialogOpen(false)}
      />
    </div>
  );
}
