---
name: checkpoint
description: Save or restore where GSP development left off. Use when the user says "remember where we left off", "save progress", "checkpoint", "update the tracker", "where did we stop", "what's next", "catch me up", or when wrapping up / resuming a work session. Writes the current state into context/progress.md (SAVE) or reads it back to resume work (RESUME).
---

# Checkpoint — Save / Resume GSP Development State

All state lives in [progress.md](../../../context/progress.md). This skill keeps it accurate so no context is lost between sessions.

Decide the mode from what the user asked:

- **SAVE** — "remember where we left off", "save progress", "update the tracker", end of a session.
- **RESUME** — "where did we stop", "what's next", "catch me up", start of a session.

If ambiguous, RESUME first (read state), then ask whether to continue that work.

---

## Mode: SAVE

### 1. Determine what actually changed

Do not trust memory of the conversation alone — verify against the repo:

- Check which files were created/modified this session.
- For each touched feature, determine its true Feature Loop step ([build-plan.md](../../../context/build-plan.md) §1):
  - UI built with mock, not yet reviewed → **◔**
  - Human confirmed the visuals → **◑**
  - Real data renders on screen → **◕**
  - Writes wired + validated + RBAC + tested → **●**
- **Do not mark a feature ◑ unless the user actually confirmed the visual check.** That gate requires human sign-off.
- **Do not mark ● unless every Definition of Done item ([build-plan.md](../../../context/build-plan.md) §3) is genuinely met.** Partial work stays at its real step with the gap written under **Remaining**.

### 2. Update [progress.md](../../../context/progress.md)

- Header: `Last updated`, `Current phase`, `Current feature`.
- The feature's entry: status symbol, Loop step, screens, components, endpoints, **files**, **Remaining**, **Notes**.
- **Blockers** table — anything that stopped progress, with enough detail to act on later.
- **Open Decisions** — mark any that got resolved, and record the decision.
- **Cross-Cutting Checklist** — tick items that became true.
- **Summary Dashboard** — recount the per-phase totals and overall completion.
- **Session Log** — add a new row at the top: date · worked on · outcome · **next step**.

The _next step_ field matters most. Write it so someone with zero context can pick it up: name the file, the feature, and the exact Loop step to perform.

### 3. Update sibling docs if applicable

- New/changed UI components → [ui-registry.md](../../../context/ui-registry.md) (status `prototype` → `built`, real file path, exact classes).
- New styling patterns or tokens → [ui-rules.md](../../../context/ui-rules.md).

### 4. Confirm to the user

Report briefly: what was recorded, the feature's new status, and the next step written down.

---

## Mode: RESUME

### 1. Read state

Read [progress.md](../../../context/progress.md) — the header, the Session Log's newest entry, the current feature's full entry, plus Blockers and Open Decisions.

### 2. Verify the record matches reality

The tracker can drift. Spot-check that the files named in the current feature's entry exist and are in the state described. If they disagree, trust the code and correct [progress.md](../../../context/progress.md).

### 3. Brief the user

Report concisely:

- **Where we are** — phase, feature, Loop step, overall completion.
- **What was last done** — from the newest Session Log entry.
- **What's next** — the recorded next step.
- **Anything in the way** — open blockers or unresolved decisions that gate the next step.

### 4. Continue

Pick up at the recorded next step. Re-read [build-plan.md](../../../context/build-plan.md) for that feature's scope and Done gate, and [ui-registry.md](../../../context/ui-registry.md) before building any component. If a blocker or open decision gates the work, raise it before proceeding rather than guessing.
