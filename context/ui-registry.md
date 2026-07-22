# GSP Management Information System — UI Registry

> **Living document.** Updated after every component is built. Read this before building any new component — **reuse what's here before inventing anything new.** (Reuse is strict; matching the prototype's markup is not — see How to Use.)

This registry catalogs every UI component in the GSP portal, its source location, and the exact classes it uses. The reference implementation is the [Gsp.html](Gsp.html) prototype; the styling contract and design tokens live in [ui-rules.md](ui-rules.md). Stack, module structure, and conventions come from [architecture.md](architecture.md) and [code-standards.md](code-standards.md).

---

## How to Use

**Before building any component:**

1. Check if a similar component already exists here.
2. If **yes** — **reuse it.** Extend it with a variant or prop rather than creating a near-duplicate.
3. If **no** — build it following [ui-rules.md](ui-rules.md), then add it here.

> **Two different rules — don't confuse them:**
>
> **Anti-duplication is strict.** Never build a second component that does what an existing one does. This is what keeps the app coherent.
>
> **Prototype fidelity is not.** `Gsp.html` is a baseline, not a ceiling ([ui-rules.md](ui-rules.md) §1). Its markup and class names are a starting point — improve the layout, structure, and interaction freely, staying on the design tokens. The prototype lacks loading states, empty states, and pagination entirely; several components below must be _better_ than their prototype origin, not equal to it.
>
> When you improve on a prototype component, update its row here to describe what you actually built — the registry documents the **real** implementation, not the mockup's history.

**After building any component** — update this file with the component name, file path, and exact classes used.

**Naming**: kebab-case files and folders, PascalCase component names (per [code-standards.md](code-standards.md) §4). Group by feature module (per [architecture.md](architecture.md) §5).

---

## Legend

- **Status**: `prototype` = exists in Gsp.html only · `built` = implemented in the Next.js app · `planned` = not yet built
- **File**: target path in the Next.js frontend (`src/...`) once built; `Gsp.html` while prototype-only.

---

## Responsive Behavior

Every component must hold up at **900px, 768px, and 480px** — all three, per [ui-rules.md](ui-rules.md) §5. Components not listed here are fluid and need no special handling.

> **Breakpoint convention — settled 2026-07-22: mobile-first.** Base styles are the mobile layout; `xs` (480px), `md` (768px) and the custom `lg2` (900px) `min-width` variants add the larger layouts. Never write `max-*` variants. Screens live in `apps/web/src/shared/design/tokens.ts`. Full table in [ui-rules.md](ui-rules.md) §5.

| Component                  | Behavior across breakpoints                                                                                                             |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Sidebar                    | Fixed 220px ≥768px → off-canvas below (`.sidebar.open` to reveal). **Requires a visible toggle — the prototype's is broken, see below** |
| Main content               | `margin-left: 220px` ≥768px → `0` below                                                                                                 |
| Stat cards (`.stats-grid`) | `auto-fill minmax(200px,1fr)` → 2-up at ≤768px → 1-up at ≤480px                                                                         |
| `.grid-2` / `.grid-3`      | Collapse to 1 column at ≤900px                                                                                                          |
| Tables                     | Never reflow — `.table-wrapper` scrolls horizontally. Keep the wrapper on every table                                                   |
| Forms (`.form-row`)        | 2-column grid → 1 column at ≤768px (applies inside modals too)                                                                          |
| Topbar                     | Padding tightens at ≤768px; `.topbar-search` 220px → 140px                                                                              |
| Page content               | Padding 28px → 16px at ≤768px                                                                                                           |
| Modal                      | `width:100%` capped at 560px; `max-height:90vh` with internal scroll                                                                    |
| Auth card                  | `width:100%` capped at 500px                                                                                                            |
| Badge grid                 | `auto-fill minmax(120px,1fr)` — reflows continuously                                                                                    |
| Donut chart                | `.donut-wrap` wraps chart above legend when narrow                                                                                      |
| Page header row            | `flex-wrap: wrap` — actions drop below the title when narrow                                                                            |
| Notification panel         | Fixed 320px, right-anchored — **verify it doesn't overflow at 360px viewports**                                                         |

### ⚠ Must fix when porting

The prototype's mobile navigation is **broken**: `#menuToggle` has inline `display:none` that nothing ever overrides, so the off-canvas sidebar cannot be opened below 768px. Any App Shell / Sidebar component built from this registry must add a visible toggle at `≤768px`, plus a backdrop and scroll lock. Full detail in [ui-rules.md](ui-rules.md) §5.

---

## 1. Foundations

| Token / Utility                                                | Status        | File                                                 | Notes                                                                                                                                              |
| -------------------------------------------------------------- | ------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Design tokens (colors, radius, shadow, sidebar width, screens) | built         | `src/shared/design/tokens.ts` → `tailwind.config.ts` | Single palette source. **`#aaa` is not ported** and `goldInk` `#8a7500` is the only gold that may carry white text ([ui-rules.md](ui-rules.md) §9) |
| Utility classes (`.flex`, `.gap-*`, `.text-*`, …)              | n/a — dropped | —                                                    | Direct duplicates of native Tailwind utilities; not re-declared ([ui-rules.md](ui-rules.md) §11)                                                   |
| Badge pills                                                    | built         | `src/shared/components/ui/badge.tsx`                 | `<Badge tone="green\|red\|blue\|gold\|gray">`                                                                                                      |
| Custom scrollbar (WebKit)                                      | built         | `src/app/globals.css`                                | Thumb hover darkened `#aaa` → `#9a9a9a`                                                                                                            |
| Focus ring (`:focus-visible`)                                  | built         | `src/app/globals.css`                                | Global green ring. The prototype's three bare `outline:none` rules are not ported                                                                  |
| Icon set                                                       | built         | `src/shared/components/icons.ts`                     | `react-icons` re-exported under semantic names; swap the set in one place                                                                          |
| Reduced-motion guard                                           | built         | `src/app/globals.css`                                | Honours `prefers-reduced-motion`                                                                                                                   |

---

## 2. Layout Components

| Component                    | Status    | File                                                | Exact classes                                                                                                                                                                           |
| ---------------------------- | --------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth screen shell            | **built** | `src/app/(auth)/login/page.tsx`                     | Feature 1.1. Full-viewport `bg-brand-gradient-auth`, centered `AuthCard`                                                                                                                |
| Auth card                    | **built** | `src/features/auth/components/auth-card.tsx`        | Feature 1.1. Header (gradient + monogram badge, no prototype photo — see Sidebar precedent), `role="tablist"` Log In / Sign Up tabs (real `aria-selected`/`aria-controls`, not just `.active`), body                |
| App shell (2-column)         | **built** | `src/shared/components/layout/app-shell.tsx`        | `<AppShell>`. Owns off-canvas state, scroll lock, Escape-to-close, skip link. Real `nav`/`header`/`main` landmarks                                                                      |
| Sidebar                      | **built** | `src/shared/components/layout/sidebar.tsx`          | `<Sidebar isOpen onClose>`. Off-canvas below `md`, fixed above. Backdrop closes it; focus trapped while open. User block is a placeholder until 1.1                                     |
| Nav section label + nav item | **built** | `src/shared/components/layout/nav-items.ts`         | `NAV_SECTIONS` data + rendering in `Sidebar`. Active state = gold-2 left border + `white/15`. Role filtering is feature 1.2                                                             |
| Topbar                       | **built** | `src/shared/components/layout/topbar.tsx`           | `<Topbar title onOpenSidebar isSidebarOpen>`. **Menu toggle visible below `md`** — fixes the prototype's dead `#menuToggle`. Search/bell present but disabled until their features land |
| Page container               | **built** | `src/shared/components/layout/page-header.tsx`      | `<PageHeader title description actions>`. Routing replaces the prototype's `.page.active` display toggling                                                                              |
| Placeholder page             | **built** | `src/shared/components/layout/placeholder-page.tsx` | Phase 0 only — each is replaced wholesale by its feature's real screen                                                                                                                  |

---

## 3. Data Display

| Component                | Status        | File                                 | Exact classes                                                                                                                                                                                                                                                    |
| ------------------------ | ------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stat card                | prototype     | Gsp.html                             | Feature 1.5. `.stats-grid`, `.stat-card` + variant, `.stat-icon`, `.stat-info`                                                                                                                                                                                   |
| Card                     | **built**     | `src/shared/components/ui/card.tsx`  | `<Card>` + `<CardHeader title subtitle actions as>`. `as` keeps heading order correct                                                                                                                                                                            |
| Grid layouts             | n/a — dropped | —                                    | Use Tailwind `grid-cols-1 lg2:grid-cols-2` / `lg2:grid-cols-3` directly; a wrapper component adds nothing                                                                                                                                                        |
| Table                    | **built**     | `src/shared/components/ui/table.tsx` | `<TableWrapper>` (keeps `overflow-x:auto` — never remove) + `<Table caption>` `<TableHead>` `<TableBody>` `<TableRow>` `<TableHeaderCell>` (`scope="col"`) `<TableCell>` `<TableAvatar>`. Adds a required accessible name and a keyboard-reachable scroll region |
| Activity feed            | prototype     | Gsp.html                             | `.activity-item`, `.activity-dot` + color, `.activity-text`, `.activity-time`                                                                                                                                                                                    |
| Avatar group             | prototype     | Gsp.html                             | `.avatar-group`, `.av`, `.av-more`                                                                                                                                                                                                                               |
| Progress bar             | prototype     | Gsp.html                             | `.progress-bar`, `.progress-fill` (width inline)                                                                                                                                                                                                                 |
| Badge / achievement card | prototype     | Gsp.html                             | `.badge-grid`, `.badge-card` (`.earned`), `.badge-icon`, `.badge-name`, `.badge-cat`                                                                                                                                                                             |
| Profile header           | prototype     | Gsp.html                             | `.profile-header`, `.profile-avatar-lg`, `.profile-info`, `.role-tag`                                                                                                                                                                                            |

---

## 4. Charts (prototype uses CSS; port to ChartJS)

| Component   | Status    | File     | Exact classes                                                                                            |
| ----------- | --------- | -------- | -------------------------------------------------------------------------------------------------------- |
| Bar chart   | prototype | Gsp.html | `.bar-chart`, `.bar-item`, `.bar`, `.bar-label`, `.bar-val` (height inline)                              |
| Donut chart | prototype | Gsp.html | `.donut-wrap`, `.donut` (conic-gradient), `.donut-inner`, `.donut-legend`, `.legend-item`, `.legend-dot` |
| Calendar    | prototype | Gsp.html | `.cal-grid`, `.cal-day-name`, `.cal-day` (`.today`/`.has-event`/`.empty`)                                |

> **Note**: These are CSS/JS placeholders. Replace with `react-chartjs-2` (ChartJS is the declared analytics lib in [project-overview.md](project-overview.md)) while keeping the same color mapping and legend layout — see [ui-rules.md](ui-rules.md) §9.

---

## 5. Forms & Inputs

| Component               | Status    | File                                         | Exact classes                                                                                                                                     |
| ----------------------- | --------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Form field wrapper      | **built** | `src/shared/components/ui/form-field.tsx`    | `<FormField label error hint required>`. Wires `htmlFor`/`id`/`aria-describedby`/`aria-invalid` via context, so inputs need no repetition. See §9 |
| Text/email/number input | **built** | `src/shared/components/ui/input.tsx`         | `<Input>`. Shared `CONTROL_CLASSES` skin + green focus ring                                                                                       |
| Select                  | **built** | `src/shared/components/ui/select.tsx`        | `<Select options placeholder>`. Native select with a chevron. Searchable `Combobox` still planned (§9)                                            |
| Textarea                | **built** | `src/shared/components/ui/textarea.tsx`      | `<Textarea>`                                                                                                                                      |
| Password toggle         | **built** | `src/shared/components/ui/input.tsx`         | `<PasswordInput>`. Real button with `aria-label` + `aria-pressed`, replacing the prototype's bare emoji                                           |
| Search input            | **built** | `src/shared/components/ui/search-input.tsx`  | `<SearchInput label onClear>`. Replaces the prototype's ad hoc inline-styled copies                                                               |
| Toggle switch           | **built** | `src/shared/components/ui/toggle-switch.tsx` | `<ToggleSwitch label hideLabel>`. `sr-only` checkbox stays keyboard focusable; ring draws on the track                                            |
| Password strength meter | **built** | `src/features/auth/components/password-strength-meter.tsx` | Replaces `.strength-bar`/`.strength-fill`. `scorePassword()` is the same 4-check heuristic as the prototype's `checkStrength`                     |
| Role selector           | **built** | `src/features/auth/components/role-selector.tsx`    | Replaces `.role-selector`/`.role-btn`. Real radio group (`sr-only` inputs + styled labels, same technique as `ToggleSwitch`) instead of `onclick`-`<div>`s. Shared by login (demo role) and signup (account type) |
| Auth helper links       | **built** | `src/features/auth/components/login-form.tsx`        | Forgot-password link, demo divider, "Fill Demo Credentials" button, tab-switch text — small enough to live inline in the form rather than as separate atoms |

---

## 6. Actions & Buttons

| Component                     | Status    | File                                  | Exact classes                                                                                                                                                                                                                                                                            |
| ----------------------------- | --------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button (all variants + sizes) | **built** | `src/shared/components/ui/button.tsx` | One component: `<Button variant="green\|outline\|red\|gold\|blue\|gray\|primary" size="sm\|md" isLoading leadingIcon trailingIcon>`. **`gold` renders `#8a7500`, not `--gold`** — white on `--gold` is 2.30:1 ([ui-rules.md](ui-rules.md) §9). `primary` is the full-width auth gradient |

---

## 7. Feedback & Overlays

| Component          | Status    | File                                          | Exact classes                                                                                                                                                                                 |
| ------------------ | --------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modal              | **built** | `src/shared/components/ui/modal.tsx`          | `<Modal isOpen onClose title footer size dismissible>`. Portalled, focus-trapped, focus restored, Escape + backdrop close, body scroll locked, `role="dialog"`/`aria-modal`/`aria-labelledby` |
| Confirm dialog     | **built** | `src/shared/components/ui/confirm-dialog.tsx` | `<ConfirmDialog tone="danger\|warning\|default">`. Built on `Modal`. **Required for every destructive action** — see §9                                                                       |
| Alert banner       | **built** | `src/shared/components/ui/alert.tsx`          | `<Alert tone="error\|success\|info\|warning">`. `role="alert"` by default. For form/validation messages only — a failed fetch uses `ErrorState`                                               |
| Toast              | **built** | `src/shared/components/ui/toast.tsx`          | `<ToastProvider>` + `useToast().showToast(msg, tone)`. `aria-live` region, manually dismissible, mounted once in the root layout                                                              |
| Notification panel | prototype | Gsp.html                                      | Feature 2.5. `.notif-panel`, `.notif-item` (`.unread`), `.notif-icon`, `.notif-footer`                                                                                                        |
| Forgot-password dialog | **built** | `src/features/auth/components/forgot-password-modal.tsx` | Feature 1.1. Built on `Modal`. **Deviation**: replaces the prototype's `prompt()`/`alert()` pair — those block the thread and bypass the focus-trap/`aria-live` machinery the rest of the app relies on |

---

## 8. Settings

| Component        | Status    | File     | Exact classes                                                                         |
| ---------------- | --------- | -------- | ------------------------------------------------------------------------------------- |
| Settings section | prototype | Gsp.html | `.settings-section`, `.settings-row`, `.settings-label` (`.label-main`, `.label-sub`) |
| Settings toggle  | prototype | Gsp.html | `.toggle-switch`, `.slider`                                                           |

---

## 9. Required — Not in the Prototype

These do **not** exist in `Gsp.html` but are required by the Definition of Done ([build-plan.md](build-plan.md) §3) or by [ui-rules.md](ui-rules.md) §10. Build them in Phase 0.2 alongside the ported base components — every feature screen from Phase 1 onward depends on them.

| Component                                          | Status    | File / why it's needed                                                                                                                                          |
| -------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EmptyState`                                       | **built** | `src/shared/components/ui/empty-state.tsx` — icon + explanation + primary action. The prototype has 9 tables and zero empty states                              |
| `TableSkeleton` / `CardSkeleton` / `ChartSkeleton` | **built** | `src/shared/components/ui/skeleton.tsx` — plus the `Skeleton` primitive and `SkeletonRegion`, which announces one `aria-live` status instead of a wall of boxes |
| `ErrorState`                                       | **built** | `src/shared/components/ui/error-state.tsx` — inline failure panel that owns the retry. Distinct from `Alert`                                                    |
| `Pagination`                                       | **built** | `src/shared/components/ui/pagination.tsx` — range summary + compact page list with ellipses. `buildPageRange` is unit-tested                                    |
| `ConfirmDialog`                                    | **built** | `src/shared/components/ui/confirm-dialog.tsx` — danger/warning/default tones, built on `Modal`                                                                  |
| `FormField`                                        | **built** | `src/shared/components/ui/form-field.tsx` — label + control + error/hint, with the a11y wiring done via context                                                 |
| `SearchInput`                                      | **built** | `src/shared/components/ui/search-input.tsx` — one standard version with a real label and clear button                                                           |
| `SortableTableHeader`                              | planned   | Column sorting for directory/log tables. Extend `TableHeaderCell` rather than forking it — needed by 1.3                                                        |
| `Combobox`                                         | planned   | `Select` covers native cases; filters and troop pickers need a searchable variant. Needed by 1.3                                                                |
| `DatePicker`                                       | planned   | Events, renewals, financial periods, report ranges. Needed by 1.3 (renewal)                                                                                     |
| `FileUpload`                                       | planned   | Member avatars, report attachments                                                                                                                              |
| `Tabs`                                             | planned   | Prototype only has `.auth-tabs`, hardcoded for auth. Needed generally (profile, settings, report types)                                                         |
| `Dropdown` / `ActionMenu`                          | planned   | Table rows currently show inline buttons; a row action menu scales better                                                                                       |
| `Tooltip`                                          | planned   | Icon-only buttons and truncated cells                                                                                                                           |
| `Breadcrumb`                                       | planned   | Detail pages (member profile, event detail) need a way back                                                                                                     |

Built rows stay listed here alongside their planned siblings so the §9 set reads as one group; the components themselves live in `src/shared/components/ui` and are exported from its barrel.

---

## 10. Import Convention

Everything in `src/shared/components/ui` is re-exported from one barrel:

```ts
import { Button, Card, FormField, Input, Modal, useToast } from "@/shared/components/ui";
```

Layout pieces import from their own paths (`@/shared/components/layout/page-header`). Icons always come from `@/shared/components/icons` — never import from `react-icons/*` directly in a feature, or the icon set stops being swappable in one place.

---

## Change Log

| Date       | Component(s)                    | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-22 | Auth screen (Feature 1.1, Loop step 1) | Built `AuthCard`, `LoginForm`, `SignupForm`, `RoleSelector`, `PasswordStrengthMeter`, `ForgotPasswordModal` in `src/features/auth/components/`. No new base primitives — all compose existing kit components. `ForgotPasswordModal` replaces the prototype's `prompt()`/`alert()` flow. Awaiting visual sign-off. |
| 2026-07-22 | 20 components (Phase 0.2 + 0.3) | Ported the foundations, buttons, forms and feedback sets to Next.js/Tailwind and built all seven §9 components the prototype lacked. Settled the breakpoint convention as mobile-first with a custom `lg2: 900px`. Applied both WCAG fixes at the token layer (`#aaa` not ported; gold buttons use `#8a7500`). Dropped `.grid-2`/`.grid-3` and the hand-rolled utility classes in favour of native Tailwind. Added `Table` primitives ahead of their section so `TableSkeleton`/`EmptyState`/`Pagination` could be verified. Built the app shell with all four prototype mobile-nav defects fixed. |
| 2026-07-22 | All                             | Initial registry seeded from Gsp.html prototype. All entries `status: prototype` until ported to Next.js.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
