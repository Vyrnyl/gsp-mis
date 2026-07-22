# GSP Management Information System

Web platform for the **Girl Scouts of the Philippines** — membership, events, attendance, badges, finance, reports, and analytics with role-based access for Administrators, the Executive Council, and Troop Leaders.

> **Status: Phase 0 complete — next up is 1.1 Authentication.** The monorepo is scaffolded (`apps/web` Next.js, `apps/api` Express + Prisma 7) with the design system ported, the app shell navigable, and the backend spine live. 0.2 and 0.3 passed visual sign-off on 2026-07-22. The database is live on **Neon PostgreSQL** — the `init` migration is applied and seeded, and `GET /api/v1/health` reports `database: up`. Nothing is outstanding for Phase 0. Live detail in [context/progress.md](context/progress.md).

```bash
npm install
npm run dev        # web  → http://localhost:3000  (start at /gallery)
npm run dev:api    # api  → http://localhost:4000/api/v1/health
```

The API needs `apps/api/.env` — copy `apps/api/.env.example` and fill it in. It refuses to boot without every secret, by design.

---

## How to work on this project

You mostly just talk normally. The documentation and skills are plumbing — they load themselves.

### What loads automatically

- **`CLAUDE.md`** is read at the start of every Claude Code session. You never open it or mention it. It carries the project rules and settled decisions so nothing gets re-litigated.
- **`context/*.md`** are read on demand by Claude or by a skill. You don't paste them into chat.

### What you trigger

Skills fire from plain English — no slash commands, no filenames:

| Say something like…                                              | Runs            | What happens                                                                                |
| ---------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------- |
| "build the membership page" · "build 1.3" · "next feature"       | `build-feature` | Runs the 6-step Feature Loop on **one** feature; stops at the visual gate for your sign-off |
| "I need a dropdown" · "make a stat card"                         | `add-component` | Checks the registry first, builds to design tokens, registers it after                      |
| "save progress" · "where did we stop" · "catch me up"            | `checkpoint`    | Writes or reads `context/progress.md`                                                       |
| "this page is blank" · "API returns 500" · "login isn't working" | `debug`         | Traces UI → service → route → controller → repository → Prisma                              |

---

## A typical session

**1. Start** — say _"catch me up."_
Claude reads [context/progress.md](context/progress.md) and reports the current feature, its Feature Loop step, and any blockers.

**2. Work** — say _"continue"_ or name a feature, e.g. _"build 1.3."_
The build stops partway and **shows you the page with mock data**, then waits.

> **This pause is the whole method.** Nothing gets wired to a backend until you confirm the UI looks right. If you're ever asked to approve something you can't see, that's a bug in the process — push back.

**3. End** — say _"save progress."_
The tracker and component registry are updated so the next session resumes cleanly.

---

## The core rule

**UI-first, mock-data-first.** Every feature is built as a full, visible page with mock data and verified by you _before any logic is written_. Then functionality is wired to that UI step by step.

**There are no invisible backend phases.** If you can't see it on screen, it isn't done.

The six steps — UI+Mock → Visual Verify → Contract → Wire Read → Wire Write → Test & Done — and the gate each must pass are defined in [context/build-plan.md](context/build-plan.md) §1.

### Build one feature at a time — not a whole phase

A phase is a grouping and a milestone, not a unit of work. Take **one feature** all the way through the loop to done, including its backend, then start the next.

```
❌ All Phase 1 UIs  →  then all Phase 1 backends
✅ 1.1 done  →  1.2 done  →  1.3 done  →  …
```

Splitting by layer across a phase is the same inversion the method exists to prevent — just phase-sized. It also means reviewing several screens cold with no working data behind any of them, and learning a lesson in feature 1.1 five features too late.

So say _"build 1.3"_ or _"next feature"_ — not _"build Phase 1."_ Use the phase boundary as a **checkpoint**: when every feature in it is done, verify the phase exit criteria before opening the next.

_Phase 0 is the exception — it's scaffolding with no user-facing surface, so 0.1–0.5 run as a block._

---

## Where to look things up

| Question                                     | File                                                                                                                    |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| What am I building next?                     | [context/build-plan.md](context/build-plan.md)                                                                          |
| What's actually done?                        | [context/progress.md](context/progress.md)                                                                              |
| What color / class / token is this?          | [context/ui-rules.md](context/ui-rules.md)                                                                              |
| Does this component already exist?           | [context/ui-registry.md](context/ui-registry.md)                                                                        |
| What tables and models exist?                | [context/database-design.md](context/database-design.md)                                                                |
| How are modules and APIs structured?         | [context/architecture.md](context/architecture.md)                                                                      |
| What are the naming/code rules?              | [context/code-standards.md](context/code-standards.md)                                                                  |
| What's the full scope and who are the users? | [context/project-overview.md](context/project-overview.md)                                                              |
| How should a screen look?                    | Open `context/Gsp.html` in a browser — it's the **visual baseline, not a spec**; the build is expected to improve on it |

Two of these are living documents that change as you build: **progress.md** (updated every session) and **ui-registry.md** (updated whenever a component is built).

---

## Stack

**Frontend** — Next.js 15 · TypeScript · Tailwind CSS 3.4 · react-icons · react-chartjs-2 · Vitest
**Backend** — Node.js · Express · TypeScript · Prisma 7 (node-postgres adapter) · PostgreSQL (Neon) · Vitest + supertest
**Auth** — JWT + refresh tokens; the BFF issues httpOnly cookies, the API stays stateless _(feature 1.1)_

```
apps/web/src/  app/            routes — (app)/ group wraps everything in the shell
               shared/         components/{ui,layout} · hooks · design/tokens.ts · utils
apps/api/src/  modules/<domain>/   controller · service · repository · routes · types · index
               shared/         handlers/{async-handler,error-handler} · utils · constants
               config/         env.ts (fails fast) · prisma.ts (singleton + driver adapter)
apps/api/      prisma.config.ts    Migrate's datasource + seed command (Prisma 7)
apps/api/prisma/  schema.prisma · seed.ts · migrations/
```

---

## Roadmap

| Phase    | Scope                                                                           | Features |
| -------- | ------------------------------------------------------------------------------- | -------- |
| **0** ✅ | Foundation — tooling, design system, app shell, backend spine, DB schema + seed | 5        |
| **1**    | Core — auth, role-based nav, membership, approval, dashboard, organization      | 6        |
| **2**    | Activities — events, attendance, activity reports, badges, notifications        | 5        |
| **3**    | Finance, reports (PDF/Excel), analytics, settings/admin, profile                | 5        |

**21 features total.** Full detail in [context/build-plan.md](context/build-plan.md); live status in [context/progress.md](context/progress.md).

---

## Getting started

```bash
npm install
npm run dev        # web → http://localhost:3000  ·  component gallery at /gallery
npm run dev:api    # api → http://localhost:4000/api/v1/health
```

The database is already migrated and seeded on Neon — `apps/api/.env` just needs to point at it (copy `apps/api/.env.example` and fill in `DATABASE_URL` plus the JWT/cookie secrets; the API refuses to boot without them). If you're pointing at a fresh database instead, run `npm run db:migrate` then `npm run db:seed` first.

Phase 0 is signed off. Say **"build 1.1"** to start Authentication — where the UI-first rhythm really begins.
