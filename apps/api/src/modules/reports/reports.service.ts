import { ApiError } from '../../shared/utils/api-error';
import { writeAuditLog } from '../../shared/utils/audit-log';
import type { RoleName } from '../../shared/constants/roles';
import { generateExcelBuffer, generatePdfBuffer } from './reports.generators';
import { reportsRepository } from './reports.repository';
import type { ExportInput, ListHistoryQuery, PreviewQuery, ReportFormat, ReportType } from './reports.schema';
import { reportsStorage } from './reports.storage';
import type { ExportResultDto, GeneratedReportDto, ReportPreviewDto, ReportStatValueDto } from './reports.types';
import { REPORT_TYPE_LABELS } from './reports.constants';

type RequestingUser = { id: string; role: RoleName };

/** Which roles may generate/preview each report type. `financial`/`executive` are
 * Admin + Executive Council only — Troop Leader has no `finance:read` (3.1's pre-build
 * RBAC fix) and no cross-domain org-wide view (same role split as 1.5's dashboard). */
const REPORT_TYPE_ROLES: Record<ReportType, RoleName[]> = {
  membership: ['admin', 'executive_council', 'troop_leader'],
  attendance: ['admin', 'executive_council', 'troop_leader'],
  badge: ['admin', 'executive_council', 'troop_leader'],
  activity: ['admin', 'executive_council', 'troop_leader'],
  financial: ['admin', 'executive_council'],
  executive: ['admin', 'executive_council'],
};

function assertTypeAccess(reportType: ReportType, user: RequestingUser): void {
  if (!REPORT_TYPE_ROLES[reportType].includes(user.role)) {
    throw ApiError.forbidden(`You do not have access to the ${REPORT_TYPE_LABELS[reportType]}.`);
  }
}

async function scopeToOwnTroop(user: RequestingUser): Promise<string[] | undefined> {
  if (user.role !== 'troop_leader') return undefined;
  const troops = await reportsRepository.findTroopIdsLedBy(user.id);
  return troops.map((troop) => troop.id);
}

function startOfDay(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}
function endOfDay(isoDate: string): Date {
  return new Date(`${isoDate}T23:59:59.999Z`);
}
function displayDate(date: Date): string {
  return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}
/** Amounts are labelled `PHP`, not `₱`. The exported PDF uses the standard
 * Helvetica font, whose WinAnsi encoding has no peso glyph — `₱` measures zero
 * width there and drops out of the document, so the sign was invisible in the
 * one place these strings are actually read. The ASCII code renders everywhere
 * and stays unambiguous; `reports.generators.ts#parseCell` matches this format. */
function formatCurrency(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  return `${sign}PHP ${Math.abs(amount).toLocaleString('en-PH', { maximumFractionDigits: 2 })}`;
}
function capitalize(value: string): string {
  return value.length === 0 ? value : value[0]!.toUpperCase() + value.slice(1);
}
function rangeLabel(dateFrom: string, dateTo: string): string {
  return `${displayDate(startOfDay(dateFrom))} – ${displayDate(startOfDay(dateTo))}`;
}
/** A stored `@db.Date` back to the `YYYY-MM-DD` the preview builders take. Read in
 * UTC to match `startOfDay`, which is how the value was written. */
function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
function stat(label: string, value: string | number): ReportStatValueDto {
  return { label, value: String(value) };
}

async function buildMembershipPreview(dateFrom: string, dateTo: string, troopId: string | undefined): Promise<ReportPreviewDto> {
  const members = await reportsRepository.listMembersInRange(startOfDay(dateFrom), endOfDay(dateTo), troopId);
  const active = members.filter((m) => m.status.name === 'active').length;
  const pending = members.filter((m) => m.status.name === 'pending').length;
  const other = members.length - active - pending;

  return {
    reportType: 'membership',
    generatedAt: new Date().toISOString(),
    rangeLabel: rangeLabel(dateFrom, dateTo),
    stats: [
      stat('Total Members', members.length),
      stat('Active', active),
      stat('Pending', pending),
      stat('Other', other),
    ],
    columns: ['Name', 'Type', 'Troop', 'Status', 'Registered'],
    rows: members.map((m) => [
      `${m.firstName} ${m.lastName}`,
      m.memberType === 'scout' ? 'Scout' : 'Adult Leader',
      m.troop?.name ?? '—',
      capitalize(m.status.name),
      displayDate(m.createdAt),
    ]),
  };
}

async function buildAttendancePreview(dateFrom: string, dateTo: string, user: RequestingUser): Promise<ReportPreviewDto> {
  const troopIds = await scopeToOwnTroop(user);
  const events = await reportsRepository.listEventsWithAttendanceInRange(startOfDay(dateFrom), endOfDay(dateTo), troopIds);
  const relevant = troopIds ? events.filter((event) => event.attendanceRecords.length > 0) : events;

  let totalPresent = 0;
  let totalAbsent = 0;
  const rows = relevant.map((event) => {
    const present = event.attendanceRecords.filter((r) => r.attendanceStatus === 'present').length;
    const absent = event.attendanceRecords.filter((r) => r.attendanceStatus === 'absent').length;
    totalPresent += present;
    totalAbsent += absent;
    const total = present + absent;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return [event.title, displayDate(event.eventDate), String(present), String(absent), `${rate}%`];
  });
  const totalRecords = totalPresent + totalAbsent;
  const avgRate = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

  return {
    reportType: 'attendance',
    generatedAt: new Date().toISOString(),
    rangeLabel: rangeLabel(dateFrom, dateTo),
    stats: [
      stat('Events Held', relevant.length),
      stat('Avg. Attendance Rate', `${avgRate}%`),
      stat('Total Present', totalPresent),
      stat('Total Absent', totalAbsent),
    ],
    columns: ['Event', 'Date', 'Present', 'Absent', 'Rate'],
    rows,
  };
}

async function buildBadgePreview(dateFrom: string, dateTo: string, troopId: string | undefined, user: RequestingUser): Promise<ReportPreviewDto> {
  const troopIds = await scopeToOwnTroop(user);
  const [earned, inProgressCount] = await Promise.all([
    reportsRepository.listEarnedBadgesInRange(startOfDay(dateFrom), endOfDay(dateTo), troopIds, troopId),
    reportsRepository.countInProgressBadges(troopIds, troopId),
  ]);
  const verified = earned.filter((record) => record.status === 'verified').length;

  return {
    reportType: 'badge',
    generatedAt: new Date().toISOString(),
    rangeLabel: rangeLabel(dateFrom, dateTo),
    stats: [
      stat('Badges Earned', earned.length),
      stat('Verified', verified),
      stat('In Progress', inProgressCount),
    ],
    columns: ['Badge', 'Member', 'Troop', 'Status', 'Date'],
    rows: earned.map((record) => [
      record.badge.name,
      `${record.member.firstName} ${record.member.lastName}`,
      record.member.troop?.name ?? '—',
      capitalize(record.status),
      record.earnedAt ? displayDate(record.earnedAt) : '—',
    ]),
  };
}

async function buildActivityPreview(dateFrom: string, dateTo: string, user: RequestingUser): Promise<ReportPreviewDto> {
  const submittedById = user.role === 'troop_leader' ? user.id : undefined;
  const reports = await reportsRepository.listActivityReportsInRange(startOfDay(dateFrom), endOfDay(dateTo), submittedById);
  const troopNames = new Set(reports.map((r) => r.submittedBy.ledTroops[0]?.name).filter((name): name is string => Boolean(name)));

  return {
    reportType: 'activity',
    generatedAt: new Date().toISOString(),
    rangeLabel: rangeLabel(dateFrom, dateTo),
    stats: [stat('Reports Submitted', reports.length), stat('Troops Reporting', troopNames.size)],
    columns: ['Troop', 'Event', 'Submitted By', 'Date'],
    rows: reports.map((r) => [
      r.submittedBy.ledTroops[0]?.name ?? '—',
      r.event.title,
      r.submittedBy.fullName,
      displayDate(r.submittedAt),
    ]),
  };
}

async function buildFinancialPreview(dateFrom: string, dateTo: string): Promise<ReportPreviewDto> {
  const [payments, expenses] = await Promise.all([
    reportsRepository.listPaymentsInRange(startOfDay(dateFrom), endOfDay(dateTo)),
    reportsRepository.listExpensesInRange(startOfDay(dateFrom), endOfDay(dateTo)),
  ]);

  const totalCollected = payments.reduce((sum, p) => sum + p.amount.toNumber(), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount.toNumber(), 0);

  const paymentRows = payments.map((p) => ({
    date: p.paymentDate,
    row: [displayDate(p.paymentDate), 'Payment', `${p.feeType.name} — ${p.member.firstName} ${p.member.lastName}`, formatCurrency(p.amount.toNumber())],
  }));
  const expenseRows = expenses.map((e) => ({
    date: e.expenseDate,
    row: [displayDate(e.expenseDate), 'Expense', e.description, formatCurrency(-e.amount.toNumber())],
  }));
  const rows = [...paymentRows, ...expenseRows]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .map((entry) => entry.row);

  return {
    reportType: 'financial',
    generatedAt: new Date().toISOString(),
    rangeLabel: rangeLabel(dateFrom, dateTo),
    stats: [
      stat('Total Collected', formatCurrency(totalCollected)),
      stat('Total Expenses', formatCurrency(totalExpenses)),
      stat('Balance', formatCurrency(totalCollected - totalExpenses)),
    ],
    columns: ['Date', 'Type', 'Description', 'Amount'],
    rows,
  };
}

async function buildExecutivePreview(dateFrom: string, dateTo: string): Promise<ReportPreviewDto> {
  const from = startOfDay(dateFrom);
  const to = endOfDay(dateTo);
  const [totalMembers, newMembers, eventsHeld, badgesAwarded, payments, expenses] = await Promise.all([
    reportsRepository.countTotalMembers(),
    reportsRepository.countNewMembersInRange(from, to),
    reportsRepository.countEventsInRange(from, to),
    reportsRepository.countBadgesAwardedInRange(from, to),
    reportsRepository.listPaymentsInRange(from, to),
    reportsRepository.listExpensesInRange(from, to),
  ]);
  const totalCollected = payments.reduce((sum, p) => sum + p.amount.toNumber(), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount.toNumber(), 0);
  const netBalance = totalCollected - totalExpenses;

  return {
    reportType: 'executive',
    generatedAt: new Date().toISOString(),
    rangeLabel: rangeLabel(dateFrom, dateTo),
    stats: [
      stat('Total Members', totalMembers),
      stat('Events Held', eventsHeld),
      stat('Badges Awarded', badgesAwarded),
      stat('Net Balance', formatCurrency(netBalance)),
    ],
    columns: ['Metric', 'This Period'],
    rows: [
      ['New Registrations', String(newMembers)],
      ['Events Held', String(eventsHeld)],
      ['Badges Awarded', String(badgesAwarded)],
      ['Collections', formatCurrency(totalCollected)],
      ['Expenses', formatCurrency(totalExpenses)],
      ['Net Balance', formatCurrency(netBalance)],
    ],
  };
}

function toGeneratedReportDto(report: {
  id: string;
  title: string;
  reportType: string;
  format: string;
  generatedAt: Date;
  generatedBy: { fullName: string } | null;
}): GeneratedReportDto {
  return {
    id: report.id,
    title: report.title,
    reportType: report.reportType as ReportType,
    format: report.format as 'pdf' | 'excel',
    generatedByName: report.generatedBy?.fullName ?? null,
    generatedAt: report.generatedAt.toISOString(),
  };
}

async function buildPreview(query: PreviewQuery, user: RequestingUser): Promise<ReportPreviewDto> {
  assertTypeAccess(query.reportType, user);

  switch (query.reportType) {
    case 'membership':
      return buildMembershipPreview(query.dateFrom, query.dateTo, query.troopId);
    case 'attendance':
      return buildAttendancePreview(query.dateFrom, query.dateTo, user);
    case 'badge':
      return buildBadgePreview(query.dateFrom, query.dateTo, query.troopId, user);
    case 'activity':
      return buildActivityPreview(query.dateFrom, query.dateTo, user);
    case 'financial':
      return buildFinancialPreview(query.dateFrom, query.dateTo);
    case 'executive':
      return buildExecutivePreview(query.dateFrom, query.dateTo);
  }
}

export const reportsService = {
  getPreview(query: PreviewQuery, user: RequestingUser): Promise<ReportPreviewDto> {
    return buildPreview(query, user);
  },

  /**
   * Clears the entire report history. Administrator-only, enforced at the router
   * (`requireRole('admin')`) and re-checked here, so a direct call cannot bypass it.
   *
   * Irreversible and unscoped: a Troop Leader's history view is a filtered slice of
   * the same rows, so this empties it for everyone, not just the caller. Nothing is
   * lost that cannot be made again — reports are rebuilt from their parameters on
   * download, so "deleting" one only discards the record that it was once run.
   * Audited, since a bulk delete with no trail is exactly what an audit log is for.
   */
  async resetHistory(user: RequestingUser): Promise<{ deleted: number }> {
    if (user.role !== 'admin') {
      throw ApiError.forbidden('Only an Administrator can reset the report history.');
    }

    const deleted = await reportsRepository.deleteAllReports();
    await writeAuditLog({
      userId: user.id,
      action: 'report.reset_history',
      entityType: 'report',
      details: { deletedCount: deleted },
    });

    return { deleted };
  },

  // History is filtered to the types the requesting role may access, so a Troop
  // Leader can never see (or, via download, retrieve) a Financial/Executive export.
  async listHistory(query: ListHistoryQuery, user: RequestingUser): Promise<{ reports: GeneratedReportDto[]; total: number }> {
    const allowedTypes = (Object.keys(REPORT_TYPE_ROLES) as ReportType[]).filter((type) =>
      REPORT_TYPE_ROLES[type].includes(user.role),
    );
    const [rows, total] = await reportsRepository.listHistory(allowedTypes, query.page, query.pageSize);
    return { reports: rows.map(toGeneratedReportDto), total };
  },

  async exportReport(input: ExportInput, user: RequestingUser): Promise<ExportResultDto> {
    assertTypeAccess(input.reportType, user);

    // Generation is a validity check, not a write: it proves the parameters
    // produce a real report before the row claims they do. The buffer is
    // discarded — `getDownload` rebuilds it from the stored parameters.
    await buildPreview(input, user);
    const title = `${REPORT_TYPE_LABELS[input.reportType]} — ${rangeLabel(input.dateFrom, input.dateTo)}`;

    const created = await reportsRepository.createReport({
      title,
      reportType: input.reportType,
      format: input.format,
      generatedById: user.id,
      dateFrom: startOfDay(input.dateFrom),
      dateTo: startOfDay(input.dateTo),
      troopId: input.troopId ?? null,
    });

    return { report: toGeneratedReportDto(created), downloadUrl: `/api/v1/reports/${created.id}/download` };
  },

  async getDownload(id: string, user: RequestingUser): Promise<{ filename: string; mimeType: string; buffer: Buffer; report: GeneratedReportDto }> {
    const report = await reportsRepository.findReportById(id);
    if (!report) throw ApiError.notFound('Report not found.');
    assertTypeAccess(report.reportType as ReportType, user);

    // Rows created before reports stored their parameters cannot be rebuilt.
    // The range is only in the title as a localized display string and the troop
    // scope is not there at all, so parsing it back would risk serving
    // council-wide figures under a troop-scoped report's name. 404 instead.
    if (!report.dateFrom || !report.dateTo) {
      throw ApiError.notFound(
        'This report was generated before downloads could be rebuilt, and its file is no longer stored. Generate it again to download it.',
      );
    }

    // Regenerated per request rather than read from disk: the API's filesystem is
    // ephemeral on Render, so a saved file disappears on the next deploy while the
    // row advertising it lives on in Postgres.
    const format = report.format as ReportFormat;
    const preview = await buildPreview(
      {
        reportType: report.reportType as ReportType,
        dateFrom: toIsoDate(report.dateFrom),
        dateTo: toIsoDate(report.dateTo),
        ...(report.troopId ? { troopId: report.troopId } : {}),
      },
      user,
    );
    const buffer =
      format === 'pdf' ? await generatePdfBuffer(report.title, preview) : await generateExcelBuffer(report.title, preview);

    return {
      filename: `${report.title.replace(/[^a-z0-9]+/gi, '-')}.${reportsStorage.extensionFor(format)}`,
      mimeType: reportsStorage.mimeTypeFor(format),
      buffer,
      report: toGeneratedReportDto(report),
    };
  },
};
