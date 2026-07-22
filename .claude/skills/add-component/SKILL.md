---
name: add-component
description: Build a new UI component for the GSP portal without duplicating an existing one. Use when creating any button, card, table, modal, form field, chart, badge, panel, or other reusable UI piece (e.g. "make a stat card component", "add a dropdown", "create a data table", "I need a new modal"). Enforces registry-first lookup, GSP design tokens, and registry update after building.
---

# Add Component — GSP MIS

Enforces the registry discipline: **reuse what exists before inventing anything new.**

> **Reuse is strict; prototype fidelity is not.** Never build a second component that does an existing one's job. But `Gsp.html` is a _baseline, not a ceiling_ ([ui-rules.md](../../../context/ui-rules.md) §1) — improve on its layout, structure, and interactions freely as long as you stay on the design tokens.

## 1. Check the registry FIRST — always

Read [ui-registry.md](../../../context/ui-registry.md) before writing a single line.

- **Exists?** → Reuse it. Do not create a near-duplicate with a different name.
- **Close but not exact?** → Extend the existing component with a variant/prop. Prefer a variant over a new component.
- **Listed under §9 "Required — Not in the Prototype"?** → Build it from scratch; there is no prototype original. Check that section before assuming you're inventing something unplanned.
- **Nothing fits?** → Build new, following the steps below.

If a similar component exists in the [Gsp.html](../../../context/Gsp.html) prototype but isn't yet ported, **start from that one** — inherit its visual identity, then improve its structure, states, and accessibility rather than copying it verbatim.

## 2. Build it

- **Tokens only.** Colors, radius, shadow, spacing come from [ui-rules.md](../../../context/ui-rules.md) §2. Never hardcode a hex value that a token already covers.
- **Inherit the prototype's visual identity, improve its execution.** [Gsp.html](../../../context/Gsp.html) sets the look (colors, elevation, roundness, density); its markup and class names are a starting point, not a contract. Improving layout, hierarchy, or interaction is expected — see the sanctioned list in [ui-rules.md](../../../context/ui-rules.md) §10.
- **Accessibility is not optional.** The prototype fails it: `#aaa` text (2.32:1) and white-on-gold (2.30:1) both fail WCAG AA, and `outline:none` appears 3×. Use `var(--gray)` for muted text, never white on `--gold`, and always keep a visible focus ring ([ui-rules.md](../../../context/ui-rules.md) §9).
- **Conventions** ([code-standards.md](../../../context/code-standards.md) §4, §7.1): kebab-case files, PascalCase component names, small and focused, functional components, UI logic separate from business logic.
- **Location:** shared/reusable → `src/shared/components/`; feature-specific → `src/features/<feature>/components/`.
- **Typed props.** No `any`. Variants as a union type, not loose strings.
- **States:** handle loading, empty, error, and disabled where the component can encounter them.
- **Responsive:** verify at 900px, 768px and 480px per [ui-rules.md](../../../context/ui-rules.md) §5.
- **Accessibility:** labels tied to inputs, visible focus ring (already in tokens), keyboard-operable interactive elements, modals trap focus.

## 3. Verify visually

Render it in every variant and state before considering it done. Compare against the prototype for _visual identity_ — colors, elevation, density, roundness — not for identical markup. This is the same gate as Feature Loop step 2; if it's part of a feature build, get the user's confirmation.

**If you deliberately improved on the prototype, say so and say why.** The reviewer needs to judge the deviation, not discover it later.

## 4. Register it — required

Add a row to the correct section of [ui-registry.md](../../../context/ui-registry.md):

| Field         | Value                                                  |
| ------------- | ------------------------------------------------------ |
| Component     | Its name                                               |
| Status        | `built`                                                |
| File          | Real path (`src/shared/components/...`)                |
| Exact classes | Every class it uses, including variant/state modifiers |

If you ported a prototype component, flip its existing row from `prototype` → `built` and replace `Gsp.html` with the real path rather than adding a second row.

Add a Change Log entry at the bottom of the registry with today's date.

If the component introduced a genuinely new styling pattern or token, also update [ui-rules.md](../../../context/ui-rules.md).

## Hard rules

- Never build a component without checking the registry first.
- Never leave a built component unregistered — an unregistered component gets duplicated by the next session.
- Never hardcode values that tokens cover.
- Never create a second component that does what an existing one already does.
