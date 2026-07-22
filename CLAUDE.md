# GSP Management Information System

Web platform for the **Girl Scouts of the Philippines** — membership, events, attendance, badges, finance, reports, and analytics with role-based access. Three roles: **Administrator**, **Executive Council**, **Troop Leader**.

## Current state — read this first

The repo is an npm-workspaces monorepo:

- `apps/web` — Next.js 15 + TypeScript + Tailwind 3.4. Shared UI kit in `src/shared/components/ui`, app shell in `src/shared/components/layout`, routes under `src/app/(app)/`.
- `apps/api` — Express + TypeScript + Prisma 7. Modules in `src/modules/<domain>/`, shared handlers in `src/shared/handlers/`.
- `context/` — planning docs and the static prototype.

**Phase 0 is complete** — 0.2 and 0.3 passed visual sign-off on 2026-07-22, and the database is live on **Neon PostgreSQL** (migration applied, seeded, `GET /api/v1/health` reports `database: up`). **Next feature: 1.1 Authentication.**

Check [context/progress.md](context/progress.md) at the start of every session — it is the single source of truth for what is actually built. Never assume a feature exists; verify there first.

```bash
npm run dev        # web on :3000    npm run dev:api   # api on :4000
npm run typecheck  # both workspaces  npm test          # both workspaces
```

## The one rule that governs everything

**UI-first, mock-data-first.** Every feature is built as a full, visible page with mock data and **visually verified by a human before any logic is written**. Then functionality is wired to that UI step by step.

**There are no invisible backend phases.** If you can't see it on screen, it isn't done. Never build a backend module "ahead" of its UI — that inverts the entire method.

The six-step **Feature Loop** (UI+Mock → Visual Verify → Contract → Wire Read → Wire Write → Test & Done) and its gates are defined in [context/build-plan.md](context/build-plan.md) §1. Do not start step N+1 until step N passes its gate.

**The unit of work is one feature — never a phase.** Take a single feature all the way to done (including its backend), then start the next. A phase is a grouping and a milestone, not a work unit.

Never split by layer across a phase — "all Phase 1 UIs, then all Phase 1 backends" is the same inversion as above, just phase-sized. If asked to build a whole phase, build its first feature and report back.
_Exception: Phase 0 has no user-facing surface, so 0.1–0.5 run as a block (still in order)._

## Use the skills

These encode the workflow — prefer them over ad-hoc work:

| Skill           | When                                                                |
| --------------- | ------------------------------------------------------------------- |
| `build-feature` | Implementing any feature/page/screen from the build plan            |
| `add-component` | Creating any reusable UI piece (button, card, table, modal, chart…) |
| `checkpoint`    | Saving/resuming session state; updating the tracker                 |
| `debug`         | Anything broken, erroring, or rendering wrong                       |

## Documentation map

| File                                                       | Purpose                                                                                |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| [context/build-plan.md](context/build-plan.md)             | **What to build** — Feature Loop, Definition of Done, phases 0–3, settled decisions    |
| [context/progress.md](context/progress.md)                 | **What is done** — per-feature status, blockers, session log. Update every session     |
| [context/ui-rules.md](context/ui-rules.md)                 | Design tokens, theme, component styling contract                                       |
| [context/ui-registry.md](context/ui-registry.md)           | Every UI component + its exact classes. **Check before building any component**        |
| [context/architecture.md](context/architecture.md)         | Module structure, data flow, API design                                                |
| [context/database-design.md](context/database-design.md)   | Schema, tables, Prisma models, indexes                                                 |
| [context/code-standards.md](context/code-standards.md)     | Naming, TypeScript, formatting, security standards                                     |
| [context/project-overview.md](context/project-overview.md) | Scope, roles, modules, expected benefits                                               |
| `context/Gsp.html`                                         | Static prototype — **visual identity baseline**, not a spec. Improve on it (see below) |

## Stack

**Frontend**: Next.js · TypeScript · Tailwind CSS · react-icons · react-chartjs-2
**Backend**: Node.js · Express · TypeScript · **Prisma 7** · PostgreSQL (Neon)
**Auth**: JWT + refresh tokens; the **BFF issues httpOnly cookies** — the API itself sets no cookies and stays stateless.

> **Prisma 7 rules.** The connection URL is **not** in `schema.prisma` — Migrate reads it from `apps/api/prisma.config.ts`, and the runtime client is built with the `@prisma/adapter-pg` driver adapter in `src/config/prisma.ts`. Always import that `prisma` singleton; a bare `new PrismaClient()` throws without an adapter. The seed command lives in `prisma.config.ts` (`migrations.seed`), not `package.json`.

## Settled decisions — do not re-litigate

- **Icons**: `react-icons`. The prototype's emoji are replaced with icon components.
- **Charts**: `react-chartjs-2`, styled to the prototype's color mapping and legend layout.
- **Mutations**: refetch after write, **not** optimistic updates.
- **Role model**: **relational** — roles from `user_roles`, capabilities from `role_permissions`. There is **no role column on `users`**. The join table allows many-to-many, but v1 enforces **exactly one role per user at the service layer**.
- **Dashboard role source**: read from the session/JWT **server-side only**. Never accept role as a client parameter — that would let any user request another role's data.

## Conventions

- **Files/folders**: kebab-case (`auth.service.ts`, `member-profile-card.tsx`, `async-handler.ts` — kebab-case wins over the camelCase filenames shown in architecture.md §4.1). **Types/classes**: PascalCase. **Vars/functions**: camelCase. **Constants/env**: UPPER_SNAKE_CASE.
- **Imports**: web uses the `@/` alias; **the API uses relative imports** — `tsc` does not rewrite path aliases in emitted JS. UI comes from the `@/shared/components/ui` barrel; icons only from `@/shared/components/icons`.
- **Responsive**: mobile-first, `min-width` only. Breakpoints `xs` 480 · `md` 768 · `lg2` 900 (custom). Never write `max-*` variants.
- **API responses**: always `{success:true,data,meta?}` or `{success:false,error:{code,message,details?}}` via `sendSuccess`/`sendError`.
- **Backend module shape**: controller · service · repository · routes · validator · schema · types · middleware · index. Controllers stay thin; business logic lives in services; all DB access goes through repositories.
- **Data flow**: UI → feature service → route → controller → service → repository → Prisma → PostgreSQL → shared handlers → UI.
- **Always** use the singleton `asyncHandler` and centralized `errorHandler`. Never swallow errors.
- **Validate on both sides** — frontend and backend. Reject invalid requests early.
- **Every protected route** gets RBAC middleware.
- 2-space indent, semicolons, TypeScript strict, avoid `any`.
- Mock data lives in `src/shared/mocks/<feature>.mock.ts` and is removed from the render path once real data is wired.

## Gotchas

- **Check [context/ui-registry.md](context/ui-registry.md) before building any component** — most already exist. Match their exact classes rather than inventing new ones, then register anything new.
- **Every screen needs loading, empty, and error states drawn** — a blank state fails the visual-verify gate.
- **Responsive is checked at 900px, 768px and 480px** at the visual-verify step, not retrofitted later.
- **The prototype is a baseline, not a ceiling.** `context/Gsp.html` sets the visual identity (palette, elevation, density) — that's binding. Its markup, class names, and layouts are _not_. It has **no loading states, no empty states, no pagination on any of its 9 tables**, broken mobile nav, and two WCAG contrast failures. Improving on it is expected; copying it faithfully ships its defects. Guardrails and the sanctioned-enhancement list: [context/ui-rules.md](context/ui-rules.md) §1, §9, §10.
- **Reuse is strict even though fidelity isn't** — never build a second component that does an existing one's job. Check [context/ui-registry.md](context/ui-registry.md) §9 for components the prototype never had (empty states, skeletons, pagination, confirm dialogs) before assuming you're inventing something.
- Emoji icons and CSS `conic-gradient` charts in the prototype are _visual targets only_ — build them with react-icons and react-chartjs-2.
- **Accessibility fixes are mandatory, not polish**: `#aaa` text (2.32:1) and white-on-`--gold` (2.30:1) both fail WCAG AA. Use `var(--gray)` for muted text; never white on gold; never `outline:none` without a replacement ring.
- [context/build-plan.md](context/build-plan.md) and [context/progress.md](context/progress.md) are tightly coupled: adding a feature to one requires a matching entry and count update in the other.
- Secrets come from env vars only (`DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET`). Never hardcode them.
