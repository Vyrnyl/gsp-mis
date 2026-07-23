# GSP Management Information System — Progress Tracker

> **Living document. Single source of truth for what is actually built.**
> Update this file at the end of every work session and every time a Feature Loop step is completed.
> The plan of _what to build_ lives in [build-plan.md](build-plan.md); this file records _what is done_.

**Last updated:** 2026-07-23 · **Current phase:** Phase 1 — Core Operations · **Current feature:** 1.1 Authentication is done (●) — next up is **1.2 App Shell + Role-Based Navigation**

---

## Status Legend

| Symbol | Status            | Meaning                                                                           |
| ------ | ----------------- | --------------------------------------------------------------------------------- |
| ☐      | Not started       | No work begun                                                                     |
| ◔      | UI + Mock         | Full page built with mock data (Loop step 1)                                      |
| ◑      | Visually verified | Human sign-off on look/responsive/states (Loop step 2) — **gate passed**          |
| ◕      | Read wired        | Real data renders on screen (Loop steps 3–4)                                      |
| ●      | Done              | Writes wired, validated, RBAC, tested — meets Definition of Done (Loop steps 5–6) |
| ⚠      | Blocked           | Cannot proceed — blocker noted in the entry                                       |

Feature Loop steps referenced above are defined in [build-plan.md](build-plan.md) §1.

---

## Summary Dashboard

| Phase                     | Features | ☐      | ◔     | ◑     | ◕     | ●     | ⚠     |
| ------------------------- | -------- | ------ | ----- | ----- | ----- | ----- | ----- |
| Phase 0 — Foundation      | 5        | 0      | 0     | 0     | 0     | 5     | 0     |
| Phase 1 — Core Operations | 6        | 5      | 0     | 0     | 0     | 1     | 0     |
| Phase 2 — Activities      | 5        | 5      | 0     | 0     | 0     | 0     | 0     |
| Phase 3 — Finance & Admin | 5        | 5      | 0     | 0     | 0     | 0     | 0     |
| **Total**                 | **21**   | **15** | **0** | **0** | **0** | **6** | **0** |

**Overall completion: 6 / 21 features done (29%) — Phase 0 complete, 1.1 Authentication done end-to-end (all 5 endpoints wired, tested, verified live). Next: 1.2 App Shell + Role-Based Navigation.**

> **Phase 0 exit passed 2026-07-22.** 0.2 and 0.3 cleared Feature Loop gate 2 with human sign-off at 900 / 768 / 480px. The remaining Definition of Done items (real data reads, writes, RBAC) do not apply to scaffolding — they are satisfied per feature by whichever Phase 1+ screen consumes these components. The database is live on **Neon**: the `init` migration is applied and seeded, and `GET /api/v1/health` reports `database: up`. Nothing is outstanding for Phase 0.

---

## How to Update This File

When you finish work on a feature:

1. Update its **Status** symbol and **Loop step**.
2. Fill in the detail fields that now apply (screens, components, endpoints, files).
3. Note anything unfinished under **Remaining** and any blocker under **Blockers**.
4. Add a line to the [Session Log](#session-log) at the bottom.
5. Recalculate the Summary Dashboard counts.
6. If new UI components were built, also update [ui-registry.md](ui-registry.md).

---

# Phase 0 — Foundation & Scaffolding

### 0.1 Repo & Tooling — ●

- **Loop step:** Done (no visual surface)
- **Scope:** Next.js + backend workspaces, TypeScript strict, ESLint/Prettier, Tailwind configured with GSP tokens, **test runner (Vitest/Jest + supertest)**.
- **Files:** `package.json` (npm workspaces `apps/web`, `apps/api`) · `.prettierrc.json` · `.prettierignore` · `.editorconfig` · `.gitignore` · `apps/web/{package.json,tsconfig.json,next.config.mjs,tailwind.config.ts,postcss.config.mjs,.eslintrc.json,vitest.config.ts,vitest.setup.ts}` · `apps/web/src/shared/design/tokens.ts` · `apps/web/src/shared/utils/cn.ts` · `apps/api/{package.json,tsconfig.json,tsconfig.build.json,.eslintrc.json,vitest.config.ts}`
- **Verified:** `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` all pass in both workspaces.
- **Remaining:** None
- **Notes:** Test runner is **Vitest** in both workspaces (+ `supertest` for API routes, jsdom + Testing Library for the web). Tailwind **v3.4** with a TypeScript config, so `tokens.ts` is the single palette source imported by `tailwind.config.ts`. Path alias `@/*` is used in the web app only — the API uses relative imports, because `tsc` does not rewrite path aliases in emitted JS.

### 0.2 Design System Port — ●

- **Loop step:** 2 passed — **visual sign-off 2026-07-22**. Steps 3–6 are N/A for a component library; each consuming feature carries them.
- **Scope:** Tokens → `tailwind.config` (**with §9 contrast fixes — no `#aaa` text, no white-on-gold**); base components (Button, Card, Badge, Modal, Toast, Alert, form inputs) from [ui-registry.md](ui-registry.md) Foundations/Buttons/Feedback; **plus §9 components absent from the prototype** — `EmptyState`, skeletons, `ErrorState`, `Pagination`, `ConfirmDialog`, `FormField`.
- **Verification:** ✅ Component gallery at **`/gallery`** renders every base component in all variants **and states** (loading/empty/error/disabled). Confirmed responsive at 900 / 768 / 480px.
- **Components built (20):** `Button` · `Card`/`CardHeader` · `Badge` · `Alert` · `Modal` · `ConfirmDialog` · `ToastProvider`/`useToast` · `FormField` · `Input`/`PasswordInput` · `Select` · `Textarea` · `ToggleSwitch` · `SearchInput` · `EmptyState` · `ErrorState` · `Skeleton`/`TableSkeleton`/`CardSkeleton`/`ChartSkeleton` · `Pagination` · `Table` primitives (`TableWrapper`, `Table`, `TableHead`, `TableBody`, `TableRow`, `TableHeaderCell`, `TableCell`, `TableAvatar`)
- **Files:** `apps/web/src/shared/components/ui/*` · `apps/web/src/shared/components/icons.ts` · `apps/web/src/shared/hooks/{use-focus-trap,use-body-scroll-lock,use-media-query}.ts` · `apps/web/src/app/globals.css` · `apps/web/src/app/(app)/gallery/*`
- **Remaining:** None. Components not in 0.2 scope stay `planned` in [ui-registry.md](ui-registry.md) §9 — `SortableTableHeader`, `Combobox` and `DatePicker` are all needed by 1.3.
- **Notes:** Contrast fixes applied — `.btn-gold` now uses `#8a7500` (4.54:1 with white) instead of `--gold` (2.30:1), and every muted text token is `--gray` `#6c757d` (4.76:1); `#aaa` is not ported anywhere. `Table` was built alongside the §9 list because `TableSkeleton`, `EmptyState` and `Pagination` cannot be verified without it. `StatCard`, charts and the calendar stay `prototype` — they belong to feature 1.5.

### 0.3 App Shell — ●

- **Loop step:** 2 passed — **visual sign-off 2026-07-22**. Role-filtered nav and the authenticated user block are feature 1.2, not unfinished 0.3 work.
- **Scope:** Sidebar, topbar, page container, responsive off-canvas sidebar.
- **Verification:** ✅ Navigable shell with placeholder pages, confirmed at 900px, 768px & 480px. Working mobile menu toggle + backdrop verified — the prototype's is broken ([ui-rules.md](ui-rules.md) §5).
- **Components built:** `AppShell` · `Sidebar` · `Topbar` · `PageHeader` · `PlaceholderPage` · `NAV_SECTIONS`
- **Files:** `apps/web/src/shared/components/layout/*` · `apps/web/src/app/layout.tsx` · `apps/web/src/app/page.tsx` · `apps/web/src/app/(app)/layout.tsx` · 12 placeholder routes under `apps/web/src/app/(app)/`
- **Routes:** `/dashboard` `/organizations` `/members` `/approvals` `/events` `/attendance` `/badges` `/finance` `/reports` `/analytics` `/profile` `/settings` `/gallery`
- **Remaining:** None for 0.3. The placeholder pages are disposable — each is replaced wholesale by its feature's real screen, never built on.
- **Notes:** All four prototype mobile-nav defects fixed — the toggle is visible below `md`, an interactive backdrop closes the panel, body scroll locks while open, and focus is trapped and restored. Escape closes it; navigating closes it; crossing the breakpoint closes it. Landmarks are real `nav`/`header`/`main` plus a skip link.

### 0.4 Backend Spine — ●

- **Loop step:** Done (no visual surface)
- **Scope:** `app.ts`/`server.ts`, singleton `asyncHandler`, centralized `errorHandler`, Prisma client, health route, `/api/v1` versioning, **`.env` + typed env-schema validation** (`DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET`).
- **Endpoints:** `GET /api/v1/health` — **live**. Returns 200 `{success,data}` when the DB answers, 503 with `status: "degraded"` when it does not.
- **Files:** `apps/api/src/{app.ts,server.ts}` · `apps/api/src/config/{env.ts,prisma.ts}` · `apps/api/src/shared/handlers/{async-handler.ts,error-handler.ts}` · `apps/api/src/shared/utils/{api-error.ts,api-response.ts}` · `apps/api/src/shared/constants/roles.ts` · `apps/api/src/routes/v1.ts` · `apps/api/src/modules/health/*` · `apps/api/.env.example` · `apps/api/tests/*`
- **Verified:** 8 passing tests (health service unit tests, health route via supertest, 404 envelope, `ApiError`/`ZodError`/unexpected-error formatting). Booted and hit live: health → 503 degraded with no DB, unknown route → 404 envelope. Env validation fails fast with a named list of missing keys.
- **Remaining:** None
- **Notes:** Response envelope is `{success,data,meta?}` / `{success,error:{code,message,details?}}` — every module uses it. Filenames are kebab-case (`async-handler.ts`) per [code-standards.md](code-standards.md) §4, not the camelCase shown in [architecture.md](architecture.md) §4.1. `.env` is loaded relative to the workspace root, so cwd does not matter.

### 0.5 Database Schema + Seed — ●

- **Loop step:** Done (no visual surface)
- **Scope:** Prisma schema for all domains in [database-design.md](database-design.md); migrations; seed with realistic demo data (councils, troops, members, events, badges) **plus the 3 roles and their permissions**.
- **Models done (33):** User · Role · Permission · UserRole · RolePermission · RefreshToken · AuditLog · Council · Troop · ScoutLevel · BadgeCategory · ActivityCategory · MemberStatus · Member · MemberProfile · Membership · Event · EventRegistration · AttendanceRecord · AttendanceSummary · ActivityReport · Badge · BadgeRequirement · MemberBadge · AchievementRecord · FeeType · Payment · Expense · FinancialPeriod · FinancialSummary · Report · ReportTemplate · AnalyticsSnapshot · Notification · AnnouncementPost · SystemSetting
- **Files:** `apps/api/prisma/schema.prisma` · `apps/api/prisma/seed.ts` · `apps/api/prisma.config.ts` · `apps/api/prisma/migrations/20260722142556_init/`
- **Verified:** ✅ Migration `20260722142556_init` created and applied to **Neon PostgreSQL** — 37 tables live. Seed ran clean and was re-run to confirm idempotency (identical counts): 4 users · 3 roles · 26 permissions · 57 role-permission links · 1 council · 3 troops · 10 members (7 scouts + 3 adult leaders) · 10 memberships · 6 badges · 7 member badges · 4 events · 24 registrations · 12 attendance records · 5 payments · 4 settings. The one-role-per-user invariant holds. `GET /api/v1/health` now returns **200 `status: ok`, `database: up`**.
- **Remaining:** None.
- **Notes:** Seed data becomes the "real" data that replaces feature mocks at Loop step 4. Role model is relational (`user_roles` + `role_permissions`) — no role column on `users`; seeds `admin`, `executive_council`, `troop_leader` with 26 permissions wired through `role_permissions`. Seed is idempotent (upsert-keyed) and covers 4 users, 1 council, 3 troops, 10 members (6 scouts + 3 adult leaders + mixed statuses), 6 badges, 4 events with attendance, payments, expenses and settings. Demo password comes from `SEED_PASSWORD`. Beyond the design doc, the schema adds: `MemberType` (scout vs adult leader, feature 1.3), member approval columns (`reviewedById`/`reviewedAt`/`rejectionReason`, feature 1.4), `ActivityReport` (feature 2.3), and `ScoutLevel` on `Member` — all four are required by features in the build plan that the original table list did not cover.
- **Prisma 7 (upgraded 2026-07-22, exact-pinned `7.9.0`):** the connection URL is **not** in `schema.prisma`. Migrate reads it from `prisma.config.ts`; the runtime client is constructed with the **node-postgres driver adapter** (`@prisma/adapter-pg`) in `src/config/prisma.ts`. Anything that needs a client must import that singleton — `new PrismaClient()` with no adapter throws on v7. The `package.json#prisma` seed key was removed; the seed command now lives in `prisma.config.ts` under `migrations.seed`. Verified after the upgrade: schema valid, client generates, `migrate status` clean, `migrate diff` reports **no drift** against the v6-built database, seed re-runs green, health returns `database: up`.

---

## Visual sign-off record — 2026-07-22

**0.2 and 0.3 passed Feature Loop gate 2.** Human-verified: the gallery and the shell render correctly and are responsive at **900 / 768 / 480px**.

This sign-off approved five deliberate deviations from the prototype. They are now the house standard — apply them to every Phase 1+ screen without re-asking:

1. **Mobile-first breakpoints.** The prototype is desktop-first with `max-width` queries; the port inverts to Tailwind's `min-width` default with a custom `lg2: 900px` stop. Same three breakpoints, opposite direction. Recorded in [ui-rules.md](ui-rules.md) §5 and [ui-registry.md](ui-registry.md). **Never write `max-*` variants.**
2. **Gold buttons are `#8a7500`, not `--gold`.** White on `--gold` measures 2.30:1. Decorative gold is unchanged for borders, fills and chart segments.
3. **Emoji → `react-icons`.** Icons are re-exported under semantic names from `@/shared/components/icons` so the set stays swappable in one place. Never import from `react-icons/*` in a feature.
4. **Tables carry a `<caption>`** (visually hidden by default) and real `<th scope="col">`.
5. **Buttons, not divs.** Every interactive element is a real control; the prototype's 89 inline `onclick` handlers on `<div>`s are not reproduced.

Not covered by this sign-off, and still to be confirmed per feature as screens are built: keyboard-only walkthroughs of real forms, and a screen-reader pass. The primitives support both (focus trap, `aria-live`, labelled controls) but no audit has been run against a real feature screen.

---

# Phase 1 — Core Operations

### 1.1 Authentication — ●

- **Loop step:** Done (steps 1–6 complete). Visual sign-off (step 2) passed 2026-07-23; Contract (step 3) same day; Wire Read (step 4, login+refresh) same day; Wire Write (step 5, signup+logout+forgot-password) same day; service-layer tests + manual failure-path walk (step 6) same day.
- **Screens:** `/login` — auth card with Log In / Sign Up tabs (`role="tablist"`), 3-way role selector (Administrator / Executive Council / Troop Leader) shared by both tabs, password strength meter on signup, forgot-password modal
- **Components:** `AuthCard`, `LoginForm`, `SignupForm`, `RoleSelector`, `PasswordStrengthMeter`, `ForgotPasswordModal` — all reuse existing `Alert`/`Button`/`FormField`/`Input`/`PasswordInput`/`Select`/`Modal`/`Toast` from the kit, no base primitives duplicated
- **Endpoints:** **All 5 live** — `POST /api/v1/auth/login|refresh|signup|logout|forgot-password`, all public by design (auth issues sessions, so none of its own routes can require one). Real DB, real JWTs, refresh rotation, transactional user+role creation, best-effort revoke on logout, non-enumerating forgot-password response.
- **Files:** `apps/web/src/app/(auth)/login/page.tsx` · `apps/web/src/features/auth/types.ts` · `apps/web/src/features/auth/constants.ts` · `apps/web/src/features/auth/services/auth.service.ts` · `apps/web/src/features/auth/components/{auth-card,login-form,signup-form,role-selector,password-strength-meter,forgot-password-modal}.tsx` · `apps/web/src/shared/mocks/auth.mock.ts` · `apps/web/src/app/api/auth/{login,refresh,signup,logout,forgot-password}/route.ts` · `apps/web/src/middleware.ts` · `apps/web/src/config/env.ts` · `apps/web/src/shared/utils/jwt.ts` · `apps/web/.env.example` · `apps/api/src/modules/auth/{auth.types,auth.schema,auth.repository,auth.service,auth.middleware,auth.controller,auth.routes,index}.ts` · `apps/api/src/shared/utils/{jwt,password}.ts` · `apps/api/src/config/env.ts` · `apps/api/.env.example` · `apps/api/src/routes/v1.ts` · `apps/api/tests/auth.test.ts`
- **Verified so far:** `npm run typecheck`/`npm run lint`/`npm test` all clean in both workspaces (19 API tests passing, 11 of them `auth.test.ts` covering login/signup/logout/forgotPassword happy + failure paths). Playwright-driven browser tests against the real dev servers + seeded Neon DB: admin login → real `fullName` in the success toast → redirect to `/dashboard`; bad password → real "Invalid email or password." alert; signup (executive council role) → real "Account created for …" toast → auto-login redirect to `/dashboard`; re-submitting the same signup email → real "An account with this email already exists." `Alert`; forgot-password → real generic "If that email is registered…" toast; `document.cookie` confirmed empty after both login and signup (all tokens genuinely httpOnly); signed-in visitor hitting `/login` bounces to `/dashboard`; signed-out visitor hitting `/members` bounces to `/login`. Backend also curl-verified directly: refresh rotates the token and the old one is rejected on reuse; logout revokes the presented refresh token and a subsequent `/refresh` with it is rejected; admin signup rejects a wrong `adminSecretKey` with 403.
- **Deliberate deviations from the prototype — flag at visual verify:**
  1. Forgot-password is a `Modal` form, not the prototype's `prompt()`/`alert()` pair (those block the thread and bypass the app's focus-trap/`aria-live` machinery).
  2. Signup's password-mismatch and "8 char minimum" errors render as field-level `FormField` errors, not a single top banner — the top `Alert` is reserved for login's non-field-specific "invalid credentials" case.
  3. Troop leader signup's second dropdown is relabeled "Primary Scout Level" and populated from the real seeded `scout_levels` names (Twinkler/Star Scout/Junior Girl Scout/Senior Girl Scout/Cadet Girl Scout) — the prototype's "Troop Type" list had a stray "Tagalog" entry and a duplicated "Cadet".
  4. Demo-fill credentials are the **real seeded accounts** (`admin@gsp-catanduanes.ph`, `council@gsp-catanduanes.ph`, `leader.virac@gsp-catanduanes.ph`, password `GspDemo!2026`) so the button keeps working once step 4 wires the real endpoint.
  5. Header trefoil uses the real logo (`context/img/logo.jpg`, now `apps/web/public/logo.jpg`) via `next/image`, not the prototype's `<img src="img/img1.jpg">` placeholder.
- **Round 1 review fixes (2026-07-22):** header `<h1>` was rendering dark, not white — the global `h1,h2,h3,h4 { color: ink }` base rule in `globals.css` wins over an inherited color from a colored wrapper, so any heading on a gradient surface needs its color set explicitly (fixed locally in `auth-card.tsx`; not a globals.css change). Swapped the placeholder monogram for the real logo. Added the required-field validation that was missing on Sign Up's First/Last Name and Email — `noValidate` was suppressing native browser validation and nothing had replaced it for those three fields (only password/confirm had custom checks), so submitting with them empty showed no feedback at all; this is still client-only, the real Zod schema lands at step 3.
- **Round 2 review fix (2026-07-23):** same gap on Log In — email/password had no required-field errors either, so an empty submit fell straight through to the generic "Invalid email or password" alert instead of pointing at the empty fields. `handleSubmit` now checks both are non-empty and shows a field-level "required" error before it ever compares against the demo account.
- **Tooling change (2026-07-23):** installed the **Playwright MCP server** (`.mcp.json` at repo root, pre-approved via `enableAllProjectMcpServers: true` in the gitignored `.claude/settings.local.json`) so the agent can drive a real browser instead of curl-only smoke checks. Active as of this session.
- **Visual sign-off (2026-07-23):** Human confirmed `/login` — UI, responsiveness (900/768/480px), and validation states all good. **Feature Loop gate 2 passed.**
- **Contract (2026-07-23):** Backend `auth.schema.ts` (Zod: `loginSchema`, `signupSchema` as a `role`-discriminated union for the three account types, `forgotPasswordSchema`, `refreshSchema`, `logoutSchema`) + `auth.types.ts` (`AuthUser`, `AuthTokens`, request/response bodies). Frontend `features/auth/types.ts` mirrors it: `AuthUser`, `LoginRequest`, `SignupRequest`, `ForgotPasswordRequest`, and the browser-facing `LoginResponse`/`SignupResponse` (`{ user }` only, no `tokens`).
- **Wire Read (2026-07-23):** Backend — `auth.repository.ts` (Prisma: find user + role join, refresh-token CRUD), `auth.service.ts` (bcrypt verify, JWT issue via `shared/utils/jwt.ts`, one-role-per-user enforced with `ApiError.internal` as a defensive check, refresh-token rotation via a `sha256` hash of the token stored in `refresh_tokens`), `auth.middleware.ts` (`requireAuth`/`requireRole` — built but not yet applied anywhere; nothing needs protecting until 1.2+), thin `auth.controller.ts`, `auth.routes.ts` mounting `login`/`refresh` only. Mounted at `/api/v1/auth` in `routes/v1.ts`.
  Frontend — `features/auth/services/auth.service.ts` (calls the BFF, never the Express API directly), two BFF Route Handlers (`app/api/auth/login`, `app/api/auth/refresh`) that call the real API server-to-server and translate `tokens` into httpOnly cookies (`access_token`/`refresh_token`, `sameSite: lax`, `maxAge` sized from each JWT's own `exp` claim — no separate expiry-parsing logic needed on the web side). `middleware.ts` gates the whole app on cookie *presence* (not signature/expiry — real enforcement is `requireAuth` API-side once something needs protecting); redirects signed-out visitors to `/login` and signed-in visitors away from it. `LoginForm` now calls the real service instead of comparing against `DEMO_ACCOUNTS`; `fillDemo()` is unchanged (still just fills the inputs with real seeded credentials, which now go through a real request). Removed `DEMO_USERS` from `auth.mock.ts` — added at the Contract step, superseded before it was ever consumed, so it would have shipped as dead code.
  Added `jsonwebtoken` to `apps/api` (pre-existing `bcryptjs` covers hashing). No new frontend dependency — env config and JWT-payload decoding are both small enough to hand-write rather than pull in `zod`/`jose` for the web workspace.
- **Wire Write (2026-07-23):** Backend — `auth.repository.ts` gained `findRoleByName` and `createUserWithRole` (a single nested Prisma write: `users` + its one `user_roles` row, atomic by construction — never one without the other). `auth.service.ts` gained `signup` (duplicate-email → 409, admin role gated by a new `ADMIN_SIGNUP_KEY` env secret compared server-side → 403 on mismatch, then transactional create + immediate token issue so signup auto-logs in exactly like login), `logout` (hashes the presented refresh token, revokes it if an active row is found, but **always** returns a generic success message — a client can always clear its cookies even if the token was already gone), `forgotPassword` (returns one fixed message regardless of whether the email exists — no user-enumeration surface, no DB lookup needed since the response never varies). `auth.controller.ts`/`auth.routes.ts` now expose all three; all five auth routes stay public by design.
  Frontend — three new BFF routes (`app/api/auth/{signup,logout,forgot-password}`) following the established pattern: `signup` sets cookies from the returned tokens exactly like `login`; `logout` reads its own refresh cookie, best-effort-forwards it to the API (swallowing network errors), and unconditionally clears both cookies; `forgot-password` is a plain proxy. `features/auth/services/auth.service.ts` gained matching `signup`/`logout`/`forgotPassword` functions. `SignupForm` gained controlled state + required-field validation for every role-specific field (council name/region/code, troop number/scout level/home council, employee ID/admin secret key — previously these were uncontrolled placeholder-only inputs left over from the mock step) and now calls the real service, showing a toast + redirecting to `/dashboard` on success or a top `Alert` on failure (duplicate email, wrong admin key), mirroring `LoginForm`. `ForgotPasswordModal` now calls the real service instead of a `setTimeout`; because the backend response is deliberately identical whether or not the email exists, a thrown error there only ever means a genuine network/server fault, shown as a generic error toast.
  **Scope boundary — documented, not a gap:** `signup`'s role-specific affiliation fields (troop number, home council, council name/region/code, employee ID) are validated by `signupSchema` but have no relational home yet — linking a troop leader to a real `Troop` row or an executive to a real `Council` row is an admin action that belongs to feature 1.6 (Organization Management), not something self-signup can assert. Only the account itself (`users` + one `user_roles` row) is persisted; see the comment on `authService.signup`.
  The Sidebar's "Sign out" button (`shared/components/layout/sidebar.tsx`) stays disabled — showing the real signed-in user and wiring that click is 1.2's "user footer block, logout" scope, not 1.1's. The frontend `logout()` service function is ready for 1.2 to call.
- **Test & Done (2026-07-23):** Added `apps/api/tests/auth.test.ts` — 11 tests covering `login` (success, unknown email, deactivated account, wrong password), `signup` (success with exactly one role assigned, duplicate email, admin with wrong/correct secret key), `logout` (revokes an active token, still succeeds on an unknown/already-revoked one), and `forgotPassword`. Repository calls are mocked via `vi.spyOn`; password hashing and JWT signing run for real (pure functions, no I/O) so the tests exercise real bcrypt/JWT behavior. `ADMIN_SIGNUP_KEY` added to `tests/setup.ts`. RBAC middleware (`requireAuth`/`requireRole`) remains built but genuinely inapplicable here — none of auth's own 5 routes can require a session (they're what creates one); it stays ready for 1.2, the first feature with a route to protect.
- **Not built (deliberately out of scope):** a client-side silent-refresh interceptor that calls `/api/auth/refresh` automatically on a 401 — nothing authenticated exists yet to trigger it; the endpoint is ready and manually verified, the interceptor is deferred to whichever feature first needs authenticated fetches.
- **Notes:** BFF issues httpOnly cookies; API stays stateless ([project-overview.md](project-overview.md) → Authentication). Role state is shared between the Login and Sign Up tabs (switching tabs keeps the selected role), matching the prototype's single `currentRole` variable.

### 1.2 App Shell + Role-Based Navigation — ☐

- **Loop step:** —
- **Screens:** Authenticated sidebar (role-filtered nav), user footer block, logout
- **Endpoints:** consumes session from 1.1
- **Done gate:** Each role sees only permitted menu items; unauthorized routes blocked.
- **Remaining:** All

### 1.3 Membership Management — ☐

- **Loop step:** —
- **Screens:** Member directory table (search/filter/status) · register/edit modal (scout **and** adult leader types) · member profile page · archive/restore · renew
- **Components:** `.table-wrapper`, `.table-avatar`, `.badge`, `.modal-*`, `.form-row`, `.btn-*`
- **Endpoints:** `GET/POST/PUT /api/v1/members` · `PATCH /api/v1/members/:id/archive|restore` · `POST /api/v1/members/:id/renew`
- **Done gate:** Both registration types work; renewal updates status visibly; full CRUD + search/filter/archive working; validation both sides.
- **Remaining:** All
- **Notes:** Built before the dashboard — dashboard aggregates this data.

### 1.4 Membership Approval (Executive Council) — ☐

- **Loop step:** —
- **Screens:** Pending-registrations queue · review modal · approve/reject with reason
- **Components:** `.table-wrapper`, `.modal-*`, `.badge` (pending/approved/rejected), `.btn-green`, `.btn-red`
- **Endpoints:** `GET /api/v1/members/pending` · `PATCH /api/v1/members/:id/approve|reject`
- **Access:** Executive Council + Admin
- **Done gate:** Member registered in 1.3 appears in queue, can be approved/rejected, status change visible in the directory.
- **Remaining:** All

### 1.5 Dashboard (role-aware) — ☐

- **Loop step:** —
- **Screens:** Stat cards row · membership-growth bar chart · distribution donut · activity feed · KPI/progress widgets
- **Components:** `.stats-grid`, `.stat-card`, `.card`, `.bar-chart`, `.donut`, `.activity-item`, `.progress-bar`
- **Endpoints:** `GET /api/v1/dashboard` — role from session/JWT, **never a client param**
- **Done gate:** Numbers/charts reflect real member data from 1.3; each role's variant renders.
- **Remaining:** All
- **Notes:** Charts port from CSS placeholders to `react-chartjs-2`, same color mapping.

### 1.6 Organization Management — ☐

- **Loop step:** —
- **Screens:** Councils table · troops table · scout levels / badge categories / activity categories config
- **Endpoints:** `/api/v1/organizations/councils` · `/troops` · `/scout-levels` · `/badge-categories` · `/activity-categories`
- **Access:** Admin only
- **Done gate:** Admin can CRUD org hierarchy; troop leader assignment reflected in membership.
- **Remaining:** All

---

# Phase 2 — Activities & Engagement

### 2.1 Event Management — ☐

- **Loop step:** —
- **Screens:** Event list/cards · calendar view · create/edit modal · event detail page
- **Components:** `.cal-grid`, `.cal-day`, `.card`, `.modal-*`, `.badge`
- **Endpoints:** `GET/POST/PUT/DELETE /api/v1/events`
- **Done gate:** Events visible on calendar + list; CRUD works; leader/troop assignment saved.
- **Remaining:** All

### 2.2 Event Registration & Attendance — ☐

- **Loop step:** —
- **Screens:** Registration form · participant list · attendance checklist · attendance summary
- **Components:** `.table-wrapper`, `.avatar-group`, `.toggle-switch`, `.progress-bar`
- **Endpoints:** `/api/v1/events/:id/registrations` · `/api/v1/attendance`
- **Done gate:** Attendance recordable per event; summary + rate visible with threshold coloring.
- **Remaining:** All

### 2.3 Activity Report Submission (Troop Leader) — ☐

- **Loop step:** —
- **Screens:** Submit-report form · my-submitted-reports table · report detail · Council review status
- **Components:** `.form-group`, `.table-wrapper`, `.badge` (submitted/reviewed), `.modal-*`
- **Endpoints:** `GET/POST /api/v1/activity-reports` · `GET /api/v1/activity-reports/:id`
- **Access:** Troop Leader submits; Executive Council + Admin read
- **Done gate:** Troop leader submits a report against a real event; Council sees it.
- **Remaining:** All
- **Notes:** Distinct from 3.2 Reports — that _generates/exports_ from system data; this is human _submission_.

### 2.4 Badges & Achievements — ☐

- **Loop step:** —
- **Screens:** Badge catalog grid · progress tracker · achievement history · verify action
- **Components:** `.badge-grid`, `.badge-card` (`.earned`), `.progress-bar`
- **Endpoints:** `/api/v1/badges` · `/api/v1/members/:id/badges`
- **Done gate:** Badges awarded/verified; per-member progress visible.
- **Remaining:** All

### 2.5 Notifications & Announcements — ☐

- **Loop step:** —
- **Screens:** Notification dropdown panel · announcement feed · unread state
- **Components:** `.notif-panel`, `.notif-item` (`.unread`), `.notif-icon`, `.notif-dot`
- **Endpoints:** `/api/v1/notifications` · `/api/v1/announcements`
- **Done gate:** Notifications generated by real actions appear; unread badge accurate.
- **Remaining:** All

---

# Phase 3 — Finance, Reporting & Administration

### 3.1 Finance Management — ☐

- **Loop step:** —
- **Screens:** Financial dashboard · payment form · expense log table · fee-type config · budget summary
- **Endpoints:** `/api/v1/finance/payments` · `/expenses` · `/fee-types` · `/summaries`
- **Done gate:** Payments/expenses recorded; summaries + balances reflect data.
- **Remaining:** All

### 3.2 Reports — ☐

- **Loop step:** —
- **Screens:** Report type selector · filters · preview · export actions
- **Types:** Membership · Attendance · Badge · Financial · Activity · Executive
- **Endpoints:** `/api/v1/reports/:type` · `/api/v1/reports/:type/export`
- **Done gate:** Each report type previews real data and exports **PDF + Excel**.
- **Remaining:** All

### 3.3 Analytics (Executive) — ☐

- **Loop step:** —
- **Screens:** Membership/attendance trends · participation · badge completion · financial trends · org performance
- **Endpoints:** `/api/v1/analytics/*`
- **Access:** Executive Council + Admin
- **Done gate:** Analytics render from real data; role-gated.
- **Remaining:** All

### 3.4 Settings & System Administration — ☐

- **Loop step:** —
- **Screens:** Settings sections + toggles · user management (CRUD, activate/deactivate, reset password, assign roles) · audit log · system config · backup controls
- **Components:** `.settings-section`, `.settings-row`, `.toggle-switch`, `.table-wrapper`
- **Endpoints:** `/api/v1/settings` · `/api/v1/users` · `/api/v1/audit-logs`
- **Done gate:** Admin manages users/roles/permissions; settings persist; audit log shows critical actions.
- **Remaining:** All

### 3.5 Profile Management — ☐

- **Loop step:** —
- **Screens:** Profile header + editable info · password change
- **Components:** `.profile-header`, `.profile-avatar-lg`, `.role-tag`, `.form-group`
- **Endpoints:** `GET/PUT /api/v1/profile` · `POST /api/v1/profile/change-password`
- **Access:** All roles (own profile)
- **Done gate:** Any user edits own profile + changes password.
- **Remaining:** All

---

## Cross-Cutting Checklist

Verified continuously, re-checked at each phase exit ([build-plan.md](build-plan.md) §4):

| Concern                                                   | Status | Notes                                                                                                                             |
| --------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------- |
| RBAC enforced per route                                   | ◔      | `requireAuth`/`requireRole` built in `auth.middleware.ts` (1.1) but not applied anywhere yet — auth's own 5 routes are correctly public (they issue sessions); first real gate lands with 1.2+ |
| Validation (frontend + backend)                           | ●      | Backend: all 5 auth schemas (Zod) live on real routes incl. the `role`-discriminated `signupSchema`; `ZodError` → 422 with field details. Frontend: `FormField` renders field errors on both the login and signup forms, incl. every role-specific field |
| Centralized error handling                                | ●      | Singleton `asyncHandler` + one `errorHandler`; `ApiError`, `ZodError` and Prisma P2002/P2025 mapped. Covered by tests             |
| Password hashing + secure storage                         | ●      | `bcryptjs` in the seed and in `authService.login`/`signup` (`shared/utils/password.ts`) — real bcrypt hash/compare, no plaintext ever persisted |
| Audit logging on critical actions                         | ☐      | `audit_logs` table exists; writes begin with 1.4                                                                                  |
| Responsive at 900px / 768px / 480px                       | ◑      | Mobile-first with a custom `lg2: 900px` stop. **Human-verified 2026-07-22** on the gallery + shell; re-checked per feature screen |
| Mobile nav reachable (toggle + backdrop + scroll lock)    | ●      | All four prototype defects fixed in `AppShell`/`Sidebar`. **Human-verified 2026-07-22**                                           |
| Loading / empty / error states                            | ◑      | `TableSkeleton`, `CardSkeleton`, `ChartSkeleton`, `EmptyState`, `ErrorState` built and shown in `/gallery`                        |
| Accessibility (labels, focus, keyboard modals)            | ◔      | Focus trap + restore, scroll lock, Escape, skip link, `aria-live` toasts, labelled controls. No audit run yet                     |
| WCAG AA contrast (no `#aaa` text, no white-on-gold)       | ●      | `#aaa` not ported; gold buttons use `#8a7500` (4.54:1). Both failures resolved at the token layer                                 |
| Semantic landmarks (`nav`/`main`/`header`, heading order) | ●      | Real landmarks + skip link; `h1` in topbar, `h2` per page, `h3` per card                                                          |
| Empty / loading / error states on every list              | ◔      | Components exist; enforcement is per-feature from 1.3                                                                             |
| Pagination on tables that can grow                        | ◔      | `Pagination` built and unit-tested; wired per feature from 1.3                                                                    |
| Unit tests on service layer                               | ◑      | 24 tests passing (19 API, 5 web): health service, error handler, `asyncHandler`, `buildPageRange`, and now `authService` (login/signup/logout/forgotPassword, 11 tests) |

---

## Open Decisions

| #   | Decision                                                                                                                                       | Status                | Blocks |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ------ |
| 1   | Icons: `react-icons` (emoji prototype replaced)                                                                                                | ✅ Settled 2026-07-22 | —      |
| 2   | Charts: `react-chartjs-2` as ChartJS wrapper                                                                                                   | ✅ Settled 2026-07-22 | —      |
| 3   | Mutations: refetch after write, not optimistic                                                                                                 | ✅ Settled 2026-07-22 | —      |
| 4   | Dashboard role from session/JWT, never client param                                                                                            | ✅ Settled 2026-07-22 | —      |
| 5   | Role model: relational `user_roles` + `role_permissions` authoritative; no role column on `users`; one role per user enforced in service layer | ✅ Settled 2026-07-22 | —      |

| 6 | Breakpoints: **mobile-first**, `min-width` only, custom `lg2: 900px`. No `max-*` variants | ✅ Settled 2026-07-22 | — |
| 7 | Email-sending service (provider, shared `EmailService` location, which feature builds it out) — added to [build-plan.md](build-plan.md) §7 2026-07-23 after noting 1.1's `forgot-password` sends no real email | 🟡 Open | Real delivery for 1.1's forgot-password reset link; 2.5's event reminders/announcements staying in-app-only vs. also emailing |

**One open decision (#7, email-sending service) — non-blocking. 1.1 Authentication is done (●); 1.2 App Shell + Role-Based Navigation is next and does not depend on it.**

---

## Blockers

| Date       | Feature   | Blocker                                                                                                                                                                                                                                                                                                                                                  | Owner | Resolved                                                           |
| ---------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ------------------------------------------------------------------ |
| 2026-07-22 | 0.5       | No PostgreSQL instance available — schema validates and the client generates, but no migration has been applied and the seed has not run. Nothing downstream is blocked until feature 1.1 needs to read real data.                                                                                                                                       | Human | ✅ 2026-07-22 — Neon connected, `init` migration applied, seed run |
| 2026-07-22 | 0.5       | **Prisma tooling version mismatch — cosmetic, editor-only.** The Prisma VS Code extension's language server is a Prisma **7** build and flags `datasource.url` in `schema.prisma` as unsupported. The project is pinned to Prisma **6.19.3**, where that line is correct and required — `validate`, `migrate` and `generate` all pass. Not a schema bug. | Human | ✅ 2026-07-22 — resolved by upgrading the project to Prisma 7.9.0  |
| 2026-07-22 | 0.2 / 0.3 | Feature Loop gate 2 needs a human to view `/gallery` and the shell at 900 / 768 / 480px. Phase 1 should not start until this passes.                                                                                                                                                                                                                     | Human | ✅ 2026-07-22 — passed at all three breakpoints                    |

---

## Session Log

Newest first. One entry per work session — what was done, where it stopped, what's next.

| Date       | Worked on                                 | Outcome                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Next step                                                                                                                                                                                                     |
| ---------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-23 | **Open decision #7 — email-sending service** | User asked whether forgot-password actually sends email (it doesn't — generic response only, no provider). Checked build-plan.md and project-overview.md: no feature anywhere scopes real email delivery; 2.5 Notifications & Announcements is in-app only. Added decision #7 to build-plan.md §7 (provider TBD, needs a shared `EmailService` under `apps/api/src/shared/`, not duplicated per feature) with pointers from 1.1's forgot-password and 2.5's scope note. Non-blocking — doesn't gate 1.2. | **1.2 App Shell + Role-Based Navigation** — same next step as below; this was a documentation-only addendum, no code changed. |
| 2026-07-23 | **1.1 Authentication — Wire Write + Test & Done (Loop steps 5–6) — feature complete (●)** | Wired the three remaining endpoints for real: `signup` (backend `createUserWithRole` — one atomic nested Prisma write for `users` + its `user_roles` row; duplicate email → 409; admin role gated by a new `ADMIN_SIGNUP_KEY` env secret → 403 on mismatch; issues tokens immediately so signup auto-logs in), `logout` (best-effort revoke by hashed token, but always returns success so the client can always clear cookies), `forgot-password` (one fixed message regardless of whether the email exists — no enumeration, no DB lookup). Added matching BFF routes (`app/api/auth/{signup,logout,forgot-password}`) and frontend service functions. Rebuilt `SignupForm` with controlled state + required-field validation for every role-specific field (previously uncontrolled placeholder inputs left from the mock step) and wired it to the real service with toast/redirect on success and a top `Alert` on failure. Wired `ForgotPasswordModal` off its `setTimeout` onto the real call. Documented a deliberate scope boundary: signup's role-affiliation fields (troop number, home council, council name/region/code, employee ID) are validated but not persisted anywhere relational yet — that linking is an admin action in 1.6 (Organization Management), not something self-signup can assert. Left the Sidebar's disabled "Sign out" button untouched — enabling it is 1.2's job, but the `logout()` service function is ready for it. Added `apps/api/tests/auth.test.ts` (11 tests: login/signup/logout/forgotPassword happy + failure paths, repository mocked via `vi.spyOn`, real bcrypt/JWT). All 24 tests pass, typecheck/lint clean in both workspaces. Verified live: curl confirmed signup creates a real Neon row, duplicate-email and wrong-admin-key rejections, logout revocation + refresh-reuse rejection; Playwright confirmed the full browser flow for signup (real toast, auto-login redirect, httpOnly cookies) and forgot-password (real toast), plus the duplicate-email `Alert` rendering. RBAC middleware stays unapplied by design — none of auth's own routes can require a session. **1.1 Authentication is done.** | **1.2 App Shell + Role-Based Navigation** — start at Loop step 1: wire the existing shell's sidebar/topbar to a real session (role-filtered nav items, real user identity in the footer block, enable the currently-disabled "Sign out" button using the `logout()` service function already built). |
| 2026-07-23 | **1.1 Authentication — Wire Read (Loop step 4)** | Login is real end-to-end: backend `auth.repository/service/middleware/controller/routes.ts` mounted at `/api/v1/auth` (login + refresh, with rotation), frontend `features/auth/services/auth.service.ts` + two BFF Route Handlers (`app/api/auth/login`, `.../refresh`) that translate API tokens into httpOnly cookies, and `middleware.ts` gating the whole app on cookie presence. `LoginForm` now calls the real service; removed the now-superseded `DEMO_USERS` mock fixture. Verified live with Playwright against the real dev servers and seeded Neon DB: correct admin login + redirect, correct real "Invalid email or password" on bad creds, cookies confirmed httpOnly (`document.cookie` empty), both middleware redirect directions, and refresh-token rotation + reuse-rejection via curl. `typecheck`/`lint`/`test` clean in both workspaces. | **Loop step 5 (Wire Write)** for 1.1 — wire `signup` (create user + role, transactional), `logout` (revoke refresh token + clear cookies), `forgot-password` (generic non-enumerating response). Then step 6: apply `requireAuth`/`requireRole` somewhere real, unit-test `authService`, walk every failure path. |
| 2026-07-23 | **1.1 Authentication — Contract (Loop step 3)** | Defined the auth contract: backend `apps/api/src/modules/auth/{auth.schema,auth.types}.ts` (Zod validation + `AuthUser`/`AuthTokens`/request-response DTOs for all 5 endpoints, signup discriminated by role), mirrored in `apps/web/src/features/auth/types.ts`, and a `DEMO_USERS` fixture added to `auth.mock.ts` conforming to the new `AuthUser` type. Deliberately stopped short of routes/controller/service/repository — those carry real logic and belong to Loop step 4. Both workspaces typecheck and lint clean. | **Loop step 4 (Wire Read)** for 1.1 — build `auth.routes/controller/service/repository.ts`, mount under `/api/v1/auth`, then replace the frontend's simulated `setTimeout` login/signup with a real fetch through a feature service, JWT + httpOnly cookies via the BFF. |
| 2026-07-23 | **1.1 Authentication — visual sign-off**  | Human checked `/login` end-to-end: UI, responsiveness (900/768/480px), and validation states all confirmed good. **Feature Loop gate 2 passed** — 1.1 moves ◔ → ◑. | **Loop step 3 (Contract)** for 1.1 — define the `POST /api/v1/auth/login\|signup\|refresh\|logout\|forgot-password` request/response shapes and Zod schemas before wiring reads. |
| 2026-07-23 | **1.1 Authentication — review round 2 + tooling** | Fixed the same "no field-level errors" bug on `LoginForm` that round 1 fixed on `SignupForm`: empty email/password fell straight through to the generic "Invalid email or password" alert instead of showing required-field errors first; `handleSubmit` now checks both are non-empty before comparing to the demo account. Installed the **Playwright MCP server** (`.mcp.json` + pre-approval in `.claude/settings.local.json`) so future sessions can drive a real browser instead of curl-only checks — **not active until the next Claude Code restart**, so it has not yet been used to verify anything in this session. | **Restart Claude Code / reload the VS Code window** to activate Playwright MCP, then re-run the full visual sign-off on `/login` (header white text, real logo, 900/768/480px, both forms' empty/invalid/mismatch states) with actual screenshots — this is still Loop step 2, still ungated. |
| 2026-07-22 | **1.1 Authentication — Loop step 1**      | Built the full `/login` screen with mock data: `AuthCard` (tabbed Log In / Sign Up), `RoleSelector` (3-way, real radio-group semantics), `LoginForm` with demo-fill against the actual seeded accounts, `SignupForm` with role-conditional fields and a `PasswordStrengthMeter`, and a `ForgotPasswordModal` replacing the prototype's `prompt()`/`alert()`. Reused every existing primitive (`Alert`, `Button`, `FormField`, `Input`, `PasswordInput`, `Select`, `Modal`, `Toast`) — built no new base components, only feature-local ones now registered in ui-registry.md. `typecheck` and `lint` clean. No visual/screenshot tool is available in this environment, so the dev server was only confirmed to boot and serve `/login` with the expected markup (curl) — **not** a substitute for the human visual-verify gate. | **Human visual sign-off** of `/login` at 900/768/480px against the five flagged deviations, then Loop step 3 (Contract) for 1.1. |
| 2026-07-22 | **Prisma 7 upgrade**                      | Resolved the editor/project version split by upgrading the project rather than downgrading the extension. `prisma` + `@prisma/client` → **7.9.0** (exact-pinned), added `@prisma/adapter-pg` + `pg`. Moved the connection URL out of `schema.prisma` into a new `prisma.config.ts`, wired the node-postgres driver adapter into `src/config/prisma.ts`, pointed `seed.ts` at that singleton, and dropped the removed `package.json#prisma` key. `migrate diff` confirms **no drift** — the v7 schema produces exactly the database the v6 migration built, so the existing migration stands. Also set `sslmode=verify-full` on the Neon URL to preserve strict certificate verification ahead of the pg v9 default change. All green: typecheck, lint, 13 tests, both builds, seed, health `database: up`. | **Feature 1.1 Authentication.**                                                                                                                                                                               |
| 2026-07-22 | **0.5 database live + Prisma diagnostic** | Connected Neon PostgreSQL, created and applied migration `20260722142556_init` (37 tables), and ran the seed — verified idempotent on a second run, one-role-per-user invariant intact, `GET /api/v1/health` now 200 `database: up`. Debugged the reported `datasource.url` error: **not a schema bug** — the Prisma VS Code extension's language server is a v7 build while the project is pinned to 6.19.3, where `url` is required. Added a schema comment so nobody "fixes" it by deleting the line.                                                                                                                                                                                                                                                                                                   | **Feature 1.1 Authentication.** Optional cleanup: pin the Prisma extension to v6 or plan a deliberate v7 upgrade.                                                                                             |
| 2026-07-22 | **Phase 0 exit — visual verify**          | Human tested `/gallery` and the app shell: correct and responsive at 900 / 768 / 480px. **0.2 and 0.3 passed Feature Loop gate 2** and moved ◔ → ●. Phase 0 is complete (5/5). The five deliberate deviations from the prototype are approved and are now the house standard; the breakpoint choice is recorded as decision #6.                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | **Feature 1.1 Authentication** — start at Loop step 1 (auth screen with mock data). The migration + seed is still open, but it only blocks 1.1's step 4, not its start.                                       |
| 2026-07-22 | **Phase 0 — 0.1 through 0.5**             | Scaffolded the monorepo (npm workspaces: `apps/web` Next 15 + Tailwind 3.4, `apps/api` Express + Prisma), ported the design system with both WCAG fixes applied at the token layer, built 20 UI components incl. all six §9 components the prototype lacked, built the app shell with all four mobile-nav defects fixed, built the backend spine (`asyncHandler`, `errorHandler`, typed env validation, `GET /api/v1/health`), and wrote the full 33-model Prisma schema plus an idempotent seed. Verified: typecheck, lint, 13 tests, production builds, and both servers booted and probed. Chose mobile-first breakpoints with a custom `lg2: 900px` (recorded in ui-rules §5).                                                                                                                         | **Human visual verification of `/gallery` and the shell at 900/768/480px** (Loop gate 2 for 0.2 and 0.3), then run the migration + seed against a PostgreSQL instance. Phase 1.1 (Authentication) after that. |
| 2026-07-22 | UI docs + skills pass                     | Reframed the prototype as a **baseline, not a ceiling** across all docs and skills. Audited Gsp.html: found 0 loading states, 0 empty states, 0 pagination (9 tables), ~1 semantic landmark, `outline:none` ×3, and 2 WCAG contrast failures (`#aaa` 2.32:1, white-on-gold 2.30:1). Added ui-rules §9 Accessibility + §10 Sanctioned Enhancements, ui-registry §9 (15 required components the prototype lacks), expanded Phase 0.2 scope to build them.                                                                                                                                                                                                                                                                                                                                                    | Begin Phase 0.1.                                                                                                                                                                                              |
| 2026-07-22 | Role model decision                       | Settled #5: relational `user_roles` authoritative, flat `User.role` removed from the Prisma example, added the missing `role_permissions` link table and full Prisma models to database-design.md. All decisions now closed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | —                                                                                                                                                                                                             |
| 2026-07-22 | Build-plan review                         | Audited plan vs. all source docs. Fixed 6 defects: icon/chart contradiction settled, dashboard `?role=` security flaw removed, 4 missing features added (renewal, adult-leader registration, approval workflow, activity-report submission), test runner added to 0.1, env/secrets added to 0.4, Phase 1 reordered so Membership precedes Dashboard. Count 19 → 21.                                                                                                                                                                                                                                                                                                                                                                                                                                        | Resolve open decision #5 (role model).                                                                                                                                                                        |
| 2026-07-22 | Planning docs                             | Created ui-rules, ui-registry, build-plan, progress tracker. Clarified auth/BFF wording in project-overview.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | —                                                                                                                                                                                                             |
