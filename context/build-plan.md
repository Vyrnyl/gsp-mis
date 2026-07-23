# GSP Management Information System — Build Plan

> **Core rule: UI-first, mock-data-first.** Every feature is built as a full, visible page using mock data and verified visually **before any logic is written**. Only then is functionality built and wired to that UI, step by step. Every feature must be visible and testable before moving to the next. **There are no invisible backend phases** — if you can't see it on screen, it isn't done.

This plan operationalizes [project-overview.md](project-overview.md), [architecture.md](architecture.md), [database-design.md](database-design.md), and [code-standards.md](code-standards.md). Visuals follow [ui-rules.md](ui-rules.md) and reuse components tracked in [ui-registry.md](ui-registry.md). The reference look is the [Gsp.html](Gsp.html) prototype.

---

## 1. How Every Feature Is Built — The Feature Loop

Apply these six steps **in order** to each feature. Do not start step N+1 until step N is verified.

| Step | Name              | What happens                                                                                                                                                                                                                                                                                 | Gate to pass                                                          |
| ---- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 1    | **UI + Mock**     | Build the full page/screen with hardcoded mock data. Reuse [ui-registry.md](ui-registry.md) components; register any new one.                                                                                                                                                                | Page renders with realistic mock content.                             |
| 2    | **Visual Verify** | Open in browser. Check visual identity against [Gsp.html](Gsp.html) and rules against [ui-rules.md](ui-rules.md): tokens, responsive (900/768/480), empty/loading/error states drawn, focus rings visible. Layout may improve on the prototype — **state any deliberate deviation and why**. | Looks correct at all breakpoints; states visible. **Human sign-off.** |
| 3    | **Contract**      | Define TypeScript types + the API contract (routes, request/response shape) the UI needs. Mock data now conforms to these types.                                                                                                                                                             | Types compile; mock matches contract exactly.                         |
| 4    | **Wire Read**     | Build backend read path (route → controller → service → repository → Prisma) and the frontend service. Replace mock with real fetch. Handle loading/error/empty.                                                                                                                             | Real data renders on screen.                                          |
| 5    | **Wire Write**    | Build create/update/delete + validation (both sides). Wire forms, modals, toasts. **Default: refetch after mutation** (not optimistic updates) — simpler and matches the toast pattern.                                                                                                      | Actions work end-to-end and are visible (toast/table update).         |
| 6    | **Test & Done**   | Validation, RBAC on the route, edge cases; unit test service logic; manual test the happy + failure paths. Update registry + progress tracker.                                                                                                                                               | Definition of Done (§3) met.                                          |

**Golden path for data flow** (per [architecture.md](architecture.md) §9): UI → feature service → route → controller → service → repository → Prisma → PostgreSQL → shared handlers → UI.

---

## 2. Conventions (apply everywhere)

- **Stack**: Next.js + TypeScript + Tailwind (frontend); Node/Express + TypeScript + Prisma + PostgreSQL (backend). Icons via `react-icons`; charts via `react-chartjs-2` styled to match the prototype's CSS charts.
- **Structure**: feature-based folders per [architecture.md](architecture.md) §4.3 (backend) and §5.2 (frontend). Naming per [code-standards.md](code-standards.md) §4.
- **Shared handlers first**: singleton `asyncHandler` + centralized `errorHandler` exist before any module route (built in Phase 0).
- **Every protected route** gets RBAC middleware. Roles: `admin`, `executive_council`, `troop_leader`.
- **Mock data lives in** `src/shared/mocks/<feature>.mock.ts` and is deleted (or gated behind a flag) once step 4 replaces it.
- **Registry discipline**: never invent a component that already exists in [ui-registry.md](ui-registry.md); register new ones the moment they're built.
- **Design latitude**: [Gsp.html](Gsp.html) is a **baseline, not a ceiling** ([ui-rules.md](ui-rules.md) §1). Its visual identity is binding; its markup and layouts are not. Improve on them — staying on the tokens, consistent across sibling screens, and registering what you invent. The prototype has no loading/empty states, no pagination, and fails WCAG contrast in two places; matching it exactly would ship those defects. Sanctioned enhancements: [ui-rules.md](ui-rules.md) §10.

---

## 3. Definition of Done (per feature)

A feature is done only when **all** are true:

- [ ] Full UI matches [ui-rules.md](ui-rules.md); responsive at 900px, 768px & 480px.
- [ ] Loading, empty, and error states are visibly implemented (not blank).
- [ ] Real data reads render on screen; no remaining mock in the render path.
- [ ] All writes (create/update/delete) work end-to-end with visible feedback (toast/refresh).
- [ ] Validation on **both** frontend and backend; invalid input rejected early ([code-standards.md](code-standards.md) §6.6).
- [ ] Route protected by RBAC for the correct role(s).
- [ ] Service-layer business logic has unit tests; happy + failure paths manually verified.
- [ ] [ui-registry.md](ui-registry.md) and [progress.md](progress.md) updated.

---

## Phase 0 — Foundation & Scaffolding (build once, before features)

> Enables everything else. Kept minimal; the app shell is itself visually verifiable.

**0.1 Repo & tooling** — Next.js + backend workspaces, TypeScript strict, ESLint/Prettier (2-space, semicolons per [code-standards.md](code-standards.md) §9), Tailwind configured with GSP tokens from [ui-rules.md](ui-rules.md) §2. **Test runner installed here** (Vitest or Jest + supertest for API tests) — the Definition of Done (§3) requires service-layer unit tests from the very first feature, so this cannot be deferred.

**0.2 Design system port** — Port tokens to `tailwind.config` (**with the §9 contrast fixes applied — do not port `#aaa` text or white-on-gold**), port base components from [ui-registry.md](ui-registry.md) Foundations + Buttons + Feedback (Button, Card, Badge, Modal, Toast, Alert, form inputs), **plus the [ui-registry.md](ui-registry.md) §9 components the prototype never had** — `EmptyState`, skeleton loaders, `ErrorState`, `Pagination`, `ConfirmDialog`, `FormField`. Every Phase 1 screen depends on these; building them later means retrofitting every table. _Visual verify a component gallery page showing every component in every variant and state._

**0.3 App shell** — Sidebar, topbar, page container, responsive off-canvas sidebar (registry §2). _Visual verify: navigable shell with placeholder pages._

**0.4 Backend spine** — `app.ts`/`server.ts`, `asyncHandler`, `errorHandler`, Prisma client, health route, `/api/v1` versioning ([architecture.md](architecture.md) §7).
**Environment & secrets**: `.env` + `.env.example`, typed env-schema validation that fails fast on boot. Required before 1.1: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET`. No secrets in source ([code-standards.md](code-standards.md) §10).

**0.5 Database** — Prisma schema for all domains from [database-design.md](database-design.md), migrations, seed script with realistic demo data (councils, troops, members, events, badges) — this seed doubles as the "real" data that replaces mocks.

---

## Phase 1 — Core Operations

Goal: a usable system for auth, membership, and a live dashboard.

### 1.1 Authentication

- **Screens**: Auth card — Login tab, Signup tab, role selector, forgot-password. (registry §2 Auth, §5 Forms).
- **Mock/UI first**: full auth screen with the 3-role selector, password toggle, strength meter, demo-fill button, alerts. Visual verify against prototype.
- **Contract**: `POST /api/v1/auth/login|signup|refresh|logout|forgot-password`; user + session types.
- **Wire**: JWT + refresh tokens; **BFF issues httpOnly cookies** (per [project-overview.md](project-overview.md) Auth); password hashing; protected-route redirect; role-based landing.
- **Done gate**: log in as each role → lands on role-appropriate dashboard; bad creds show alert; session persists on refresh.
- **Known gap**: `forgot-password` returns its generic non-enumerating response but sends no real email — no reset link is actually delivered. Blocked on the open email-sending-service decision (§7).

### 1.2 App Shell + Role-Based Navigation

- Wire the Phase 0 shell to the authenticated user: sidebar shows only nav items permitted for the role; user block in footer; logout.
- **Done gate**: each role sees only its allowed menu; unauthorized routes blocked.

### 1.3 Membership Management

> Built **before** the dashboard — the dashboard aggregates member data, so real members must exist first (§5 rule 2).

- **Screens**: member directory table (search/filter/status), register/edit member modal, member profile page, archive/restore (registry §3 Table, §7 Modal, §5 Forms).
- **Registration types**: **Scout registration** and **Adult Leader registration** are distinct flows with different required fields (per [project-overview.md](project-overview.md) → Membership Management). Build as one modal with a member-type selector, not two screens.
- **Membership renewal**: renewal action on the member profile writing to the `memberships` table (`start_date`/`end_date`/`renewal_date` per [database-design.md](database-design.md) §3.2); expiring/expired status visibly flagged in the directory via status badge.
- **Mock first**: table populated with mock members (both types, mixed statuses), working client-side search/filter, modal opens with form. Visual verify.
- **Contract**: `GET/POST/PUT /api/v1/members`, `PATCH .../archive|restore`, `POST .../renew`, search/filter/status query params.
- **Wire read → write**: list from DB → create/update via modal (toast on success) → archive/restore → renew → profile page.
- **Done gate**: both registration types work; renewal updates status visibly; full CRUD + search/filter/archive working; validation both sides.

### 1.4 Membership Approval (Executive Council)

- **Screens**: pending-registrations queue table, registration detail/review modal, approve & reject actions with reason (registry §3 Table, §7 Modal, §4 Badge pills for pending/approved/rejected).
- **Scope**: new registrations from 1.3 enter a **pending** state; Executive Council reviews and approves/rejects (per [project-overview.md](project-overview.md) → Executive Council → "Review registrations / Approve memberships"). Approval transitions the member to active.
- **Mock → wire**: pending queue with mock rows → real pending list → approve/reject writes status + audit log entry → toast + row leaves queue.
- **Access**: Executive Council + Admin.
- **Done gate**: a member registered in 1.3 appears in the queue, can be approved/rejected, and the status change is visible in the 1.3 directory.

### 1.5 Dashboard (role-aware)

- **Screens**: stat cards row, bar chart (membership growth), donut (distribution), activity feed, KPI/progress widgets (registry §3, §4).
- **Mock first**: full dashboard with mock stats/charts per role. Visual verify.
- **Contract**: `GET /api/v1/dashboard` — **the role is read from the session/JWT server-side; never accepted as a client parameter** (a client-supplied role would let any user request another role's data).
- **Wire**: aggregate endpoint; replace mock; render real ChartJS.
- **Done gate**: numbers/charts reflect real member data from 1.3; each role's dashboard variant renders; switching role changes the dashboard without any client-side role input.

### 1.6 Organization Management (Councils, Troops, Scout Levels, Categories)

- **Screens**: councils table, troops table, category/level config forms (registry §3 Table, §5 Forms). Admin-only.
- **Mock → wire**: manage councils → troops (with leader assignment) → scout levels, badge categories, activity categories.
- **Done gate**: admin can CRUD org hierarchy; troop leader assignment reflected in membership.

**Phase 1 exit**: A user can register/log in per role, register scouts and adult leaders, have registrations approved by the Council, renew memberships, see a live dashboard driven by that real data, and manage the org hierarchy — all visible and tested.

---

## Phase 2 — Activities & Engagement

### 2.1 Event Management

- **Screens**: event list/cards, calendar view (registry §4 Calendar), create/edit event modal, event detail page.
- **Mock → wire**: calendar with mock events → CRUD events → assign troop leaders → schedules.
- **Done gate**: events visible on calendar + list; CRUD works; leader/troop assignment saved.

### 2.2 Event Registration & Attendance

- **Screens**: registration form, participant list, attendance checklist UI, attendance summary (registry §3 Table, Avatar group; §5 Toggle for present/absent).
- **Mock → wire**: register participants → record attendance (present/absent) → summary with attendance rate (color-coded per [ui-rules.md](ui-rules.md) §7 threshold pattern).
- **Done gate**: attendance recordable per event; summary + rate visible.

### 2.3 Activity Report Submission (Troop Leader)

- **Screens**: submit-activity-report form (event, summary, participation notes, outcomes), my-submitted-reports table, report detail view, Council review status (registry §5 Forms, §3 Table, §4 Badge pills).
- **Scope**: troop leaders **submit** activity reports after an event (per [project-overview.md](project-overview.md) → Troop Leader → "Submit activity reports"); Executive Council views them under "Activity Monitoring → View accomplishment reports". Distinct from Phase 3.2, which _generates and exports_ reports from system data.
- **Mock → wire**: form + mock submissions table → `POST /api/v1/activity-reports` linked to an event from 2.1 → Council-visible list → status badge (submitted/reviewed).
- **Access**: Troop Leader submits; Executive Council + Admin read.
- **Done gate**: a troop leader submits a report against a real event and the Council sees it.

### 2.4 Badge & Achievement Management

- **Screens**: badge catalog grid (registry §3 Badge card, `.earned` state), progress tracker (progress bars), achievement history, verify-achievement action.
- **Mock → wire**: badge catalog → record earned badges per member → progress % → troop-leader verification.
- **Done gate**: badges awarded/verified; per-member progress visible.

### 2.5 Notifications & Announcements

- **Screens**: notification panel/dropdown (registry §7), announcement feed, event reminders, unread state.
- **Mock → wire**: notif panel with mock items → real notifications on events (registration, badge earned, announcement) → mark read.
- **Done gate**: notifications generated by real actions appear; unread badge/dot accurate.
- **Scope note**: in-app only (panel/dropdown + unread badge) — no email delivery. Same open decision as 1.1 (§7); if email notifications are wanted later, this is the natural feature to absorb the shared `EmailService` build-out since it needs the same sender as forgot-password.

**Phase 2 exit**: Troops run events, take attendance, submit activity reports, track badges, and receive notifications — all visible and tested.

---

## Phase 3 — Finance, Reporting & Administration

### 3.1 Finance Management

- **Screens**: financial dashboard (stat cards + charts), payment form, expense log table, fee-type config, budget/collection summary (registry §3, §4, §5).
- **Mock → wire**: record payments (by member/fee type) → record expenses → periods/summaries → balance.
- **Done gate**: payments/expenses recorded; summaries + balances reflect data.

### 3.2 Reports

- **Screens**: reports page with type selector, filters, preview, export actions (registry §5, §6). Types: Membership, Attendance, Badge, Financial, Activity, Executive.
- **Mock → wire**: preview with mock → real aggregated data → export to **PDF** and **Excel**.
- **Done gate**: each report type previews real data and exports both formats.

### 3.3 Analytics (Executive)

- **Screens**: analytics views — membership/attendance trends, participation, badge completion, financial trends, org performance (registry §4, ChartJS).
- **Mock → wire**: mock charts → `analytics_snapshots`/aggregation endpoints → interactive ChartJS.
- **Done gate**: executive analytics render from real data; role-gated to council/admin.

### 3.4 Settings & System Administration

- **Screens**: settings sections with toggles (registry §8), user management (admin CRUD + activate/deactivate + reset password + role assignment), audit log view, system config, backup controls.
- **Mock → wire**: settings toggles → user management CRUD → audit log listing → access control.
- **Done gate**: admin manages users/roles/permissions; settings persist; audit log shows critical actions.

### 3.5 Profile Management (all roles)

- **Screens**: profile header + editable info, password change (registry §3 Profile header, §5 Forms).
- **Done gate**: any user edits own profile + changes password.

**Phase 3 exit**: Finance, full reporting/analytics, and admin controls are live and visible. System feature-complete per [project-overview.md](project-overview.md).

---

## 4. Cross-Cutting (verified continuously, not a separate phase)

- **RBAC**: enforced per route as each feature is wired; re-checked at each phase exit.
- **Validation & error handling**: schema validation both sides; centralized error responses ([code-standards.md](code-standards.md) §6.5–6.6).
- **Security** ([architecture.md](architecture.md) §8): hashed passwords, protected routes, audit logging on critical actions, input sanitization, no secrets in code.
- **Responsive & states**: every screen handles 900/768/480, loading/empty/error — checked at step 2 of the loop.
- **Accessibility**: labels on inputs, focus rings (already in tokens), keyboard-navigable modals.

---

## 5. Sequencing Rules

1. Finish a feature's full loop (§1) before starting the next.
2. Within a phase, follow the listed order — later features depend on earlier ones (e.g. attendance needs events; finance needs members).
3. A phase's exit criteria must pass before the next phase begins.
4. Never merge a feature that fails its Definition of Done (§3).

---

## 6. Recommended MVP Slice (if time-boxed)

Auth (1.1) → Shell/Nav (1.2) → Membership (1.3) → Dashboard (1.5). This is a demoable core and follows the phase order exactly — no reordering needed. Approval (1.4), Organization (1.6), and Phases 2–3 layer on after.

---

## 7. Decisions

### Settled

- **Icons**: `react-icons` — the prototype's emoji are replaced with icon components. Nothing is blocked on this.
- **Charts**: `react-chartjs-2` as the ChartJS React wrapper, styled to the prototype's color mapping and legend layout ([ui-rules.md](ui-rules.md) §9).
- **Mutation strategy**: refetch after write, not optimistic updates (§1 step 5).
- **Dashboard role source**: session/JWT server-side only — never a client parameter (§1.5).
- **Role model**: **relational is authoritative** — roles come from `user_roles`, capabilities from `role_permissions`. There is **no role string column on `users`** ([database-design.md](database-design.md) §3.1). Required because "Assign user roles" and "Manage permissions" are explicit Administrator features that a flat string cannot support. Seeded roles: `admin`, `executive_council`, `troop_leader`. The join table permits many-to-many, but **v1 enforces exactly one role per user at the service layer** — validate this on assignment.

### Open

- **Email-sending service**: no provider is chosen and no feature currently scopes the work. Two consumers already exist without it: 1.1's `forgot-password` returns its generic "a reset link has been sent" response but sends no real email (there is nothing to click), and 2.5 Notifications & Announcements is in-app only (panel/dropdown, unread badge) — event reminders and council notices don't leave the app either. Needs a decision on provider (e.g. Resend, SES, SMTP), where the integration lives (a shared `EmailService` under `apps/api/src/shared/`, not duplicated per feature), and which feature absorbs the initial build-out — likely folded into 1.1 as a follow-up or added as its own small feature before 2.5, since 2.5 needs the same sender.

---

## 8. Progress Tracking

Progress is **not** tracked in this file. This document is the plan (_what to build_); [progress.md](progress.md) is the record (_what is done_).

[progress.md](progress.md) holds, per feature: current status and Feature Loop step, screens and components built, API endpoints, files touched, what remains, blockers, plus a cross-cutting checklist, open decisions, and a session log.

**Update [progress.md](progress.md) at the end of every work session and every time a Loop step completes.**
