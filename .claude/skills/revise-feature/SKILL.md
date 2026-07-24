---
name: revise-feature
description: Change already-correct behavior in a feature already marked done (●) in progress.md — not a bug fix (use `debug`) and not new scope (use `build-feature`). Use when the user asks to change, adjust, tweak, redesign, or refactor something in a feature that already works as built, e.g. "change how the Reports table paginates", "make Finance show a different currency format", "redesign the Profile header". Scopes the blast radius first so shared components, schema, or cross-feature reuse aren't broken silently.
---

# Revise a Done Feature — GSP MIS

A revision changes behavior that is already correct and already shipped. This is neither `debug` (nothing is broken) nor `build-feature` (no new Loop steps are being entered) — it's a third case with its own risk: silently breaking a *different* feature that depends on what you're about to touch.

## 1. Locate the feature and its real state

- Read the feature's entry in [progress.md](../../../context/progress.md) — status, Loop step, screens, components, endpoints, **files**. This is the actual file list to change, not a guess.
- If progress.md and the code disagree, trust the code and note the drift.

## 2. Classify blast radius — before changing anything

Grep for what else imports/consumes the thing you're about to change. Two cases:

**Isolated** — every file you'd touch lives inside that feature's own module:

- `apps/api/src/modules/<domain>/*`
- `apps/web/src/app/(app)/<feature>/*`
- `apps/web/src/features/<feature>/*`

Nothing else in the app imports these. Safe to revise directly.

**Shared** — the change reaches into any of:

| Shared surface                                                                                   | Where to check consumers                                                     |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `apps/web/src/shared/components/ui/*`                                                              | [ui-registry.md](../../../context/ui-registry.md) — lists every consumer's exact classes |
| A component progress.md calls out as cross-feature reuse (e.g. `PasswordStrengthMeter`, `MemberStatusBadge`) | grep the component name across `apps/web/src`                                |
| A Prisma model (`schema.prisma`)                                                                    | grep the model name across `apps/api/src/modules/*/repository`               |
| Auth/session/JWT shape, RBAC middleware, API envelope, `asyncHandler`/`errorHandler`                | every protected route — treat as app-wide                                    |

If it's shared, **every consumer found is now in scope for verification**, even though only one prompted the request.

## 3. Revise

- Follow the same layer boundaries and conventions as new work ([code-standards.md](../../../context/code-standards.md) §6, [build-plan.md](../../../context/build-plan.md) §2).
- Don't re-run the full 6-step Feature Loop for an isolated change — that's for new features. Do re-check the Definition of Done items the revision could plausibly affect (states drawn, validation both sides, RBAC still correct).
- Schema changes: never edit an applied migration — add a new one.

## 4. Verify — scoped to what's actually at risk

- **Isolated**: visually re-check the changed screen's states (loading/empty/error) at 900/768/480px; re-run that module's own test file.
- **Shared**: visually re-check *every* consumer screen found in step 2, not just the one requested — a shared Button/Table/schema change with no visible regression on the requesting screen can still break a sibling silently.
- **Always**: `npm run typecheck && npm run lint && npm test` in both workspaces. This is the cheap net that catches a break in a feature you didn't think to check manually.

## 5. Record

- Append to the feature's existing [progress.md](../../../context/progress.md) entry — do not renumber its Loop step or re-mark it as a new feature. Note what changed and why under its existing status.
- If a shared component's contract changed, update [ui-registry.md](../../../context/ui-registry.md) (exact classes, and which features now consume the new version).
- Add a line to the Session Log naming the feature, what was revised, and confirmation that other consumers were re-verified (or that none existed).
- Report to the user: **what changed → blast radius (isolated/shared + consumers checked) → how it was verified.**
