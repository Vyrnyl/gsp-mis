/**
 * Seed script — realistic demo data for the GSP Catanduanes Council.
 *
 * This data is not a fixture for tests: it becomes the *real* data that replaces each
 * feature's mocks at Feature Loop step 4 (build-plan.md §0.5). Keep it plausible.
 *
 * Idempotent — every write is an upsert keyed on a natural unique field, so re-running
 * the seed converges rather than duplicating.
 *
 * Uses the app's Prisma singleton rather than its own client: on Prisma 7 a client must
 * be constructed with a driver adapter, and `src/config/prisma.ts` is the one place that
 * knows how to build it.
 *
 * Run: npm run db:seed --workspace=apps/api
 */
import { type Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { prisma } from '../src/config/prisma';
import { PERMISSIONS, ROLES, ROLE_PERMISSIONS, type RoleName } from '../src/shared/constants/roles';

/**
 * Demo account password. Overridable via `SEED_PASSWORD`; the fallback exists only so
 * a fresh clone can seed without extra setup. These accounts are demo data — never
 * seed them into a production database.
 */
const SEED_PASSWORD = process.env['SEED_PASSWORD'] ?? 'GspDemo!2026';
const BCRYPT_ROUNDS = 10;

const MEMBER_STATUSES = [
  { name: 'pending', description: 'Awaiting Executive Council approval' },
  { name: 'active', description: 'Approved and currently a member' },
  { name: 'expiring', description: 'Membership ends within 30 days' },
  { name: 'expired', description: 'Membership term has lapsed' },
  { name: 'archived', description: 'Removed from the active registry' },
  { name: 'rejected', description: 'Registration declined by the Council' },
];

const SCOUT_LEVELS = [
  { name: 'Twinkler', description: 'Ages 4–6', orderNumber: 1 },
  { name: 'Star Scout', description: 'Ages 7–9', orderNumber: 2 },
  { name: 'Junior Girl Scout', description: 'Ages 10–12', orderNumber: 3 },
  { name: 'Senior Girl Scout', description: 'Ages 13–16', orderNumber: 4 },
  { name: 'Cadet Girl Scout', description: 'Ages 17–19', orderNumber: 5 },
];

const BADGE_CATEGORIES = [
  { name: 'Community Service', description: 'Service to the community' },
  { name: 'Outdoor Skills', description: 'Camping, hiking and navigation' },
  { name: 'Health & Safety', description: 'First aid and personal wellbeing' },
  { name: 'Leadership', description: 'Troop leadership and mentoring' },
  { name: 'Arts & Culture', description: 'Filipino heritage and creative arts' },
];

const ACTIVITY_CATEGORIES = [
  { name: 'Camping', description: 'Overnight and day camps' },
  { name: 'Community Outreach', description: 'Service projects and drives' },
  { name: 'Training', description: 'Leader and scout training sessions' },
  { name: 'Ceremony', description: 'Investiture, awarding and assemblies' },
];

const FEE_TYPES = [
  {
    name: 'Annual Membership Fee',
    amount: '150.00',
    description: 'Yearly national membership due',
  },
  { name: 'Camp Fee', amount: '450.00', description: 'Per-camp participation fee' },
  { name: 'Uniform & Insignia', amount: '900.00', description: 'Uniform set and badges' },
  { name: 'Training Fee', amount: '300.00', description: 'Leader training course' },
];

function daysFromToday(days: number): Date {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

async function seedRolesAndPermissions(): Promise<Record<RoleName, string>> {
  const permissionIds = new Map<string, string>();

  for (const name of Object.values(PERMISSIONS)) {
    const permission = await prisma.permission.upsert({
      where: { name },
      update: {},
      create: { name, description: `Allows ${name.replace(':', ' ')}` },
    });
    permissionIds.set(name, permission.id);
  }

  const roleDescriptions: Record<RoleName, string> = {
    [ROLES.ADMIN]: 'Registration processor and system administrator',
    [ROLES.EXECUTIVE_COUNCIL]: 'Council officers who approve and oversee',
    [ROLES.TROOP_LEADER]: 'Leads a troop; records attendance and badges',
  };

  const roleIds = {} as Record<RoleName, string>;

  for (const [roleName, permissions] of Object.entries(ROLE_PERMISSIONS) as [
    RoleName,
    string[],
  ][]) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: { description: roleDescriptions[roleName] },
      create: { name: roleName, description: roleDescriptions[roleName] },
    });
    roleIds[roleName] = role.id;

    for (const permissionName of permissions) {
      const permissionId = permissionIds.get(permissionName);
      if (!permissionId) continue;

      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId } },
        update: {},
        create: { roleId: role.id, permissionId },
      });
    }
  }

  return roleIds;
}

async function seedUsers(roleIds: Record<RoleName, string>) {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, BCRYPT_ROUNDS);

  const definitions: Array<{ email: string; fullName: string; role: RoleName; phone: string }> = [
    {
      email: 'admin@gsp-catanduanes.ph',
      fullName: 'Marisol Tabuena',
      role: ROLES.ADMIN,
      phone: '+63 917 100 0001',
    },
    {
      email: 'council@gsp-catanduanes.ph',
      fullName: 'Rosario Verceles',
      role: ROLES.EXECUTIVE_COUNCIL,
      phone: '+63 917 100 0002',
    },
    {
      email: 'leader.virac@gsp-catanduanes.ph',
      fullName: 'Liza Bagadiong',
      role: ROLES.TROOP_LEADER,
      phone: '+63 917 100 0003',
    },
    {
      email: 'leader.bato@gsp-catanduanes.ph',
      fullName: 'Grace Tapel',
      role: ROLES.TROOP_LEADER,
      phone: '+63 917 100 0004',
    },
  ];

  const users: Record<string, string> = {};

  for (const definition of definitions) {
    const user = await prisma.user.upsert({
      where: { email: definition.email },
      update: { fullName: definition.fullName, phoneNumber: definition.phone },
      create: {
        email: definition.email,
        fullName: definition.fullName,
        phoneNumber: definition.phone,
        passwordHash,
      },
    });

    // v1 rule: exactly one role per user. Clear any others before assigning.
    await prisma.userRole.deleteMany({
      where: { userId: user.id, NOT: { roleId: roleIds[definition.role] } },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: roleIds[definition.role] } },
      update: {},
      create: { userId: user.id, roleId: roleIds[definition.role] },
    });

    users[definition.email] = user.id;
  }

  return users;
}

async function seedReferenceData() {
  for (const status of MEMBER_STATUSES) {
    await prisma.memberStatus.upsert({
      where: { name: status.name },
      update: { description: status.description },
      create: status,
    });
  }

  for (const level of SCOUT_LEVELS) {
    await prisma.scoutLevel.upsert({
      where: { name: level.name },
      update: { description: level.description, orderNumber: level.orderNumber },
      create: level,
    });
  }

  for (const category of BADGE_CATEGORIES) {
    await prisma.badgeCategory.upsert({
      where: { name: category.name },
      update: { description: category.description },
      create: category,
    });
  }

  for (const category of ACTIVITY_CATEGORIES) {
    await prisma.activityCategory.upsert({
      where: { name: category.name },
      update: { description: category.description },
      create: category,
    });
  }

  for (const feeType of FEE_TYPES) {
    await prisma.feeType.upsert({
      where: { name: feeType.name },
      update: { amount: feeType.amount, description: feeType.description },
      create: feeType,
    });
  }
}

async function seedOrganization(users: Record<string, string>) {
  const council = await prisma.council.upsert({
    where: { name: 'Catanduanes Council' },
    update: { description: 'Provincial council covering all Catanduanes municipalities' },
    create: {
      name: 'Catanduanes Council',
      description: 'Provincial council covering all Catanduanes municipalities',
    },
  });

  const troopDefinitions = [
    {
      troopCode: 'CAT-VIR-012',
      name: 'Troop 12 — Virac',
      leaderEmail: 'leader.virac@gsp-catanduanes.ph',
    },
    {
      troopCode: 'CAT-BAT-004',
      name: 'Troop 4 — Bato',
      leaderEmail: 'leader.bato@gsp-catanduanes.ph',
    },
    { troopCode: 'CAT-SAN-007', name: 'Troop 7 — San Andres', leaderEmail: null },
  ];

  const troops: Record<string, string> = {};

  for (const definition of troopDefinitions) {
    const leaderId = definition.leaderEmail ? (users[definition.leaderEmail] ?? null) : null;
    const troop = await prisma.troop.upsert({
      where: { troopCode: definition.troopCode },
      update: { name: definition.name, leaderId },
      create: {
        troopCode: definition.troopCode,
        name: definition.name,
        councilId: council.id,
        leaderId,
      },
    });
    troops[definition.troopCode] = troop.id;
  }

  return { councilId: council.id, troops };
}

async function seedMembers(
  councilId: string,
  troops: Record<string, string>,
  reviewerId: string | undefined,
) {
  const statuses = Object.fromEntries(
    (await prisma.memberStatus.findMany()).map((status) => [status.name, status.id]),
  );
  const levels = Object.fromEntries(
    (await prisma.scoutLevel.findMany()).map((level) => [level.name, level.id]),
  );

  const definitions = [
    {
      first: 'Althea',
      last: 'Ramos',
      email: 'althea.ramos@example.ph',
      troop: 'CAT-VIR-012',
      level: 'Senior Girl Scout',
      status: 'active',
      type: 'scout',
      birth: '2009-03-14',
    },
    {
      first: 'Bea',
      last: 'Delfin',
      email: 'bea.delfin@example.ph',
      troop: 'CAT-BAT-004',
      level: 'Junior Girl Scout',
      status: 'pending',
      type: 'scout',
      birth: '2013-07-02',
    },
    {
      first: 'Cristina',
      last: 'Ople',
      email: 'cristina.ople@example.ph',
      troop: 'CAT-VIR-012',
      level: 'Cadet Girl Scout',
      status: 'expiring',
      type: 'scout',
      birth: '2007-11-20',
    },
    {
      first: 'Dana',
      last: 'Villar',
      email: 'dana.villar@example.ph',
      troop: 'CAT-SAN-007',
      level: 'Senior Girl Scout',
      status: 'archived',
      type: 'scout',
      birth: '2008-05-09',
    },
    {
      first: 'Elena',
      last: 'Sarmiento',
      email: 'elena.sarmiento@example.ph',
      troop: 'CAT-VIR-012',
      level: 'Star Scout',
      status: 'active',
      type: 'scout',
      birth: '2016-01-28',
    },
    {
      first: 'Faith',
      last: 'Bermundo',
      email: 'faith.bermundo@example.ph',
      troop: 'CAT-BAT-004',
      level: 'Twinkler',
      status: 'active',
      type: 'scout',
      birth: '2020-09-16',
    },
    {
      first: 'Grace',
      last: 'Tapel',
      email: 'grace.tapel@example.ph',
      troop: 'CAT-BAT-004',
      level: null,
      status: 'active',
      type: 'adult_leader',
      birth: '1988-04-11',
    },
    {
      first: 'Liza',
      last: 'Bagadiong',
      email: 'liza.bagadiong@example.ph',
      troop: 'CAT-VIR-012',
      level: null,
      status: 'active',
      type: 'adult_leader',
      birth: '1985-12-03',
    },
    {
      first: 'Marites',
      last: 'Tuazon',
      email: 'marites.tuazon@example.ph',
      troop: 'CAT-SAN-007',
      level: null,
      status: 'pending',
      type: 'adult_leader',
      birth: '1991-06-25',
    },
    {
      first: 'Nadine',
      last: 'Sorreda',
      email: 'nadine.sorreda@example.ph',
      troop: 'CAT-SAN-007',
      level: 'Junior Girl Scout',
      status: 'expired',
      type: 'scout',
      birth: '2012-10-30',
    },
  ] as const;

  const memberIds: string[] = [];

  for (const definition of definitions) {
    const statusId = statuses[definition.status];
    if (!statusId) throw new Error(`Missing member status: ${definition.status}`);

    const isApproved = definition.status !== 'pending';

    const data: Prisma.MemberUncheckedCreateInput = {
      firstName: definition.first,
      lastName: definition.last,
      email: definition.email,
      memberType: definition.type === 'adult_leader' ? 'adult_leader' : 'scout',
      birthDate: new Date(`${definition.birth}T00:00:00.000Z`),
      membershipStatusId: statusId,
      councilId,
      troopId: troops[definition.troop] ?? null,
      scoutLevelId: definition.level ? (levels[definition.level] ?? null) : null,
      reviewedById: isApproved ? (reviewerId ?? null) : null,
      reviewedAt: isApproved ? daysFromToday(-120) : null,
    };

    const member = await prisma.member.upsert({
      where: { email: definition.email },
      update: data,
      create: data,
    });
    memberIds.push(member.id);

    await prisma.memberProfile.upsert({
      where: { memberId: member.id },
      update: {},
      create: {
        memberId: member.id,
        emergencyContactName: `Guardian of ${definition.first}`,
        emergencyContactPhone: '+63 918 555 0100',
      },
    });

    // One membership term per member. Dates vary by status so the directory shows
    // the full range of status badges without any special-casing in the UI.
    const termOffsets: Record<string, { start: number; end: number }> = {
      active: { start: -200, end: 165 },
      expiring: { start: -340, end: 21 },
      expired: { start: -730, end: -10 },
      archived: { start: -700, end: -320 },
      pending: { start: -3, end: 362 },
      rejected: { start: -3, end: 362 },
    };
    const offsets = termOffsets[definition.status] ?? termOffsets['active']!;

    const existingTerm = await prisma.membership.findFirst({ where: { memberId: member.id } });
    if (!existingTerm) {
      await prisma.membership.create({
        data: {
          memberId: member.id,
          startDate: daysFromToday(offsets.start),
          endDate: daysFromToday(offsets.end),
          status:
            definition.status === 'expiring'
              ? 'expiring'
              : definition.status === 'expired' || definition.status === 'archived'
                ? 'expired'
                : 'active',
        },
      });
    }
  }

  return memberIds;
}

async function seedBadges(memberIds: string[], verifierId: string | undefined) {
  const categories = Object.fromEntries(
    (await prisma.badgeCategory.findMany()).map((category) => [category.name, category.id]),
  );

  const definitions = [
    {
      name: 'Community Helper',
      category: 'Community Service',
      points: 30,
      requirements: ['Join two outreach activities', 'Write a short reflection'],
    },
    {
      name: 'Trailblazer',
      category: 'Outdoor Skills',
      points: 45,
      requirements: ['Complete a 5km hike', 'Pitch a tent unaided', 'Read a compass bearing'],
    },
    {
      name: 'First Aider',
      category: 'Health & Safety',
      points: 40,
      requirements: ['Pass basic first aid', 'Assemble a first aid kit'],
    },
    {
      name: 'Troop Mentor',
      category: 'Leadership',
      points: 60,
      requirements: ['Lead a patrol for one term', 'Mentor a junior scout'],
    },
    {
      name: 'Heritage Keeper',
      category: 'Arts & Culture',
      points: 25,
      requirements: ['Present a local folk story', 'Join a cultural performance'],
    },
    {
      name: 'Camp Cook',
      category: 'Outdoor Skills',
      points: 35,
      requirements: ['Prepare a camp meal', 'Demonstrate fire safety'],
    },
  ];

  const badgeIds: string[] = [];

  for (const definition of definitions) {
    const badge = await prisma.badge.upsert({
      where: { name: definition.name },
      update: { requiredPoints: definition.points },
      create: {
        name: definition.name,
        description: `${definition.name} badge`,
        categoryId: categories[definition.category] ?? null,
        requiredPoints: definition.points,
      },
    });
    badgeIds.push(badge.id);

    const existing = await prisma.badgeRequirement.count({ where: { badgeId: badge.id } });
    if (existing === 0) {
      await prisma.badgeRequirement.createMany({
        data: definition.requirements.map((requirement) => ({
          badgeId: badge.id,
          requirementName: requirement,
        })),
      });
    }
  }

  // Award a spread of badges so progress bars and the catalogue's earned state have
  // something to render.
  const awards: Array<{
    member: number;
    badge: number;
    status: 'in_progress' | 'earned' | 'verified';
  }> = [
    { member: 0, badge: 0, status: 'verified' },
    { member: 0, badge: 1, status: 'earned' },
    { member: 0, badge: 2, status: 'in_progress' },
    { member: 2, badge: 0, status: 'verified' },
    { member: 2, badge: 3, status: 'earned' },
    { member: 4, badge: 4, status: 'in_progress' },
    { member: 5, badge: 4, status: 'earned' },
  ];

  for (const award of awards) {
    const memberId = memberIds[award.member];
    const badgeId = badgeIds[award.badge];
    if (!memberId || !badgeId) continue;

    await prisma.memberBadge.upsert({
      where: { memberId_badgeId: { memberId, badgeId } },
      update: {},
      create: {
        memberId,
        badgeId,
        status: award.status,
        earnedAt: award.status === 'in_progress' ? null : daysFromToday(-45),
        verifiedById: award.status === 'verified' ? (verifierId ?? null) : null,
      },
    });
  }
}

async function seedEvents(memberIds: string[], organizerId: string | undefined) {
  const categories = Object.fromEntries(
    (await prisma.activityCategory.findMany()).map((category) => [category.name, category.id]),
  );

  const definitions = [
    {
      title: 'Provincial Investiture Ceremony',
      category: 'Ceremony',
      offset: -35,
      location: 'Virac Municipal Gym',
    },
    {
      title: 'Coastal Clean-Up Drive',
      category: 'Community Outreach',
      offset: -14,
      location: 'Bato Shoreline',
    },
    {
      title: 'Troop Leader Training',
      category: 'Training',
      offset: 9,
      location: 'GSP Council Office, Virac',
    },
    {
      title: 'Annual Council Camp',
      category: 'Camping',
      offset: 27,
      location: 'Camp Igang, San Andres',
    },
  ];

  const eventIds: string[] = [];

  for (const definition of definitions) {
    const existing = await prisma.event.findFirst({ where: { title: definition.title } });
    const payload = {
      title: definition.title,
      description: `${definition.title} for the Catanduanes Council.`,
      eventDate: daysFromToday(definition.offset),
      location: definition.location,
      organizerId: organizerId ?? null,
      categoryId: categories[definition.category] ?? null,
    };

    const event = existing
      ? await prisma.event.update({ where: { id: existing.id }, data: payload })
      : await prisma.event.create({ data: payload });

    eventIds.push(event.id);
  }

  // Register and record attendance for the two past events only — future events have
  // registrations but nothing to attend yet.
  const activeMemberIds = memberIds.slice(0, 6);

  for (const [index, eventId] of eventIds.entries()) {
    const isPast = (definitions[index]?.offset ?? 0) < 0;

    for (const memberId of activeMemberIds) {
      await prisma.eventRegistration.upsert({
        where: { eventId_memberId: { eventId, memberId } },
        update: {},
        create: { eventId, memberId, registeredById: organizerId ?? null },
      });
    }

    if (!isPast) continue;

    let present = 0;
    for (const [memberIndex, memberId] of activeMemberIds.entries()) {
      const isPresent = memberIndex % 4 !== 3;
      if (isPresent) present += 1;

      await prisma.attendanceRecord.upsert({
        where: { eventId_memberId: { eventId, memberId } },
        update: { attendanceStatus: isPresent ? 'present' : 'absent' },
        create: {
          eventId,
          memberId,
          attendanceStatus: isPresent ? 'present' : 'absent',
          recordedById: organizerId ?? null,
        },
      });
    }

    const total = activeMemberIds.length;
    await prisma.attendanceSummary.upsert({
      where: { eventId },
      update: {
        totalExpected: total,
        totalPresent: present,
        totalAbsent: total - present,
        attendanceRate: ((present / total) * 100).toFixed(2),
      },
      create: {
        eventId,
        totalExpected: total,
        totalPresent: present,
        totalAbsent: total - present,
        attendanceRate: ((present / total) * 100).toFixed(2),
      },
    });
  }

  return eventIds;
}

async function seedFinance(memberIds: string[], receiverId: string | undefined) {
  const feeTypes = Object.fromEntries(
    (await prisma.feeType.findMany()).map((feeType) => [feeType.name, feeType]),
  );
  const annualFee = feeTypes['Annual Membership Fee'];
  const campFee = feeTypes['Camp Fee'];
  if (!annualFee || !campFee) return;

  const paidMembers = memberIds.slice(0, 5);

  for (const [index, memberId] of paidMembers.entries()) {
    const existing = await prisma.payment.findFirst({
      where: { memberId, feeTypeId: annualFee.id },
    });
    if (!existing) {
      await prisma.payment.create({
        data: {
          memberId,
          feeTypeId: annualFee.id,
          amount: annualFee.amount,
          paymentDate: daysFromToday(-60 + index * 3),
          paymentMethod: index % 2 === 0 ? 'cash' : 'gcash',
          receivedById: receiverId ?? null,
          status: 'paid',
        },
      });
    }
  }

  const expenses = [
    {
      description: 'Camp supplies and provisions',
      amount: '12500.00',
      offset: -30,
      category: 'Camp',
    },
    {
      description: 'Badge printing — 200 pcs',
      amount: '4800.00',
      offset: -21,
      category: 'Materials',
    },
    {
      description: 'Transport for outreach drive',
      amount: '3200.00',
      offset: -13,
      category: 'Transport',
    },
  ];

  for (const expense of expenses) {
    const existing = await prisma.expense.findFirst({
      where: { description: expense.description },
    });
    if (existing) continue;

    await prisma.expense.create({
      data: {
        description: expense.description,
        amount: expense.amount,
        expenseDate: daysFromToday(expense.offset),
        category: expense.category,
        approvedById: receiverId ?? null,
      },
    });
  }

  await prisma.financialPeriod.upsert({
    where: { name: 'FY 2026' },
    update: {},
    create: {
      name: 'FY 2026',
      startDate: daysFromToday(-200),
      endDate: daysFromToday(165),
    },
  });
}

async function seedSettingsAndNotices(users: Record<string, string>) {
  const settings = [
    {
      settingKey: 'organization.name',
      settingValue: 'Girl Scouts of the Philippines — Catanduanes Council',
      description: 'Displayed in headers and reports',
    },
    {
      settingKey: 'membership.term_months',
      settingValue: '12',
      description: 'Length of one membership term',
    },
    {
      settingKey: 'membership.renewal_window_days',
      settingValue: '30',
      description: 'How early a member may renew',
    },
    {
      settingKey: 'notifications.email_enabled',
      settingValue: 'true',
      description: 'Send email notifications',
    },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { settingKey: setting.settingKey },
      update: { settingValue: setting.settingValue, description: setting.description },
      create: setting,
    });
  }

  const councilUserId = users['council@gsp-catanduanes.ph'];

  const announcement = await prisma.announcementPost.findFirst({
    where: { title: 'Annual Council Camp registration is open' },
  });
  if (!announcement) {
    await prisma.announcementPost.create({
      data: {
        title: 'Annual Council Camp registration is open',
        content:
          'Troop leaders may now register scouts for the Annual Council Camp at Camp Igang. Slots close two weeks before the event.',
        postedById: councilUserId ?? null,
        expiresAt: daysFromToday(27),
      },
    });
  }

  for (const userId of Object.values(users)) {
    const existing = await prisma.notification.findFirst({ where: { userId } });
    if (existing) continue;

    await prisma.notification.create({
      data: {
        userId,
        title: 'Welcome to the GSP portal',
        message: 'Your account is ready. Review the pending registrations to get started.',
      },
    });
  }
}

async function main(): Promise<void> {
  console.info('[seed] roles and permissions…');
  const roleIds = await seedRolesAndPermissions();

  console.info('[seed] users…');
  const users = await seedUsers(roleIds);

  console.info('[seed] reference data…');
  await seedReferenceData();

  console.info('[seed] councils and troops…');
  const { councilId, troops } = await seedOrganization(users);

  console.info('[seed] members and memberships…');
  const memberIds = await seedMembers(councilId, troops, users['council@gsp-catanduanes.ph']);

  console.info('[seed] badges and achievements…');
  await seedBadges(memberIds, users['leader.virac@gsp-catanduanes.ph']);

  console.info('[seed] events, registrations and attendance…');
  await seedEvents(memberIds, users['leader.virac@gsp-catanduanes.ph']);

  console.info('[seed] finance…');
  await seedFinance(memberIds, users['admin@gsp-catanduanes.ph']);

  console.info('[seed] settings, announcements and notifications…');
  await seedSettingsAndNotices(users);

  console.info(
    '\n[seed] done. Demo accounts (password from SEED_PASSWORD, default "GspDemo!2026"):',
  );
  for (const email of Object.keys(users)) {
    console.info(`  - ${email}`);
  }
}

main()
  .catch((error) => {
    console.error('[seed] failed', error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
