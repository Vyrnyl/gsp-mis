'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { AuthRoleId } from '@/features/auth/types';
import { listTroops } from '@/features/organizations/services/organizations.service';
import { useToast, type SelectOption } from '@/shared/components/ui';

import { getAvailableReportTypes } from '../constants';
import {
  downloadReport,
  exportReport,
  getReportPreview,
  listReportHistory,
  ReportsRequestError,
} from '../services/reports.service';
import type { GeneratedReport, HistoryViewState, ReportFilters, ReportFormat, ReportPreview, ReportTypeId, ViewState } from '../types';
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
  const [isExporting, setIsExporting] = useState<ReportFormat | null>(null);

  const [historyState, setHistoryState] = useState<HistoryViewState>('loading');
  const [history, setHistory] = useState<GeneratedReport[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);

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

  async function handleExport(format: ReportFormat) {
    setIsExporting(format);
    try {
      await exportReport(activeType, filters, format);
      showToast(`Report exported as ${format === 'pdf' ? 'PDF' : 'Excel'}.`, 'success');
      await fetchHistory();
    } catch (error) {
      const message = error instanceof ReportsRequestError ? error.message : 'Could not export this report.';
      showToast(message, 'error');
    } finally {
      setIsExporting(null);
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
        onDownload={downloadReport}
      />
    </div>
  );
}
