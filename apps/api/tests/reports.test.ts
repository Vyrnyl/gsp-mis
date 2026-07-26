import { beforeEach, describe, expect, it, vi } from 'vitest';

import { reportsRepository } from '../src/modules/reports/reports.repository';
import { exportSchema, previewQuerySchema } from '../src/modules/reports/reports.schema';
import { reportsService } from '../src/modules/reports/reports.service';
import { reportsStorage } from '../src/modules/reports/reports.storage';

function decimal(value: number) {
  return { toNumber: () => value };
}

const ADMIN = { id: 'admin-1', role: 'admin' as const };
const COUNCIL = { id: 'council-1', role: 'executive_council' as const };
const LEADER = { id: 'leader-1', role: 'troop_leader' as const };

const RANGE = { dateFrom: '2026-01-01', dateTo: '2026-07-24' };

describe('reportsService per-type access', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('lets a Troop Leader preview membership/attendance/badge/activity', async () => {
    vi.spyOn(reportsRepository, 'listMembersInRange').mockResolvedValue([]);
    vi.spyOn(reportsRepository, 'findTroopIdsLedBy').mockResolvedValue([]);
    vi.spyOn(reportsRepository, 'listEventsWithAttendanceInRange').mockResolvedValue([]);
    vi.spyOn(reportsRepository, 'listEarnedBadgesInRange').mockResolvedValue([]);
    vi.spyOn(reportsRepository, 'countInProgressBadges').mockResolvedValue(0);
    vi.spyOn(reportsRepository, 'listActivityReportsInRange').mockResolvedValue([]);

    await expect(reportsService.getPreview({ reportType: 'membership', ...RANGE }, LEADER)).resolves.toBeDefined();
    await expect(reportsService.getPreview({ reportType: 'attendance', ...RANGE }, LEADER)).resolves.toBeDefined();
    await expect(reportsService.getPreview({ reportType: 'badge', ...RANGE }, LEADER)).resolves.toBeDefined();
    await expect(reportsService.getPreview({ reportType: 'activity', ...RANGE }, LEADER)).resolves.toBeDefined();
  });

  it('blocks a Troop Leader from financial and executive previews', async () => {
    await expect(reportsService.getPreview({ reportType: 'financial', ...RANGE }, LEADER)).rejects.toMatchObject({
      statusCode: 403,
    });
    await expect(reportsService.getPreview({ reportType: 'executive', ...RANGE }, LEADER)).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('lets Admin and Executive Council preview every type', async () => {
    vi.spyOn(reportsRepository, 'listPaymentsInRange').mockResolvedValue([]);
    vi.spyOn(reportsRepository, 'listExpensesInRange').mockResolvedValue([]);
    vi.spyOn(reportsRepository, 'countTotalMembers').mockResolvedValue(0);
    vi.spyOn(reportsRepository, 'countNewMembersInRange').mockResolvedValue(0);
    vi.spyOn(reportsRepository, 'countEventsInRange').mockResolvedValue(0);
    vi.spyOn(reportsRepository, 'countBadgesAwardedInRange').mockResolvedValue(0);

    await expect(reportsService.getPreview({ reportType: 'financial', ...RANGE }, ADMIN)).resolves.toBeDefined();
    await expect(reportsService.getPreview({ reportType: 'executive', ...RANGE }, COUNCIL)).resolves.toBeDefined();
  });
});

describe('reportsService membership preview', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('buckets members into Active/Pending/Other and maps row fields', async () => {
    vi.spyOn(reportsRepository, 'listMembersInRange').mockResolvedValue([
      {
        firstName: 'Faith',
        lastName: 'Bermundo',
        memberType: 'scout',
        troop: { name: 'Troop 4 — Bato' },
        status: { name: 'active' },
        createdAt: new Date('2026-02-20T00:00:00Z'),
      },
      {
        firstName: 'Rosario',
        lastName: 'Verceles',
        memberType: 'adult_leader',
        troop: null,
        status: { name: 'pending' },
        createdAt: new Date('2026-07-20T00:00:00Z'),
      },
      {
        firstName: 'Nadine',
        lastName: 'Sorreda',
        memberType: 'scout',
        troop: { name: 'Troop 7 — San Andres' },
        status: { name: 'expired' },
        createdAt: new Date('2026-03-01T00:00:00Z'),
      },
    ] as never);

    const result = await reportsService.getPreview({ reportType: 'membership', ...RANGE }, ADMIN);

    expect(result.stats).toEqual([
      { label: 'Total Members', value: '3' },
      { label: 'Active', value: '1' },
      { label: 'Pending', value: '1' },
      { label: 'Other', value: '1' },
    ]);
    expect(result.columns).toEqual(['Name', 'Type', 'Troop', 'Status', 'Registered']);
    expect(result.rows[0]).toEqual(['Faith Bermundo', 'Scout', 'Troop 4 — Bato', 'Active', 'Feb 20, 2026']);
    expect(result.rows[1]).toEqual(['Rosario Verceles', 'Adult Leader', '—', 'Pending', 'Jul 20, 2026']);
  });
});

describe('reportsService attendance preview', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('computes per-event present/absent counts and an overall rate', async () => {
    vi.spyOn(reportsRepository, 'listEventsWithAttendanceInRange').mockResolvedValue([
      {
        title: 'Coastal Clean-Up Drive',
        eventDate: new Date('2026-06-20T00:00:00Z'),
        attendanceRecords: [
          { attendanceStatus: 'present' },
          { attendanceStatus: 'present' },
          { attendanceStatus: 'absent' },
        ],
      },
    ] as never);

    const result = await reportsService.getPreview({ reportType: 'attendance', ...RANGE }, ADMIN);

    expect(result.stats).toEqual([
      { label: 'Events Held', value: '1' },
      { label: 'Avg. Attendance Rate', value: '67%' },
      { label: 'Total Present', value: '2' },
      { label: 'Total Absent', value: '1' },
    ]);
    expect(result.rows).toEqual([['Coastal Clean-Up Drive', 'Jun 20, 2026', '2', '1', '67%']]);
  });

  it('scopes a Troop Leader to events with at least one of their own troop\'s attendance records', async () => {
    vi.spyOn(reportsRepository, 'findTroopIdsLedBy').mockResolvedValue([{ id: 'troop-12' }] as never);
    const listSpy = vi.spyOn(reportsRepository, 'listEventsWithAttendanceInRange').mockResolvedValue([
      { title: 'Event With Records', eventDate: new Date('2026-06-20T00:00:00Z'), attendanceRecords: [{ attendanceStatus: 'present' }] },
      { title: 'Event Without Records', eventDate: new Date('2026-06-21T00:00:00Z'), attendanceRecords: [] },
    ] as never);

    const result = await reportsService.getPreview({ reportType: 'attendance', ...RANGE }, LEADER);

    expect(listSpy).toHaveBeenCalledWith(expect.any(Date), expect.any(Date), ['troop-12']);
    expect(result.rows).toEqual([['Event With Records', 'Jun 20, 2026', '1', '0', '100%']]);
  });
});

describe('reportsService badge preview', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('separates earned/verified rows from a date-independent in-progress count', async () => {
    vi.spyOn(reportsRepository, 'listEarnedBadgesInRange').mockResolvedValue([
      {
        badge: { name: 'Heritage Keeper' },
        member: { firstName: 'Faith', lastName: 'Bermundo', troop: { name: 'Troop 4 — Bato' } },
        status: 'verified',
        earnedAt: new Date('2026-03-04T00:00:00Z'),
      },
    ] as never);
    vi.spyOn(reportsRepository, 'countInProgressBadges').mockResolvedValue(2);

    const result = await reportsService.getPreview({ reportType: 'badge', ...RANGE }, ADMIN);

    expect(result.stats).toEqual([
      { label: 'Badges Earned', value: '1' },
      { label: 'Verified', value: '1' },
      { label: 'In Progress', value: '2' },
    ]);
    expect(result.rows).toEqual([['Heritage Keeper', 'Faith Bermundo', 'Troop 4 — Bato', 'Verified', 'Mar 4, 2026']]);
  });
});

describe('reportsService activity preview', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('scopes a Troop Leader to their own submissions via submittedById', async () => {
    const listSpy = vi.spyOn(reportsRepository, 'listActivityReportsInRange').mockResolvedValue([]);

    await reportsService.getPreview({ reportType: 'activity', ...RANGE }, LEADER);

    expect(listSpy).toHaveBeenCalledWith(expect.any(Date), expect.any(Date), LEADER.id);
  });

  it('leaves Admin/Council unscoped', async () => {
    const listSpy = vi.spyOn(reportsRepository, 'listActivityReportsInRange').mockResolvedValue([]);

    await reportsService.getPreview({ reportType: 'activity', ...RANGE }, ADMIN);

    expect(listSpy).toHaveBeenCalledWith(expect.any(Date), expect.any(Date), undefined);
  });
});

describe('reportsService financial preview', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('merges payments and expenses sorted by date, expenses as negative amounts', async () => {
    vi.spyOn(reportsRepository, 'listPaymentsInRange').mockResolvedValue([
      {
        paymentDate: new Date('2026-06-01T00:00:00Z'),
        amount: decimal(500),
        feeType: { name: 'Camp Fee' },
        member: { firstName: 'Ana', lastName: 'Reyes' },
      },
    ] as never);
    vi.spyOn(reportsRepository, 'listExpensesInRange').mockResolvedValue([
      { expenseDate: new Date('2026-06-10T00:00:00Z'), amount: decimal(1500), description: 'First Aid Supplies' },
    ] as never);

    const result = await reportsService.getPreview({ reportType: 'financial', ...RANGE }, ADMIN);

    expect(result.stats).toEqual([
      { label: 'Total Collected', value: '₱500' },
      { label: 'Total Expenses', value: '₱1,500' },
      { label: 'Balance', value: '-₱1,000' },
    ]);
    expect(result.rows).toEqual([
      ['Jun 10, 2026', 'Expense', 'First Aid Supplies', '-₱1,500'],
      ['Jun 1, 2026', 'Payment', 'Camp Fee — Ana Reyes', '₱500'],
    ]);
  });
});

describe('reportsService listHistory', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('restricts the allowed report types passed to the repository by role', async () => {
    const listSpy = vi.spyOn(reportsRepository, 'listHistory').mockResolvedValue([[], 0]);

    await reportsService.listHistory({ page: 1, pageSize: 20 }, LEADER);
    const leaderTypes = listSpy.mock.calls[0]![0] as string[];
    expect(leaderTypes).not.toContain('financial');
    expect(leaderTypes).not.toContain('executive');
    expect(leaderTypes).toEqual(expect.arrayContaining(['membership', 'attendance', 'badge', 'activity']));

    await reportsService.listHistory({ page: 1, pageSize: 20 }, ADMIN);
    const adminTypes = listSpy.mock.calls[1]![0] as string[];
    expect(adminTypes).toContain('financial');
    expect(adminTypes).toContain('executive');
  });
});

describe('reportsService export + download', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('generates a file, persists a Report row, and returns a download URL', async () => {
    vi.spyOn(reportsRepository, 'listMembersInRange').mockResolvedValue([]);
    vi.spyOn(reportsStorage, 'save').mockResolvedValue('generated-file.pdf');
    const createSpy = vi.spyOn(reportsRepository, 'createReport').mockResolvedValue({
      id: 'report-1',
      title: 'Membership Report — Jan 1, 2026 – Jul 24, 2026',
      reportType: 'membership',
      format: 'pdf',
      generatedAt: new Date('2026-07-24T00:00:00Z'),
      generatedBy: { fullName: 'Marisol Tabuena' },
    } as never);

    const result = await reportsService.exportReport({ reportType: 'membership', ...RANGE, format: 'pdf' }, ADMIN);

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({ reportType: 'membership', format: 'pdf', filePath: 'generated-file.pdf', generatedById: ADMIN.id }),
    );
    expect(result.report.id).toBe('report-1');
    expect(result.downloadUrl).toBe('/api/v1/reports/report-1/download');
  });

  it('rejects a Troop Leader exporting a financial report before ever touching storage', async () => {
    const saveSpy = vi.spyOn(reportsStorage, 'save');

    await expect(
      reportsService.exportReport({ reportType: 'financial', ...RANGE, format: 'pdf' }, LEADER),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('404s a download for an unknown report id', async () => {
    vi.spyOn(reportsRepository, 'findReportById').mockResolvedValue(null);

    await expect(reportsService.getDownload('missing', ADMIN)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('403s a Troop Leader downloading a Financial report even by direct id', async () => {
    vi.spyOn(reportsRepository, 'findReportById').mockResolvedValue({
      id: 'report-1',
      title: 'Financial Report',
      reportType: 'financial',
      format: 'pdf',
      filePath: 'file.pdf',
      generatedAt: new Date(),
      generatedBy: null,
    } as never);

    await expect(reportsService.getDownload('report-1', LEADER)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('streams the stored file for a permitted download', async () => {
    vi.spyOn(reportsRepository, 'findReportById').mockResolvedValue({
      id: 'report-1',
      title: 'Membership Report',
      reportType: 'membership',
      format: 'excel',
      filePath: 'file.xlsx',
      generatedAt: new Date(),
      generatedBy: { fullName: 'Marisol Tabuena' },
    } as never);
    vi.spyOn(reportsStorage, 'read').mockResolvedValue(Buffer.from('fake-bytes'));

    const result = await reportsService.getDownload('report-1', ADMIN);

    expect(result.buffer.toString()).toBe('fake-bytes');
    expect(result.mimeType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(result.filename).toBe('Membership-Report.xlsx');
  });
});

describe('reports schema date-range cap', () => {
  it('accepts this feature\'s own default range (start-of-year to today, mid-year)', () => {
    expect(previewQuerySchema.safeParse({ reportType: 'membership', ...RANGE }).success).toBe(true);
  });

  it('accepts a literal two-year span that crosses a leap day', () => {
    const result = previewQuerySchema.safeParse({ reportType: 'membership', dateFrom: '2024-01-01', dateTo: '2026-01-01' });
    expect(result.success).toBe(true);
  });

  it('rejects a range one day past the two-year cap', () => {
    const result = previewQuerySchema.safeParse({ reportType: 'membership', dateFrom: '2024-01-01', dateTo: '2026-01-02' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['dateTo']);
      expect(result.error.issues[0]?.message).toMatch(/cannot exceed/);
    }
  });

  it('applies the same cap to the export schema', () => {
    const result = exportSchema.safeParse({ reportType: 'membership', dateFrom: '2020-01-01', dateTo: '2026-01-01', format: 'pdf' });
    expect(result.success).toBe(false);
  });
});
