import { beforeEach, describe, expect, it, vi } from 'vitest';

import { analyticsRepository } from '../src/modules/analytics/analytics.repository';
import { overviewQuerySchema } from '../src/modules/analytics/analytics.schema';
import { analyticsService } from '../src/modules/analytics/analytics.service';

function decimal(value: number) {
  return { toNumber: () => value };
}

const NOW = new Date();
const THIS_MONTH = new Date(NOW.getFullYear(), NOW.getMonth(), 15);

const TROOP_A = { id: 'troop-a', name: 'Troop 12 — Virac' };
const TROOP_B = { id: 'troop-b', name: 'Troop 4 — Bato' };

// Breakdown dimensions (2026-09-16 revision). `SCHOOL_B` deliberately holds a single
// member so the small-sample suppression path is exercised, and one member has no
// school/level at all so the "Unassigned" bucketing is covered too.
const SCHOOL_A = { id: 'school-a', name: 'CATSU' };
const SCHOOL_B = { id: 'school-b', name: 'CAVSU' };
const LEVEL_JUNIOR = { id: 'lvl-3', name: 'Junior Girl Scout', orderNumber: 3 };
const LEVEL_SENIOR = { id: 'lvl-4', name: 'Senior Girl Scout', orderNumber: 4 };

/** Scout levels with structured age bands (2026-09-16) — promotion readiness reads
 * these columns, never the prose in `description`. */
const SCOUT_LEVELS = [
  { ...LEVEL_JUNIOR, minAge: 10, maxAge: 12 },
  { ...LEVEL_SENIOR, minAge: 13, maxAge: 16 },
];

/** 11 years old today — inside Junior's 10-12 band, so not flagged for promotion. */
const BIRTH_IN_BAND = new Date(NOW.getFullYear() - 11, NOW.getMonth(), 1);
/** 15 today — past Junior's maxAge of 12, so over-age for that level. */
const BIRTH_OVER_AGE = new Date(NOW.getFullYear() - 15, NOW.getMonth(), 1);

const MEMBERS = [
  { id: 'm-1', createdAt: THIS_MONTH, troopId: TROOP_A.id, status: { name: 'active' }, birthDate: BIRTH_IN_BAND, school: SCHOOL_A, scoutLevel: LEVEL_JUNIOR },
  { id: 'm-2', createdAt: THIS_MONTH, troopId: TROOP_A.id, status: { name: 'pending' }, birthDate: BIRTH_IN_BAND, school: SCHOOL_A, scoutLevel: LEVEL_JUNIOR },
  {
    id: 'm-3',
    createdAt: new Date('2020-01-01T00:00:00Z'),
    troopId: TROOP_B.id,
    status: { name: 'active' },
    birthDate: BIRTH_IN_BAND,
    school: SCHOOL_B,
    scoutLevel: LEVEL_SENIOR,
  },
];

const CAT_OUTREACH = { id: 'cat-1', name: 'Community Outreach' };
const CAT_CAMPING = { id: 'cat-2', name: 'Camping' };

const memberRef = (troopId: string, school: typeof SCHOOL_A | null, scoutLevel: typeof LEVEL_JUNIOR | null) => ({
  troopId,
  school,
  scoutLevel,
});

const EVENTS = [
  {
    id: 'evt-1',
    title: 'Coastal Clean-Up Drive',
    eventDate: THIS_MONTH,
    category: CAT_OUTREACH,
    // Registrations carry their member from the R4 Participation step onward — per-school
    // participation and the active/inactive split need to know *who* registered. Both
    // are m-1 and m-3, so SCHOOL_A and SCHOOL_B each have exactly one active member.
    registrations: [
      { id: 'r-1', member: { id: 'm-1', school: SCHOOL_A } },
      { id: 'r-2', member: { id: 'm-3', school: SCHOOL_B } },
    ],
    attendanceRecords: [
      { attendanceStatus: 'present', member: memberRef(TROOP_A.id, SCHOOL_A, LEVEL_JUNIOR) },
      { attendanceStatus: 'present', member: memberRef(TROOP_A.id, SCHOOL_A, LEVEL_JUNIOR) },
      { attendanceStatus: 'absent', member: memberRef(TROOP_B.id, SCHOOL_B, LEVEL_SENIOR) },
    ],
  },
  {
    // No registrations and no attendance yet — an upcoming event that should not
    // count toward "events held" or the participation chart.
    id: 'evt-2',
    title: 'Upcoming Council Camp',
    eventDate: THIS_MONTH,
    category: CAT_CAMPING,
    registrations: [],
    attendanceRecords: [],
  },
];

const BADGE_CAT_SERVICE = { id: 'bc-1', name: 'Community Service' };
const BADGE_CAT_OUTDOOR = { id: 'bc-2', name: 'Outdoor Skills' };

const BADGE_CATALOG = [
  { id: 'b-1', name: 'Community Helper', category: BADGE_CAT_SERVICE },
  { id: 'b-2', name: 'Camp Cook', category: BADGE_CAT_OUTDOOR },
];

/** Badge rows carry the earner's name (R4 step 5) — the top-earners list is the one
 * place on the Badges tab that names individuals rather than groups. Attendance rows
 * still use the bare `memberRef`, which has no name to select. */
const badgeMemberRef = (
  id: string,
  firstName: string,
  lastName: string,
  troopId: string,
  school: typeof SCHOOL_A | null,
  scoutLevel: typeof LEVEL_JUNIOR | null,
) => ({ id, firstName, lastName, ...memberRef(troopId, school, scoutLevel) });

const MEMBER_BADGES = [
  { id: 'mb-1', badgeId: 'b-1', status: 'earned', member: badgeMemberRef('m-1', 'Ana', 'Cruz', TROOP_A.id, SCHOOL_A, LEVEL_JUNIOR) },
  { id: 'mb-2', badgeId: 'b-1', status: 'verified', member: badgeMemberRef('m-3', 'Bea', 'Reyes', TROOP_B.id, SCHOOL_B, LEVEL_SENIOR) },
  { id: 'mb-3', badgeId: 'b-2', status: 'in_progress', member: badgeMemberRef('m-2', 'Cira', 'Lim', TROOP_A.id, SCHOOL_A, LEVEL_JUNIOR) },
];

const TROOPS = [TROOP_A, TROOP_B];

const EXPENSE_CAT_CAMP = { id: 'ec-1', name: 'Camp' };

/** Default filters — the pre-revision behavior (6 months, all troops), so the
 * existing assertions below keep testing exactly what they always did. */
const DEFAULT_QUERY = { range: '6m', troopId: undefined } as const;

function mockRepository() {
  vi.spyOn(analyticsRepository, 'listMembers').mockResolvedValue(MEMBERS as never);
  vi.spyOn(analyticsRepository, 'listEventsWithDetail').mockResolvedValue(EVENTS as never);
  vi.spyOn(analyticsRepository, 'listBadgeCatalog').mockResolvedValue(BADGE_CATALOG as never);
  vi.spyOn(analyticsRepository, 'listMemberBadges').mockResolvedValue(MEMBER_BADGES as never);
  vi.spyOn(analyticsRepository, 'listTroops').mockResolvedValue(TROOPS as never);
  vi.spyOn(analyticsRepository, 'listScoutLevels').mockResolvedValue(SCOUT_LEVELS as never);
  // The council's full category vocabulary, independent of any filter — it defines what
  // "community" means rather than describing the current selection.
  vi.spyOn(analyticsRepository, 'listCategoryVocabularies').mockResolvedValue([
    [{ name: BADGE_CAT_SERVICE.name }, { name: BADGE_CAT_OUTDOOR.name }],
    [{ name: CAT_OUTREACH.name }, { name: CAT_CAMPING.name }],
  ] as never);
  vi.spyOn(analyticsRepository, 'paymentsSince').mockResolvedValue([
    { paymentDate: THIS_MONTH, amount: decimal(350), member: { school: SCHOOL_A } },
  ] as never);
  vi.spyOn(analyticsRepository, 'expensesSince').mockResolvedValue([
    { expenseDate: THIS_MONTH, amount: decimal(12500), category: null, expenseCategory: EXPENSE_CAT_CAMP, school: SCHOOL_A, event: null },
  ] as never);
}

describe('analyticsService.getOverview', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockRepository();
  });

  it('computes membership stats and a 6-month trend', async () => {
    const result = await analyticsService.getOverview(DEFAULT_QUERY);

    expect(result.membership.stats).toEqual([
      { id: 'totalMembers', label: 'Total Members', value: 3 },
      { id: 'active', label: 'Active', value: 2 },
      { id: 'pending', label: 'Pending', value: 1 },
      { id: 'newThisPeriod', label: 'New (in range)', value: 2 },
    ]);
    expect(result.membership.trend).toHaveLength(6);
    expect(result.membership.trend.at(-1)).toMatchObject({ value: 2 });
  });

  it('excludes events with no attendance records from Events Held and computes the rate', async () => {
    const result = await analyticsService.getOverview(DEFAULT_QUERY);

    expect(result.attendance.stats).toEqual([
      { id: 'eventsHeld', label: 'Events Held', value: 1 },
      { id: 'avgRate', label: 'Avg. Attendance Rate', value: '67%' },
      { id: 'totalPresent', label: 'Total Present', value: 2 },
      { id: 'totalAbsent', label: 'Total Absent', value: 1 },
    ]);
  });

  it('excludes events with no registrations from participation and rounds the per-event average', async () => {
    const result = await analyticsService.getOverview(DEFAULT_QUERY);

    expect(result.participation.stats).toEqual([
      { id: 'totalRegistrations', label: 'Total Registrations', value: 2 },
      { id: 'avgPerEvent', label: 'Avg. Registrants / Event', value: 2 },
      { id: 'avgAttendanceRate', label: 'Avg. Attendance Rate', value: '67%' },
    ]);
    expect(result.participation.byEvent).toEqual([
      { eventId: 'evt-1', eventTitle: 'Coastal Clean-Up Drive', registrations: 2, attendanceRate: 67 },
    ]);
  });

  it('computes badge completion rate relative to total members, including a 0% badge', async () => {
    const result = await analyticsService.getOverview(DEFAULT_QUERY);

    expect(result.badges.stats).toEqual([
      { id: 'totalAwarded', label: 'Badges Awarded', value: 2 },
      { id: 'verified', label: 'Verified', value: 1 },
      { id: 'inProgress', label: 'In Progress', value: 1 },
    ]);
    expect(result.badges.completionByBadge).toEqual([
      { badgeId: 'b-1', badgeName: 'Community Helper', completionRate: 67 },
      { badgeId: 'b-2', badgeName: 'Camp Cook', completionRate: 0 },
    ]);
  });

  // Post-revision semantics: the stat cards sum the *same in-range rows* that build
  // the trend, rather than reading all-time aggregates. Previously these asserted
  // 2100/20500 (lifetime totals) above a 6-month chart of 350/12500.
  it('sums financial stats from the in-range rows so they agree with the trend', async () => {
    const result = await analyticsService.getOverview(DEFAULT_QUERY);

    expect(result.financial.stats).toEqual([
      { id: 'income', label: 'Income (in range)', value: 350 },
      { id: 'expenses', label: 'Expenses (in range)', value: 12500 },
      { id: 'balance', label: 'Net (in range)', value: -12150 },
    ]);
    expect(result.financial.trend).toHaveLength(6);
    expect(result.financial.trend.at(-1)).toMatchObject({ income: 350, expense: 12500 });
  });

  it('computes per-troop performance and the org-wide top attendance rate', async () => {
    const result = await analyticsService.getOverview(DEFAULT_QUERY);

    expect(result.organization.stats).toEqual([
      { id: 'totalTroops', label: 'Total Troops', value: 2 },
      { id: 'avgMembersPerTroop', label: 'Avg. Members / Troop', value: 2 },
      { id: 'topAttendanceRate', label: 'Top Attendance Rate', value: '100%' },
    ]);
    expect(result.organization.troops).toEqual([
      { troopId: TROOP_A.id, troopName: TROOP_A.name, memberCount: 2, attendanceRate: 100, badgesEarned: 1 },
      { troopId: TROOP_B.id, troopName: TROOP_B.name, memberCount: 1, attendanceRate: 0, badgesEarned: 1 },
    ]);
  });
});

/** The 2026-09-02 filter revision. */
describe('analyticsService.getOverview — filters', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockRepository();
  });

  it('sizes every trend to the selected range', async () => {
    const threeMonths = await analyticsService.getOverview({ range: '3m', troopId: undefined });
    expect(threeMonths.membership.trend).toHaveLength(3);
    expect(threeMonths.attendance.trend).toHaveLength(3);
    expect(threeMonths.financial.trend).toHaveLength(3);

    const twelveMonths = await analyticsService.getOverview({ range: '12m', troopId: undefined });
    expect(twelveMonths.membership.trend).toHaveLength(12);
    expect(twelveMonths.financial.trend).toHaveLength(12);
  });

  it('sizes the "this year" range to the number of elapsed calendar months', async () => {
    const result = await analyticsService.getOverview({ range: 'ytd', troopId: undefined });
    expect(result.membership.trend).toHaveLength(new Date().getMonth() + 1);
  });

  it('labels 12-month buckets with the year so repeated month names stay distinct', async () => {
    const result = await analyticsService.getOverview({ range: '12m', troopId: undefined });
    const labels = result.membership.trend.map((point) => point.label);

    expect(new Set(labels).size).toBe(12);
    // e.g. "Sep 25" — short month plus 2-digit year.
    labels.forEach((label) => expect(label).toMatch(/^[A-Z][a-z]{2} \d{2}$/));
  });

  it('keeps 6-month bucket labels bare, since they cannot repeat a month', async () => {
    const result = await analyticsService.getOverview(DEFAULT_QUERY);
    result.membership.trend.forEach((point) => expect(point.label).toMatch(/^[A-Z][a-z]{2}$/));
  });

  it('pushes the range cutoff and troop filter down into the repository', async () => {
    await analyticsService.getOverview({ range: '3m', troopId: TROOP_A.id });

    // Filters travel as one scope object since the 2026-09-16 R4 revision widened
    // them past `troopId`; `objectContaining` so adding a future dimension to the
    // scope does not break this assertion about the troop filter specifically.
    expect(analyticsRepository.listMembers).toHaveBeenCalledWith(expect.objectContaining({ troopId: TROOP_A.id }));
    expect(analyticsRepository.listMemberBadges).toHaveBeenCalledWith(expect.objectContaining({ troopId: TROOP_A.id }));

    const expectedCutoff = new Date(NOW.getFullYear(), NOW.getMonth() - 2, 1);
    expect(analyticsRepository.paymentsSince).toHaveBeenCalledWith(expectedCutoff, expect.anything());
    expect(analyticsRepository.listEventsWithDetail).toHaveBeenCalledWith(
      expectedCutoff,
      expect.objectContaining({ troopId: TROOP_A.id }),
    );
  });

  it('builds the Organization tab from unscoped rows even when a troop is selected', async () => {
    const result = await analyticsService.getOverview({ range: '6m', troopId: TROOP_A.id });

    // Both troops still present — scoping this tab to one troop would collapse the
    // only view that answers "how do troops compare?".
    expect(result.organization.troops).toHaveLength(2);

    // Two fetches: one scoped to the selected troop for the other five tabs, and a
    // second unscoped one (called with no argument) that feeds this tab.
    expect(analyticsRepository.listMembers).toHaveBeenCalledTimes(2);
    expect(analyticsRepository.listMembers).toHaveBeenNthCalledWith(1, expect.objectContaining({ troopId: TROOP_A.id }));
    expect(analyticsRepository.listMembers).toHaveBeenNthCalledWith(2);
  });

  it('does not double-fetch for the Organization tab when no troop is selected', async () => {
    await analyticsService.getOverview(DEFAULT_QUERY);

    // The unscoped rows are already the scoped rows, so the extra org-only queries
    // must be skipped rather than run twice for identical results.
    expect(analyticsRepository.listMembers).toHaveBeenCalledTimes(1);
    expect(analyticsRepository.listEventsWithDetail).toHaveBeenCalledTimes(1);
    expect(analyticsRepository.listMemberBadges).toHaveBeenCalledTimes(1);
  });

  it('does not scope council finances by troop', async () => {
    await analyticsService.getOverview({ range: '6m', troopId: TROOP_A.id });

    // `Expense` has no troop association in the schema at all, so the troop filter
    // must never reach the money queries — the UI disables it on that tab to match.
    // Asserted as "the key is absent from the scope" rather than "no second argument"
    // since R4: the money queries do now take a scope (school / activity / expense
    // category are all attributable), so the invariant is about which keys survive.
    const [, paymentScope] = vi.mocked(analyticsRepository.paymentsSince).mock.calls[0]!;
    const [, expenseScope] = vi.mocked(analyticsRepository.expensesSince).mock.calls[0]!;
    expect(paymentScope).not.toHaveProperty('troopId');
    expect(expenseScope).not.toHaveProperty('troopId');
  });
});

describe('overviewQuerySchema', () => {
  it('defaults to a 6-month, all-troops view when nothing is supplied', () => {
    const result = overviewQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    expect(result.data?.range).toBe('6m');
    // Every filter — the original troop one and the R4 dimension ones — defaults to
    // "no filter", so the pre-R4 empty request still means exactly what it did.
    expect(Object.values(result.data ?? {}).filter((value) => value !== '6m').every((value) => value === undefined)).toBe(true);
  });

  it('rejects an unknown range rather than silently falling back', () => {
    expect(overviewQuerySchema.safeParse({ range: '24m' }).success).toBe(false);
  });

  it('rejects a non-uuid troopId', () => {
    expect(overviewQuerySchema.safeParse({ range: '6m', troopId: 'all' }).success).toBe(false);
  });

  it('treats an empty troopId as no filter', () => {
    const result = overviewQuerySchema.safeParse({ range: '6m', troopId: '' });
    expect(result.success).toBe(true);
    expect(result.data?.troopId).toBeUndefined();
  });

  // ── R4 per-tab dimension filters (2026-09-16) ──────────────────────────
  it('accepts every per-tab dimension filter', () => {
    // Real uuids here rather than the service fixtures' readable ids ('school-a'),
    // since this block tests the schema itself and the contract is uuid-shaped.
    const uuid = (n: number) => `0000000${n}-0000-4000-8000-000000000000`;
    const result = overviewQuerySchema.safeParse({
      range: '6m',
      schoolId: uuid(1),
      scoutLevelId: uuid(2),
      status: 'active',
      activityCategoryId: uuid(3),
      badgeCategoryId: uuid(4),
      expenseCategoryId: uuid(5),
    });
    expect(result.success).toBe(true);
    expect(result.data?.schoolId).toBe(uuid(1));
    expect(result.data?.status).toBe('active');
  });

  it('rejects a non-uuid dimension filter rather than ignoring it', () => {
    // Silently dropping a malformed filter is worse than rejecting it: the page would
    // render council-wide totals while the UI still showed the filter as applied.
    expect(overviewQuerySchema.safeParse({ range: '6m', schoolId: 'not-a-uuid' }).success).toBe(false);
    expect(overviewQuerySchema.safeParse({ range: '6m', badgeCategoryId: 'all' }).success).toBe(false);
  });

  it('treats every empty dimension filter as no filter, matching the troop sentinel', () => {
    const result = overviewQuerySchema.safeParse({
      range: '6m',
      schoolId: '',
      scoutLevelId: '',
      status: '',
      activityCategoryId: '',
      badgeCategoryId: '',
      expenseCategoryId: '',
    });
    expect(result.success).toBe(true);
    expect(result.data?.schoolId).toBeUndefined();
    expect(result.data?.status).toBeUndefined();
    expect(result.data?.expenseCategoryId).toBeUndefined();
  });
});

describe('analyticsService.getOverview — per-tab dimension filters (R4)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockRepository();
  });

  it('pushes each member-shaped filter down into every member-rooted query', async () => {
    await analyticsService.getOverview({
      ...DEFAULT_QUERY,
      schoolId: SCHOOL_A.id,
      scoutLevelId: LEVEL_JUNIOR.id,
      status: 'active',
    });

    // Members, attendance and badges all reach school/level/status through `Member`,
    // so all three queries must carry the same scope — a filter honoured by one and
    // dropped by another is how a tab ends up disagreeing with its own filter bar.
    const scope = expect.objectContaining({
      schoolId: SCHOOL_A.id,
      scoutLevelId: LEVEL_JUNIOR.id,
      status: 'active',
    });
    expect(analyticsRepository.listMembers).toHaveBeenNthCalledWith(1, scope);
    expect(analyticsRepository.listMemberBadges).toHaveBeenNthCalledWith(1, scope);
    expect(analyticsRepository.listEventsWithDetail).toHaveBeenNthCalledWith(1, expect.any(Date), scope);
  });

  it('passes the activity and expense filters to the money queries but not troop or level', async () => {
    await analyticsService.getOverview({
      ...DEFAULT_QUERY,
      troopId: TROOP_A.id,
      scoutLevelId: LEVEL_JUNIOR.id,
      schoolId: SCHOOL_A.id,
      expenseCategoryId: EXPENSE_CAT_CAMP.id,
    });

    const [, expenseScope] = vi.mocked(analyticsRepository.expensesSince).mock.calls[0]!;
    // Attributable since the R3b migration.
    expect(expenseScope).toMatchObject({ schoolId: SCHOOL_A.id, expenseCategoryId: EXPENSE_CAT_CAMP.id });
    // Not attributable — no troop or scout-level association exists on the money side.
    expect(expenseScope).not.toHaveProperty('troopId');
    expect(expenseScope).not.toHaveProperty('scoutLevelId');
  });

  it('builds the Organization tab from unscoped rows when a dimension filter is applied', async () => {
    const result = await analyticsService.getOverview({ ...DEFAULT_QUERY, schoolId: SCHOOL_A.id });

    // Before R4 the extra unscoped read was keyed off `troopId` alone; a school filter
    // would have left Organization quietly comparing troops *within that school* while
    // presenting itself as the council-wide comparison.
    expect(analyticsRepository.listMembers).toHaveBeenCalledTimes(2);
    expect(analyticsRepository.listMembers).toHaveBeenNthCalledWith(2);
    expect(result.organization.troops).toHaveLength(2);
  });

  it('still skips the double fetch when no filter of any kind is applied', async () => {
    await analyticsService.getOverview(DEFAULT_QUERY);
    expect(analyticsRepository.listMembers).toHaveBeenCalledTimes(1);
  });
});

describe('analyticsService.getOverview — Financial tab breakdowns (R4 step 2)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockRepository();
  });

  it('breaks the tab down by school, category and activity instead of totals alone', async () => {
    const result = await analyticsService.getOverview(DEFAULT_QUERY);

    // The point of the revision: this tab used to carry `stats` + `trend` and nothing
    // else, which is four totals split by nothing.
    expect(result.financial.incomeBySchool).toEqual([
      expect.objectContaining({ label: SCHOOL_A.name, amount: 350, share: 100 }),
    ]);
    expect(result.financial.expenseBySchool).toEqual([
      expect.objectContaining({ label: SCHOOL_A.name, amount: 12500 }),
    ]);
    expect(result.financial.expenseByCategory).toEqual([
      expect.objectContaining({ label: EXPENSE_CAT_CAMP.name, amount: 12500 }),
    ]);
  });

  it('serves the Financial tab and the Decisions tab from one computation', async () => {
    const result = await analyticsService.getOverview(DEFAULT_QUERY);

    // Same numbers on the same page: two implementations of "spending by school"
    // would be two chances to disagree, so the builder is shared.
    expect(result.financial.expenseBySchool).toEqual(result.decisionSupport.expenseBySchool);
    expect(result.financial.incomeBySchool).toEqual(result.decisionSupport.incomeBySchool);
    expect(result.financial.schoolFinance).toEqual(result.decisionSupport.schoolFinance);
  });

  it('nets income against spending per school', async () => {
    const result = await analyticsService.getOverview(DEFAULT_QUERY);

    expect(result.financial.schoolFinance).toEqual([
      expect.objectContaining({ label: SCHOOL_A.name, income: 350, expense: 12500, net: -12150 }),
    ]);
  });

  it('keeps unattributed spending visible as Council-wide rather than dropping it', async () => {
    vi.mocked(analyticsRepository.expensesSince).mockResolvedValue([
      { expenseDate: THIS_MONTH, amount: decimal(4000), category: null, expenseCategory: EXPENSE_CAT_CAMP, school: null, event: null },
    ] as never);

    const result = await analyticsService.getOverview(DEFAULT_QUERY);

    // A genuinely council-wide cost belongs to no school. Hiding it would understate
    // total spending; guessing a school would be worse.
    expect(result.financial.expenseBySchool).toEqual([
      expect.objectContaining({ id: 'unassigned', amount: 4000 }),
    ]);
    // …but it is not a school, so it must not become a row in the per-school
    // comparison. CATSU still appears there on the strength of its income alone,
    // with zero spending — which is the honest reading, not a bug: this school
    // genuinely has no attributed costs in range.
    expect(result.financial.schoolFinance).toEqual([
      expect.objectContaining({ label: SCHOOL_A.name, income: 350, expense: 0, net: 350 }),
    ]);
    expect(result.financial.schoolFinance.some((row) => row.id === 'unassigned')).toBe(false);
  });

  it('narrows the breakdowns when a dimension filter is applied', async () => {
    await analyticsService.getOverview({ ...DEFAULT_QUERY, expenseCategoryId: EXPENSE_CAT_CAMP.id });

    const [, scope] = vi.mocked(analyticsRepository.expensesSince).mock.calls[0]!;
    expect(scope).toMatchObject({ expenseCategoryId: EXPENSE_CAT_CAMP.id });
  });
});

describe('analyticsService.getOverview — Membership tab breakdowns (R4 step 3)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockRepository();
  });

  it('splits the roster by school, level and status instead of totals alone', async () => {
    const result = await analyticsService.getOverview(DEFAULT_QUERY);

    expect(result.membership.bySchool).toEqual([
      expect.objectContaining({ label: SCHOOL_A.name, memberCount: 2 }),
      expect.objectContaining({ label: SCHOOL_B.name, memberCount: 1 }),
    ]);
    expect(result.membership.byLevel.map((row) => row.label)).toEqual([LEVEL_JUNIOR.name, LEVEL_SENIOR.name]);
    expect(result.membership.byStatus).toEqual([
      expect.objectContaining({ label: 'active', memberCount: 2, share: 67 }),
      expect.objectContaining({ label: 'pending', memberCount: 1, share: 33 }),
    ]);
  });

  it('keeps level order as the curriculum progression, not by size', async () => {
    // Junior (2 members) and Senior (1) happen to sort the same either way here, so
    // assert against the orderNumber contract rather than the incidental counts.
    const result = await analyticsService.getOverview(DEFAULT_QUERY);
    const levels = result.membership.byLevel;
    expect(levels[0]?.label).toBe(LEVEL_JUNIOR.name);
    expect(levels[1]?.label).toBe(LEVEL_SENIOR.name);
  });

  it('reuses the shared breakdown rather than recomputing the same slices', async () => {
    const result = await analyticsService.getOverview(DEFAULT_QUERY);
    expect(result.membership.bySchool).toEqual(result.breakdown.bySchool);
    expect(result.membership.byLevel).toEqual(result.breakdown.byLevel);
  });

  it('names every status on the roster, including ones no stat card counts', async () => {
    vi.mocked(analyticsRepository.listMembers).mockResolvedValue([
      ...MEMBERS,
      { id: 'm-4', createdAt: THIS_MONTH, troopId: TROOP_A.id, status: { name: 'expired' }, birthDate: BIRTH_IN_BAND, school: SCHOOL_A, scoutLevel: LEVEL_JUNIOR },
    ] as never);

    const result = await analyticsService.getOverview(DEFAULT_QUERY);

    // "Expired" is inside Total Members but named by none of the four stat cards, so
    // without this row the cards visibly fail to add up and the gap is invisible.
    expect(result.membership.byStatus.map((row) => row.label)).toContain('expired');
    expect(result.membership.byStatus.reduce((sum, row) => sum + row.memberCount, 0)).toBe(4);
  });
});

describe('analyticsService.getOverview — Participation tab breakdowns (R4 step 4)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockRepository();
  });

  it('breaks participation down by activity type, reusing the shared breakdown rows', async () => {
    const result = await analyticsService.getOverview(DEFAULT_QUERY);

    // Same objects the Decisions tab ranks — computed once, not recomputed per tab.
    expect(result.participation.byActivityType).toEqual(result.breakdown.byActivityCategory);
    expect(result.participation.byActivityType.find((r) => r.label === 'Community Outreach')).toMatchObject({
      eventCount: 1,
      heldEvents: 1,
      registrations: 2,
    });
  });

  it('splits members into active and inactive per school, keeping schools with no registrations', async () => {
    const result = await analyticsService.getOverview(DEFAULT_QUERY);

    const catsu = result.participation.bySchool.find((row) => row.label === 'CATSU');
    // SCHOOL_A has 2 members (m-1, m-2) but only m-1 registered, so the other is
    // genuinely inactive — the figure the council-wide registration total hides.
    expect(catsu).toMatchObject({ memberCount: 2, activeMembers: 1, participationRate: 50, registrations: 1 });

    const cavsu = result.participation.bySchool.find((row) => row.label === 'CAVSU');
    expect(cavsu).toMatchObject({ memberCount: 1, activeMembers: 1, participationRate: 100 });
  });

  it('counts a member who registered for several events as one active member', async () => {
    // A counter rather than a set would report 2 active members out of 2 here and call
    // a half-inactive school fully engaged.
    vi.spyOn(analyticsRepository, 'listEventsWithDetail').mockResolvedValue([
      {
        ...EVENTS[0],
        registrations: [
          { id: 'r-1', member: { id: 'm-1', school: SCHOOL_A } },
          { id: 'r-2', member: { id: 'm-1', school: SCHOOL_A } },
        ],
      },
    ] as never);

    const result = await analyticsService.getOverview(DEFAULT_QUERY);

    expect(result.participation.bySchool.find((row) => row.label === 'CATSU')).toMatchObject({
      memberCount: 2,
      activeMembers: 1,
      registrations: 2,
      participationRate: 50,
    });
  });

  it('keeps a school with zero registrations in the comparison rather than dropping it', async () => {
    vi.spyOn(analyticsRepository, 'listEventsWithDetail').mockResolvedValue([
      { ...EVENTS[0], registrations: [{ id: 'r-1', member: { id: 'm-1', school: SCHOOL_A } }], attendanceRecords: [] },
    ] as never);

    const result = await analyticsService.getOverview(DEFAULT_QUERY);

    // A school where nobody took part is the interesting row; grouping by registration
    // instead of by roster would make it vanish exactly when it matters.
    const cavsu = result.participation.bySchool.find((row) => row.label === 'CAVSU');
    expect(cavsu).toMatchObject({ memberCount: 1, activeMembers: 0, participationRate: 0, registrations: 0 });
    // And no attendance records means no data, not 0% turnout.
    expect(cavsu?.attendanceRecords).toBe(0);
  });

  it('reports community engagement from the named badge and activity categories', async () => {
    const { participation } = await analyticsService.getOverview(DEFAULT_QUERY);
    const { community } = participation;

    expect(community.badgeCategories).toEqual(['Community Service']);
    expect(community.activityCategories).toEqual(['Community Outreach']);
    // b-1 is a Community Service badge, earned by m-1 and verified by m-3; evt-1 is the
    // outreach event with 2 registrations.
    expect(community.communityBadgesEarned).toBe(2);
    expect(community.communityEvents).toBe(1);
    expect(community.communityRegistrations).toBe(2);
  });

  it('counts a member as engaged via either a community badge or an outreach registration', async () => {
    const { participation } = await analyticsService.getOverview(DEFAULT_QUERY);
    const { community } = participation;

    // m-1 did both; requiring both signals would undercount everyone who did one.
    expect(community.bySchool.find((row) => row.label === 'CATSU')).toMatchObject({
      memberCount: 2,
      engagedMembers: 1,
      engagementRate: 50,
      communityBadgesEarned: 1,
      communityRegistrations: 1,
    });
  });

  it('reports no community categories rather than zero engagement when none are configured', async () => {
    // A council that renamed or never created these categories must not be told its
    // members do no community work — that is a claim this data cannot support.
    vi.spyOn(analyticsRepository, 'listCategoryVocabularies').mockResolvedValue([
      [{ name: BADGE_CAT_OUTDOOR.name }],
      [{ name: CAT_CAMPING.name }],
    ] as never);
    vi.spyOn(analyticsRepository, 'listBadgeCatalog').mockResolvedValue([
      { id: 'b-2', name: 'Camp Cook', category: BADGE_CAT_OUTDOOR },
    ] as never);
    vi.spyOn(analyticsRepository, 'listEventsWithDetail').mockResolvedValue([
      { ...EVENTS[0], category: CAT_CAMPING },
    ] as never);

    const { participation } = await analyticsService.getOverview(DEFAULT_QUERY);
    const { community } = participation;

    expect(community.badgeCategories).toEqual([]);
    expect(community.activityCategories).toEqual([]);
    expect(community.communityBadgesEarned).toBe(0);
    expect(community.communityRegistrations).toBe(0);
  });

  it('matches community categories case-insensitively and ignores surrounding whitespace', async () => {
    vi.spyOn(analyticsRepository, 'listCategoryVocabularies').mockResolvedValue([
      [{ name: BADGE_CAT_SERVICE.name }],
      [{ name: '  community outreach  ' }],
    ] as never);
    vi.spyOn(analyticsRepository, 'listEventsWithDetail').mockResolvedValue([
      { ...EVENTS[0], category: { id: 'cat-x', name: '  community outreach  ' } },
    ] as never);

    const { participation } = await analyticsService.getOverview(DEFAULT_QUERY);
    const { community } = participation;

    expect(community.communityEvents).toBe(1);
    expect(community.communityRegistrations).toBe(2);
    expect(community.activityCategories).toEqual(['  community outreach  ']);
  });

  it('states the same community definition regardless of which filter is applied', async () => {
    // Caught in the browser during this step: the stated categories were derived from
    // the *filtered* events, so narrowing to Camping rewrote the card's own definition
    // of "community" ("counted from the Community Service category") while the badge
    // figure beside it stayed put. A filter changes the numbers, never what the numbers
    // claim to be.
    const unfiltered = await analyticsService.getOverview(DEFAULT_QUERY);
    const filtered = await analyticsService.getOverview({ ...DEFAULT_QUERY, activityCategoryId: CAT_CAMPING.id } as never);

    expect(filtered.participation.community.badgeCategories).toEqual(unfiltered.participation.community.badgeCategories);
    expect(filtered.participation.community.activityCategories).toEqual(unfiltered.participation.community.activityCategories);
    expect(filtered.participation.community.activityCategories).toContain('Community Outreach');
  });
});

describe('analyticsService.getOverview — Badges tab breakdowns (R4 step 5)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockRepository();
  });

  it('breaks badges down by area, reusing the shared breakdown rows', async () => {
    const result = await analyticsService.getOverview(DEFAULT_QUERY);

    // Same objects the Decisions tab ranks for strongest/weakest area — computed once,
    // so the two surfaces cannot report different winners.
    expect(result.badges.byArea).toEqual(result.breakdown.byBadgeCategory);

    // b-1 (Community Service) has one earned + one verified; both count.
    expect(result.badges.byArea.find((row) => row.label === 'Community Service')).toMatchObject({
      badgesEarned: 2,
      memberCount: 2,
    });
  });

  it('keeps a badge area nobody has earned in, at zero, rather than dropping it', async () => {
    const result = await analyticsService.getOverview(DEFAULT_QUERY);

    // Outdoor Skills' only badge is in_progress, so nothing is earned there. An area
    // nobody has started is precisely what "weakest area" means — dropping it would
    // hide the answer to the question the tab exists to ask.
    expect(result.badges.byArea.find((row) => row.label === 'Outdoor Skills')).toMatchObject({
      badgesEarned: 0,
      memberCount: 0,
    });
  });

  it('breaks badges down by scout level in curriculum order, reusing the shared rows', async () => {
    const result = await analyticsService.getOverview(DEFAULT_QUERY);

    expect(result.badges.byLevel).toEqual(result.breakdown.byLevel);
    // Junior before Senior — level order follows the curriculum, never badge count,
    // so "where does the pipeline thin out?" stays readable.
    const labels = result.badges.byLevel.map((row) => row.label);
    expect(labels.indexOf(LEVEL_JUNIOR.name)).toBeLessThan(labels.indexOf(LEVEL_SENIOR.name));
  });

  it('ranks top earners by earned/verified badges only, excluding in-progress', async () => {
    const result = await analyticsService.getOverview(DEFAULT_QUERY);

    // Cira's only badge is in_progress — an intention, not an achievement. Ranking by
    // intentions would place someone who starts everything above someone who finishes.
    expect(result.badges.topEarners.map((earner) => earner.memberName)).toEqual(['Ana Cruz', 'Bea Reyes']);
    expect(result.badges.topEarners.every((earner) => earner.badgesEarned > 0)).toBe(true);
  });

  it('carries each top earner\'s school and level so the list is actionable', async () => {
    const result = await analyticsService.getOverview(DEFAULT_QUERY);

    expect(result.badges.topEarners[0]).toMatchObject({
      memberId: 'm-1',
      memberName: 'Ana Cruz',
      school: SCHOOL_A.name,
      scoutLevel: LEVEL_JUNIOR.name,
      badgesEarned: 1,
    });
  });

  it('counts a member once per badge, not once per row, and breaks ties by name', async () => {
    vi.spyOn(analyticsRepository, 'listMemberBadges').mockResolvedValue([
      { id: 'mb-1', badgeId: 'b-1', status: 'earned', member: badgeMemberRef('m-1', 'Zoe', 'Santos', TROOP_A.id, SCHOOL_A, LEVEL_JUNIOR) },
      { id: 'mb-2', badgeId: 'b-2', status: 'verified', member: badgeMemberRef('m-1', 'Zoe', 'Santos', TROOP_A.id, SCHOOL_A, LEVEL_JUNIOR) },
      { id: 'mb-3', badgeId: 'b-1', status: 'earned', member: badgeMemberRef('m-2', 'Aria', 'Diaz', TROOP_A.id, SCHOOL_A, LEVEL_JUNIOR) },
      { id: 'mb-4', badgeId: 'b-2', status: 'earned', member: badgeMemberRef('m-3', 'Bea', 'Reyes', TROOP_B.id, SCHOOL_B, LEVEL_SENIOR) },
    ] as never);

    const result = await analyticsService.getOverview(DEFAULT_QUERY);

    // Zoe's two badges aggregate into one row of 2. Aria and Bea tie at 1 and sort by
    // name, so the order is stable between requests rather than looking like movement.
    expect(result.badges.topEarners.map((e) => [e.memberName, e.badgesEarned])).toEqual([
      ['Zoe Santos', 2],
      ['Aria Diaz', 1],
      ['Bea Reyes', 1],
    ]);
  });

  it('leaves the member roster whole when a badge area filter is applied', async () => {
    // A badge area is a property of the badge, not of the member who earned it, so
    // filtering to one area must not make levels lose members — otherwise the tab
    // would report a shrinking council every time someone asked about Leadership.
    const result = await analyticsService.getOverview({ ...DEFAULT_QUERY, badgeCategoryId: BADGE_CAT_SERVICE.id } as never);

    const unfiltered = await analyticsService.getOverview(DEFAULT_QUERY);
    expect(result.badges.byLevel.map((row) => row.memberCount)).toEqual(unfiltered.badges.byLevel.map((row) => row.memberCount));
  });
});

// ─────────────────────────────────────────────────────────────
// Breakdown dimensions + Decision-Making (2026-09-16 revision)
// ─────────────────────────────────────────────────────────────

describe('analyticsService.getOverview — breakdown dimensions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockRepository();
  });

  it('groups members by school, folding in attendance reached through the member', async () => {
    const { breakdown } = await analyticsService.getOverview(DEFAULT_QUERY);

    // CATSU: 2 members, both present at evt-1 → 100%. CAVSU: 1 member, absent → 0%.
    expect(breakdown.bySchool).toEqual([
      { id: 'school-a', label: 'CATSU', memberCount: 2, attendanceRate: 100, attendanceRecords: 2, badgesEarned: 1, badgesPerMember: 0.5 },
      { id: 'school-b', label: 'CAVSU', memberCount: 1, attendanceRate: 0, attendanceRecords: 1, badgesEarned: 1, badgesPerMember: 1 },
    ]);
  });

  it('orders levels by curriculum order, not by member count', async () => {
    const { breakdown } = await analyticsService.getOverview(DEFAULT_QUERY);

    // Junior (orderNumber 3) before Senior (4) — a level breakdown reads as a
    // progression, so it must not be reordered by size.
    expect(breakdown.byLevel.map((row) => row.label)).toEqual(['Junior Girl Scout', 'Senior Girl Scout']);
  });

  it('buckets members with no school under an explicit label rather than dropping them', async () => {
    vi.spyOn(analyticsRepository, 'listMembers').mockResolvedValue([
      ...MEMBERS,
      { id: 'm-4', createdAt: THIS_MONTH, troopId: TROOP_A.id, status: { name: 'active' }, birthDate: null, school: null, scoutLevel: null },
    ] as never);

    const { breakdown } = await analyticsService.getOverview(DEFAULT_QUERY);
    const unassigned = breakdown.bySchool.find((row) => row.id === 'unassigned');

    expect(unassigned).toMatchObject({ label: 'No school recorded', memberCount: 1 });
    // The council total is preserved — a breakdown must not silently lose rows.
    expect(breakdown.bySchool.reduce((sum, row) => sum + row.memberCount, 0)).toBe(4);
  });

  it('keeps a badge area with zero earned badges visible, since that is what needs improvement', async () => {
    const { breakdown } = await analyticsService.getOverview(DEFAULT_QUERY);
    const outdoor = breakdown.byBadgeCategory.find((row) => row.label === 'Outdoor Skills');

    // Camp Cook is only `in_progress`, so Outdoor Skills has earned nothing — and
    // must still appear rather than being absent from the breakdown entirely.
    expect(outdoor).toMatchObject({ badgesEarned: 0 });
  });

  it('groups activity types by event and counts registrations', async () => {
    const { breakdown } = await analyticsService.getOverview(DEFAULT_QUERY);

    expect(breakdown.byActivityCategory).toEqual([
      { id: 'cat-1', label: 'Community Outreach', eventCount: 1, heldEvents: 1, registrations: 2, attendanceRate: 67 },
      { id: 'cat-2', label: 'Camping', eventCount: 1, heldEvents: 0, registrations: 0, attendanceRate: 0 },
    ]);
  });
});

describe('analyticsService.getOverview — decision support', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockRepository();
  });

  it('never ranks a group below the minimum sample size, listing it as suppressed instead', async () => {
    const { decisionSupport } = await analyticsService.getOverview(DEFAULT_QUERY);

    // CAVSU has 1 member at 0% attendance. Left unguarded it would be reported as
    // the council's worst school — exactly the wrong decision to prompt.
    expect(decisionSupport.suppressed).toContainEqual(expect.objectContaining({ label: 'CAVSU', memberCount: 1 }));
    const participationInsight = decisionSupport.insights.find((i) => i.id === 'school-low-participation');
    expect(participationInsight?.title ?? '').not.toContain('CAVSU');
  });

  it('flags a school with genuinely low participation once it clears the sample threshold', async () => {
    vi.spyOn(analyticsRepository, 'listMembers').mockResolvedValue([
      ...MEMBERS,
      { id: 'm-4', createdAt: THIS_MONTH, troopId: TROOP_B.id, status: { name: 'active' }, birthDate: BIRTH_IN_BAND, school: SCHOOL_B, scoutLevel: LEVEL_SENIOR },
      { id: 'm-5', createdAt: THIS_MONTH, troopId: TROOP_B.id, status: { name: 'active' }, birthDate: BIRTH_IN_BAND, school: SCHOOL_B, scoutLevel: LEVEL_SENIOR },
    ] as never);

    const { decisionSupport } = await analyticsService.getOverview(DEFAULT_QUERY);
    const insight = decisionSupport.insights.find((i) => i.id === 'school-low-participation');

    // CAVSU now has 3 members (the threshold) at 0% attendance → critical. The
    // school is named in the title; the detail carries the figures behind it.
    expect(insight).toMatchObject({ severity: 'critical', category: 'participation' });
    expect(insight?.title).toContain('CAVSU');
    expect(insight?.detail).toContain('3 members');
    expect(insight?.metric).toBe('0% attendance');
  });

  it('sorts insights most-severe first', async () => {
    const { decisionSupport } = await analyticsService.getOverview(DEFAULT_QUERY);
    const order = { critical: 0, warning: 1, info: 2 };
    const severities = decisionSupport.insights.map((i) => order[i.severity]);

    expect(severities).toEqual([...severities].sort((a, b) => a - b));
  });

  it('attributes both income and expenses by school, and nets them for comparison', async () => {
    const { decisionSupport } = await analyticsService.getOverview(DEFAULT_QUERY);

    expect(decisionSupport.incomeBySchool).toEqual([{ id: 'school-a', label: 'CATSU', amount: 350, share: 100 }]);
    expect(decisionSupport.expenseByCategory).toEqual([{ id: 'ec-1', label: 'Camp', amount: 12500, share: 100 }]);
    // Attribution became derivable with the 2026-09-16 migration — before it, Expense
    // had no school FK and this comparison could not be built at all.
    expect(decisionSupport.expenseBySchool).toEqual([{ id: 'school-a', label: 'CATSU', amount: 12500, share: 100 }]);
    expect(decisionSupport.schoolFinance).toEqual([
      { id: 'school-a', label: 'CATSU', income: 350, expense: 12500, net: -12150 },
    ]);
  });

  it('reports unattributed spending as Council-wide rather than hiding or guessing it', async () => {
    vi.spyOn(analyticsRepository, 'expensesSince').mockResolvedValue([
      { expenseDate: THIS_MONTH, amount: decimal(2600), category: null, expenseCategory: null, school: null, event: null },
    ] as never);

    const { decisionSupport } = await analyticsService.getOverview(DEFAULT_QUERY);

    expect(decisionSupport.expenseBySchool).toEqual([{ id: 'unassigned', label: 'Council-wide', amount: 2600, share: 100 }]);
    // "Council-wide" is not a school, so it must never become a comparison row. CATSU
    // still appears — it has income — but with zero attributed spend against it.
    expect(decisionSupport.schoolFinance).toEqual([
      { id: 'school-a', label: 'CATSU', income: 350, expense: 0, net: 350 },
    ]);
  });

  it('labels an uncategorized expense rather than dropping it from the total', async () => {
    vi.spyOn(analyticsRepository, 'expensesSince').mockResolvedValue([
      { expenseDate: THIS_MONTH, amount: decimal(100), category: null, expenseCategory: null, school: null, event: null },
      { expenseDate: THIS_MONTH, amount: decimal(300), category: '  ', expenseCategory: null, school: null, event: null },
    ] as never);

    const { decisionSupport } = await analyticsService.getOverview(DEFAULT_QUERY);

    expect(decisionSupport.expenseByCategory).toEqual([{ id: 'unassigned', label: 'Uncategorized', amount: 400, share: 100 }]);
  });

  it('reports pending approvals as an actionable membership insight', async () => {
    const { decisionSupport } = await analyticsService.getOverview(DEFAULT_QUERY);
    const insight = decisionSupport.insights.find((i) => i.id === 'pending-approvals');

    expect(insight).toMatchObject({ category: 'membership', metric: '1 pending' });
    expect(insight?.title).toBe('1 membership awaiting approval');
  });

  it('flags nothing when there is no data to judge', async () => {
    vi.spyOn(analyticsRepository, 'listMembers').mockResolvedValue([] as never);
    vi.spyOn(analyticsRepository, 'listEventsWithDetail').mockResolvedValue([] as never);
    vi.spyOn(analyticsRepository, 'listMemberBadges').mockResolvedValue([] as never);
    vi.spyOn(analyticsRepository, 'listBadgeCatalog').mockResolvedValue([] as never);
    vi.spyOn(analyticsRepository, 'paymentsSince').mockResolvedValue([] as never);
    vi.spyOn(analyticsRepository, 'expensesSince').mockResolvedValue([] as never);

    const { decisionSupport } = await analyticsService.getOverview(DEFAULT_QUERY);

    expect(decisionSupport.insights).toEqual([]);
    expect(decisionSupport.suppressed).toEqual([]);
    expect(decisionSupport.incomeBySchool).toEqual([]);
  });
});

describe('analyticsService.getOverview — no-data vs. zero-turnout guards', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockRepository();
  });

  it('does not flag an activity type whose only events have not been held yet', async () => {
    // Camping has registrations but no attendance records — an upcoming camp, not a
    // turnout failure. Caught on live seeded data during this revision: the naive
    // version reported "Camping events have the weakest turnout" at 0%.
    vi.spyOn(analyticsRepository, 'listEventsWithDetail').mockResolvedValue([
      {
        id: 'evt-upcoming',
        title: 'Upcoming Council Camp',
        eventDate: THIS_MONTH,
        category: CAT_CAMPING,
        registrations: [
          { id: 'r-1', member: { id: 'm-1', school: SCHOOL_A } },
          { id: 'r-2', member: { id: 'm-2', school: SCHOOL_A } },
          { id: 'r-3', member: { id: 'm-3', school: SCHOOL_B } },
        ],
        attendanceRecords: [],
      },
      EVENTS[0],
    ] as never);

    const { breakdown, decisionSupport } = await analyticsService.getOverview(DEFAULT_QUERY);

    expect(breakdown.byActivityCategory.find((r) => r.label === 'Camping')).toMatchObject({
      eventCount: 1,
      heldEvents: 0,
      registrations: 3,
      attendanceRate: 0,
    });
    const turnout = decisionSupport.insights.find((i) => i.id === 'activity-low-turnout');
    expect(turnout?.title ?? '').not.toContain('Camping');
  });

  it('does not report a school as low-participation when it simply has no attendance records', async () => {
    // Three members (clears the sample threshold) but nobody was ever marked present
    // or absent — that is missing data, not a participation problem.
    vi.spyOn(analyticsRepository, 'listMembers').mockResolvedValue([
      ...MEMBERS,
      { id: 'm-4', createdAt: THIS_MONTH, troopId: TROOP_B.id, status: { name: 'active' }, birthDate: BIRTH_IN_BAND, school: SCHOOL_B, scoutLevel: LEVEL_SENIOR },
      { id: 'm-5', createdAt: THIS_MONTH, troopId: TROOP_B.id, status: { name: 'active' }, birthDate: BIRTH_IN_BAND, school: SCHOOL_B, scoutLevel: LEVEL_SENIOR },
    ] as never);
    vi.spyOn(analyticsRepository, 'listEventsWithDetail').mockResolvedValue([] as never);

    const { breakdown, decisionSupport } = await analyticsService.getOverview(DEFAULT_QUERY);

    expect(breakdown.bySchool.find((r) => r.label === 'CAVSU')).toMatchObject({ attendanceRecords: 0, attendanceRate: 0 });
    expect(decisionSupport.insights.find((i) => i.id === 'school-low-participation')).toBeUndefined();
  });
});

describe('analyticsService.getOverview — promotion readiness', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockRepository();
  });

  it('flags nobody when every member is inside their level age band', async () => {
    const { decisionSupport } = await analyticsService.getOverview(DEFAULT_QUERY);

    expect(decisionSupport.promotionReadiness.every((row) => row.overAge === 0)).toBe(true);
    expect(decisionSupport.insights.find((i) => i.id === 'promotion-due')).toBeUndefined();
  });

  it('flags a member who has aged past their level, and names the level above', async () => {
    // 15 years old but still a Junior Girl Scout (band 10-12). Derivable only since
    // the 2026-09-16 migration gave ScoutLevel structured minAge/maxAge columns —
    // previously the band existed only as prose inside `description`.
    vi.spyOn(analyticsRepository, 'listMembers').mockResolvedValue([
      {
        id: 'm-old',
        createdAt: THIS_MONTH,
        troopId: TROOP_A.id,
        status: { name: 'active' },
        birthDate: BIRTH_OVER_AGE,
        school: SCHOOL_A,
        scoutLevel: LEVEL_JUNIOR,
      },
    ] as never);

    const { decisionSupport } = await analyticsService.getOverview(DEFAULT_QUERY);
    const junior = decisionSupport.promotionReadiness.find((row) => row.levelName === 'Junior Girl Scout');

    expect(junior).toMatchObject({ overAge: 1, memberCount: 1, nextLevelName: 'Senior Girl Scout' });
    expect(decisionSupport.insights.find((i) => i.id === 'promotion-due')).toMatchObject({
      category: 'membership',
      metric: '1 due',
    });
  });

  it('skips members with no birth date rather than assuming an age', async () => {
    vi.spyOn(analyticsRepository, 'listMembers').mockResolvedValue([
      {
        id: 'm-nodob',
        createdAt: THIS_MONTH,
        troopId: TROOP_A.id,
        status: { name: 'active' },
        birthDate: null,
        school: SCHOOL_A,
        scoutLevel: LEVEL_JUNIOR,
      },
    ] as never);

    const { decisionSupport } = await analyticsService.getOverview(DEFAULT_QUERY);
    const junior = decisionSupport.promotionReadiness.find((row) => row.levelName === 'Junior Girl Scout');

    // Counted as a member of the level, but never as over-age — a missing birth date
    // is unknown, not old.
    expect(junior).toMatchObject({ overAge: 0, memberCount: 1 });
  });

  it('ignores levels with no upper age bound instead of flagging all of them', async () => {
    // An unbounded level (adult leaders) must not be treated as maxAge 0, which would
    // report every member in it as over-age.
    vi.spyOn(analyticsRepository, 'listScoutLevels').mockResolvedValue([
      { ...LEVEL_JUNIOR, minAge: null, maxAge: null },
    ] as never);

    const { decisionSupport } = await analyticsService.getOverview(DEFAULT_QUERY);

    expect(decisionSupport.promotionReadiness).toEqual([]);
    expect(decisionSupport.insights.find((i) => i.id === 'promotion-due')).toBeUndefined();
  });
});
