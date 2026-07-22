---
name: debug
description: Systematically diagnose and fix a bug in the GSP Management Information System. Use when something is broken, erroring, returning wrong data, rendering incorrectly, or behaving unexpectedly — e.g. "this page is blank", "the API returns 500", "login isn't working", "the table shows no data", "styles look wrong", "debug this". Traces the issue through the UI → service → route → controller → service → repository → Prisma → PostgreSQL stack.
---

# Debug — GSP MIS

Diagnose the actual root cause before changing anything. Do not guess-and-patch.

## 1. Reproduce & Localize

Establish the facts first:

- **What was expected vs. what happened?** Get the exact error text, status code, or screenshot description.
- **Where in the stack?** Use the symptom to pick a starting layer:

| Symptom                                       | Start at                                                                                                                |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Blank page, React error, hydration mismatch   | Frontend component / page                                                                                               |
| Styles wrong, layout broken, unresponsive     | [ui-rules.md](../../../context/ui-rules.md) + [ui-registry.md](../../../context/ui-registry.md) — is the class correct? |
| Data missing/wrong on screen, but API is fine | Frontend feature service / state                                                                                        |
| 4xx response                                  | Validator / RBAC middleware / request shape                                                                             |
| 500 response                                  | Controller → service → repository chain                                                                                 |
| Wrong or empty query results                  | Repository / Prisma query / seed data                                                                                   |
| Auth loop, 401, session lost                  | BFF cookie handling ↔ JWT/refresh flow                                                                                  |

- **Is it mock or real data?** Per [build-plan.md](../../../context/build-plan.md) §1, a feature at Loop step ≤3 still renders mocks — check [progress.md](../../../context/progress.md) for the feature's step before assuming the backend is involved.

## 2. Trace the Data Flow

Follow the golden path in order ([architecture.md](../../../context/architecture.md) §9) and confirm the data is correct at each hop:

```
UI → feature service → route → controller → service → repository → Prisma → PostgreSQL
                                    ↓
                          shared handlers → UI
```

Read the actual code at each hop. Add temporary logging at the boundary where the data first goes wrong. **Narrow to a single layer before forming a hypothesis.**

## 3. Check the Usual Suspects First

Ordered by how often they're the cause in this codebase:

1. **Request/response shape mismatch** — the TypeScript contract and the actual payload disagree.
2. **Missing `asyncHandler` wrapper** — an async controller throwing outside the error handler ([code-standards.md](../../../context/code-standards.md) §6.5).
3. **RBAC middleware** rejecting a role that should be allowed (or the role value not matching the enum).
4. **Validation** rejecting valid input, or missing entirely so bad data reaches the service.
5. **Prisma relation/include missing** — related records come back `undefined`.
6. **Frontend state not refetching** after a write, so the UI shows stale data.
7. **Class typo / unregistered component** — check the exact class against [ui-registry.md](../../../context/ui-registry.md).

## 4. Fix

- Fix the **root cause**, not the symptom. If the fix is a workaround, say so explicitly.
- Respect layer boundaries ([code-standards.md](../../../context/code-standards.md) §6): no business logic in controllers, no HTTP concerns in services, no direct DB access outside repositories.
- Never swallow an error to make a symptom disappear.
- Match surrounding code style; don't reformat unrelated lines.

## 5. Verify

- Reproduce the original failing case → confirm it now passes.
- Check the happy path still works.
- Check the adjacent failure paths (invalid input, wrong role, empty result).
- If the feature was already marked `●` in [progress.md](../../../context/progress.md), re-confirm its Definition of Done ([build-plan.md](../../../context/build-plan.md) §3) still holds.

## 6. Record

- If the bug revealed a blocker or unfinished work, add it to the **Blockers** table in [progress.md](../../../context/progress.md).
- If a component's classes changed, update [ui-registry.md](../../../context/ui-registry.md).
- Report to the user: **root cause → fix → how it was verified.** State plainly if anything remains unresolved.
